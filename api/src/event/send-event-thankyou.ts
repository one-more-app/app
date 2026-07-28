import 'dotenv/config';
import {
  appendFile,
  mkdir,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import dataSource from '../database/data-source.js';
import {
  renderEventThankYouEmail,
  type EventThankYouNeighbor,
  type EventThankYouRankRow,
} from './emails/event-thankyou-template.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = resolve(__dirname, '../../tmp/event-emails');
const SENT_LOG_PATH = join(PREVIEW_DIR, 'sent-emails.jsonl');
const LOGO_PATH = resolve(__dirname, 'emails/assets/logo-white-text.png');
const HUMAN_PATH = resolve(
  __dirname,
  '../../../client/public/images/marcus.png',
);
const MOCKUP_PATH = resolve(__dirname, 'emails/assets/app-tier-mockup.png');
const FONT_WOFF2_PATH = resolve(__dirname, 'emails/fonts/TBJ-One-More.woff2');
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.one_more.app';
const LOGO_CID = 'one-more-logo';
const HUMAN_CID = 'one-more-human';
const MOCKUP_CID = 'one-more-app-mockup';
const SEND_BATCH_SIZE = 30;
const SEND_BATCH_DELAY_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

type RankedEntryRow = {
  email: string;
  firstName: string;
  lastName: string;
  exercise: 'pull_up' | 'dips' | 'push_up';
  gender: 'male' | 'female';
  reps: number;
  rank: string | number;
};

type Participant = {
  email: string;
  firstName: string;
  lastName: string;
  ranks: EventThankYouRankRow[];
};

const EXERCISE_LABELS: Record<RankedEntryRow['exercise'], string> = {
  pull_up: 'Tractions',
  dips: 'Dips',
  push_up: 'Pompes',
};

const GENDER_LABELS: Record<RankedEntryRow['gender'], string> = {
  male: 'Hommes',
  female: 'Femmes',
};

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

function printUsage(): void {
  console.log(`Usage:
  npm run event:thankyou -- --dry-run
  npm run event:thankyou -- --dry-run --sample
  npm run event:thankyou -- --to toi@exemple.com [--email participant@exemple.com] [--limit N] [--sample]
  npm run event:thankyou -- --send [--email participant@exemple.com] [--limit N]

Flags:
  --dry-run          Écrit les HTML dans api/tmp/event-emails (aucun envoi)
  --sample           Données fictives sans DB (avec --dry-run ou --to)
  --to <addr>        Envoie des mails de test vers cette adresse (contenu réel DB)
  --send             Envoie réellement à chaque participant (email de event_entries)
  --email <addr>     Un seul participant (--to ou --send)
  --limit N          Limite le nombre de participants traités
  --reset-sent       Réinitialise le journal des envois réussis (--send)

Envoi réel (--send) : lots de 30 mails, pause de 1 min entre chaque lot.
--dry-run et --send ignorent les adresses déjà présentes dans sent-emails.jsonl.
Les échecs d'envoi sont loggés sans arrêter le script.`);
}

function formatDisplayName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (!last) return first;
  return `${first} ${last}`;
}

function toNeighbor(row: RankedEntryRow): EventThankYouNeighbor {
  return {
    rank: Number(row.rank),
    displayName: formatDisplayName(row.firstName, row.lastName),
    reps: Number(row.reps),
  };
}

function sampleParticipants(): Participant[] {
  return [
    {
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Martin',
      ranks: [
        {
          exerciseLabel: 'Tractions',
          genderLabel: 'Femmes',
          rank: 1,
          reps: 18,
          displayName: 'Alice Martin',
          participantCount: 12,
          above: null,
          below: {
            rank: 2,
            displayName: 'Léa Bernard',
            reps: 15,
          },
          top: null,
        },
        {
          exerciseLabel: 'Pompes',
          genderLabel: 'Femmes',
          rank: 3,
          reps: 42,
          displayName: 'Alice Martin',
          participantCount: 18,
          above: {
            rank: 2,
            displayName: 'Chloé Petit',
            reps: 45,
          },
          below: {
            rank: 4,
            displayName: 'Inès Moreau',
            reps: 38,
          },
          top: {
            rank: 1,
            displayName: 'Sarah Durand',
            reps: 51,
          },
        },
      ],
    },
    {
      email: 'bruno@example.com',
      firstName: 'Bruno',
      lastName: 'Dupont',
      ranks: [
        {
          exerciseLabel: 'Dips',
          genderLabel: 'Hommes',
          rank: 7,
          reps: 25,
          displayName: 'Bruno Dupont',
          participantCount: 34,
          above: {
            rank: 6,
            displayName: 'Karim Benali',
            reps: 27,
          },
          below: {
            rank: 8,
            displayName: 'Hugo Leroy',
            reps: 24,
          },
          top: {
            rank: 1,
            displayName: 'Marc Fontaine',
            reps: 48,
          },
        },
      ],
    },
  ];
}

function requireSmtpConfig(): {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
} {
  const host = process.env.SMTP_HOST?.trim() ?? '';
  const portRaw = process.env.SMTP_PORT?.trim() ?? '587';
  const user = process.env.SMTP_USER?.trim() ?? '';
  const pass = process.env.SMTP_PASS?.trim() ?? '';
  const from =
    process.env.SMTP_FROM?.trim() || 'One More <noreply@one-more.app>';
  const port = Number(portRaw);

  if (!host || !Number.isFinite(port) || port <= 0) {
    throw new Error(
      'SMTP_HOST / SMTP_PORT manquants ou invalides. Définis-les dans api/.env.',
    );
  }
  if (!user || !pass) {
    throw new Error(
      'SMTP_USER / SMTP_PASS manquants. Définis-les dans api/.env.',
    );
  }

  return { host, port, user, pass, from };
}

function getAppStoreUrl(): string {
  const appStoreId = process.env.APPLE_APP_STORE_ID?.trim() ?? '';
  if (/^\d+$/.test(appStoreId)) {
    return `https://apps.apple.com/app/id${appStoreId}`;
  }
  return 'https://site.one-more.app';
}

function getPublicAppUrl(): string {
  const raw = process.env.PUBLIC_APP_URL?.trim() || 'https://site.one-more.app';
  return raw
    .replace(/\/$/, '')
    .replace('https://one-more.app', 'https://site.one-more.app');
}

/** Lien OneLink AppsFlyer pour le CTA téléchargement. */
function getOneLinkDownloadUrl(): string {
  const override = process.env.EVENT_DOWNLOAD_URL?.trim();
  if (override) return override;

  return 'https://one-more.onelink.me/XFST';
}

function sanitizeFilename(email: string): string {
  return email.replace(/[^a-zA-Z0-9._@+-]/g, '_');
}

type SentEmailLogEntry = {
  email: string;
  sentAt: string;
  subject: string;
};

async function loadSentEmails(): Promise<Set<string>> {
  try {
    const raw = await readFile(SENT_LOG_PATH, 'utf8');
    const sent = new Set<string>();
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const entry = JSON.parse(trimmed) as SentEmailLogEntry;
        if (entry.email) sent.add(entry.email.trim().toLowerCase());
      } catch {
        // ligne corrompue ignorée
      }
    }
    return sent;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return new Set();
    throw err;
  }
}

async function recordSentEmail(email: string, subject: string): Promise<void> {
  await mkdir(PREVIEW_DIR, { recursive: true });
  const entry: SentEmailLogEntry = {
    email: email.trim().toLowerCase(),
    sentAt: new Date().toISOString(),
    subject,
  };
  await appendFile(SENT_LOG_PATH, `${JSON.stringify(entry)}\n`, 'utf8');
}

async function resetSentLog(): Promise<void> {
  try {
    await unlink(SENT_LOG_PATH);
    console.log(`Journal réinitialisé : ${SENT_LOG_PATH}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    console.log('Aucun journal d’envoi à réinitialiser.');
  }
}

function groupParticipants(rows: RankedEntryRow[]): Participant[] {
  const boards = new Map<string, RankedEntryRow[]>();

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    if (!email) continue;
    const key = `${row.exercise}|${row.gender}`;
    const board = boards.get(key) ?? [];
    board.push({
      ...row,
      email,
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      rank: Number(row.rank),
      reps: Number(row.reps),
    });
    boards.set(key, board);
  }

  for (const board of boards.values()) {
    board.sort((a, b) => Number(a.rank) - Number(b.rank));
  }

  const byEmail = new Map<string, Participant>();

  for (const board of boards.values()) {
    for (let index = 0; index < board.length; index += 1) {
      const row = board[index];
      const above = index > 0 ? board[index - 1] : null;
      const below = index < board.length - 1 ? board[index + 1] : null;
      const top = Number(row.rank) > 1 ? board[0] : null;

      const rankRow: EventThankYouRankRow = {
        exerciseLabel: EXERCISE_LABELS[row.exercise] ?? row.exercise,
        genderLabel: GENDER_LABELS[row.gender] ?? row.gender,
        rank: Number(row.rank),
        reps: Number(row.reps),
        displayName: formatDisplayName(row.firstName, row.lastName),
        participantCount: board.length,
        above: above ? toNeighbor(above) : null,
        below: below ? toNeighbor(below) : null,
        top: top ? toNeighbor(top) : null,
      };

      const existing = byEmail.get(row.email);
      if (existing) {
        existing.ranks.push(rankRow);
        continue;
      }

      byEmail.set(row.email, {
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        ranks: [rankRow],
      });
    }
  }

  for (const participant of byEmail.values()) {
    participant.ranks.sort((a, b) => a.rank - b.rank);
  }

  return [...byEmail.values()].sort((a, b) =>
    a.email.localeCompare(b.email, 'fr'),
  );
}

async function loadParticipants(): Promise<Participant[]> {
  const rows: RankedEntryRow[] = await dataSource.query(`
    SELECT
      email,
      "firstName",
      "lastName",
      exercise,
      gender,
      reps,
      RANK() OVER (
        PARTITION BY exercise, gender
        ORDER BY reps DESC, "createdAt" ASC
      ) AS rank
    FROM event_entries
    WHERE "deletedAt" IS NULL
    ORDER BY email, rank
  `);

  return groupParticipants(rows);
}

async function loadLogoBase64(): Promise<string> {
  const buffer = await readFile(LOGO_PATH);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function loadHumanBase64(): Promise<string> {
  const buffer = await readFile(HUMAN_PATH);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function loadMockupBase64(): Promise<string> {
  const buffer = await readFile(MOCKUP_PATH);
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function loadFontDataUri(): Promise<string> {
  const buffer = await readFile(FONT_WOFF2_PATH);
  return `data:font/woff2;base64,${buffer.toString('base64')}`;
}

function createTransport() {
  const smtp = requireSmtpConfig();
  return {
    from: smtp.from,
    transporter: nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    }),
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const sendMode = process.argv.includes('--send');
  const resetSent = process.argv.includes('--reset-sent');
  const useSample = process.argv.includes('--sample');
  const toArg = getArgValue('--to');
  const emailArg = getArgValue('--email')?.trim().toLowerCase();
  const limitRaw = getArgValue('--limit');
  const limit = limitRaw ? Number(limitRaw) : undefined;

  const modeCount = [dryRun, Boolean(toArg), sendMode].filter(Boolean).length;
  if (modeCount === 0) {
    printUsage();
    throw new Error('Choisis un mode : --dry-run, --to <addr> ou --send.');
  }
  if (modeCount > 1) {
    throw new Error('Utilise un seul mode parmi --dry-run, --to et --send.');
  }

  if (useSample && sendMode) {
    throw new Error('--sample ne fonctionne pas avec --send.');
  }

  if (resetSent && !sendMode) {
    throw new Error('--reset-sent ne fonctionne qu’avec --send.');
  }

  if (useSample && !dryRun && !toArg) {
    throw new Error('--sample ne fonctionne qu’avec --dry-run ou --to.');
  }

  if (
    limitRaw !== undefined &&
    (!Number.isFinite(limit) || (limit ?? 0) <= 0)
  ) {
    throw new Error('--limit doit être un entier positif.');
  }

  const needsDb = !useSample;
  if (needsDb && !dataSource.isInitialized) await dataSource.initialize();

  try {
    if (resetSent) await resetSentLog();

    let participants = useSample
      ? sampleParticipants()
      : await loadParticipants();
    if (participants.length === 0) {
      console.log('Aucun participant actif dans event_entries.');
      return;
    }

    if (emailArg) {
      participants = participants.filter((p) => p.email === emailArg);
      if (participants.length === 0) {
        throw new Error(`Participant introuvable pour l'email : ${emailArg}`);
      }
    }

    if (toArg) {
      const testLimit = emailArg ? 1 : (limit ?? 1);
      participants = participants.slice(0, testLimit);
    } else if (limit !== undefined) {
      participants = participants.slice(0, limit);
    }

    let skippedAlreadySent = 0;
    if (dryRun || sendMode) {
      const sentEmails = await loadSentEmails();
      const pending = participants.filter(
        (participant) => !sentEmails.has(participant.email),
      );
      skippedAlreadySent = participants.length - pending.length;
      participants = pending;
      if (skippedAlreadySent > 0) {
        console.log(
          `  ${skippedAlreadySent} participant(s) déjà envoyé(s), ignoré(s).`,
        );
      }
      if (participants.length === 0) {
        console.log(
          dryRun
            ? 'Rien à prévisualiser : tous les participants ont déjà reçu le mail.'
            : 'Rien à envoyer : tous les participants ont déjà reçu le mail.',
        );
        return;
      }
    }

    const appStoreUrl = getAppStoreUrl();
    const publicAppUrl = getPublicAppUrl();
    const downloadUrl = getOneLinkDownloadUrl();

    const modeLabel = dryRun ? '[dry-run] ' : sendMode ? '[send] ' : '[to] ';
    console.log(
      `${modeLabel}${useSample ? '[sample] ' : ''}Préparation de ${participants.length} mail(s)...`,
    );
    console.log(`  CTA téléchargement : ${downloadUrl}`);

    const fontDataUri = await loadFontDataUri();

    if (dryRun) {
      await mkdir(PREVIEW_DIR, { recursive: true });
      const logoSrc = await loadLogoBase64();
      const humanSrc = await loadHumanBase64();
      const mockupSrc = await loadMockupBase64();

      for (const participant of participants) {
        const { html } = renderEventThankYouEmail({
          firstName: participant.firstName,
          ranks: participant.ranks,
          logoSrc,
          humanSrc,
          mockupSrc,
          fontDataUri,
          downloadUrl,
          appStoreUrl,
          playStoreUrl: PLAY_STORE_URL,
          publicAppUrl,
        });
        const outPath = join(
          PREVIEW_DIR,
          `${sanitizeFilename(participant.email)}.html`,
        );
        await writeFile(outPath, html, 'utf8');
        console.log(
          `  ${participant.email}: ${participant.ranks.length} place(s) → ${outPath}`,
        );
      }

      console.log(`Aperçus écrits dans ${PREVIEW_DIR}`);
      return;
    }

    const { transporter, from } = createTransport();
    const logoBuffer = await readFile(LOGO_PATH);
    const humanBuffer = await readFile(HUMAN_PATH);
    const mockupBuffer = await readFile(MOCKUP_PATH);

    const recipient = sendMode ? undefined : toArg;
    if (!recipient && !sendMode) {
      throw new Error('Adresse destinataire manquante.');
    }

    let sent = 0;
    let failed = 0;
    const totalPending = participants.length;
    const batches = sendMode
      ? chunk(participants, SEND_BATCH_SIZE)
      : [participants];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      const batch = batches[batchIndex];
      if (sendMode && batches.length > 1) {
        console.log(
          `\nLot ${batchIndex + 1}/${batches.length} (${batch.length} mail(s))...`,
        );
      }

      for (const participant of batch) {
        const rendered = renderEventThankYouEmail({
          firstName: participant.firstName,
          ranks: participant.ranks,
          logoSrc: `cid:${LOGO_CID}`,
          humanSrc: `cid:${HUMAN_CID}`,
          mockupSrc: `cid:${MOCKUP_CID}`,
          fontDataUri,
          downloadUrl,
          appStoreUrl,
          playStoreUrl: PLAY_STORE_URL,
          publicAppUrl,
        });

        const to = sendMode ? participant.email : recipient!;

        try {
          await transporter.sendMail({
            from,
            to,
            subject: rendered.subject,
            text: rendered.text,
            html: rendered.html,
            attachments: [
              {
                filename: 'logo-white-text.png',
                content: logoBuffer,
                cid: LOGO_CID,
                contentType: 'image/png',
              },
              {
                filename: 'marcus.png',
                content: humanBuffer,
                cid: HUMAN_CID,
                contentType: 'image/png',
              },
              {
                filename: 'app-tier-mockup.png',
                content: mockupBuffer,
                cid: MOCKUP_CID,
                contentType: 'image/jpeg',
              },
            ],
          });

          if (sendMode) {
            await recordSentEmail(to, rendered.subject);
          }

          sent += 1;
          if (sendMode) {
            console.log(
              `  [${sent}/${totalPending}] ${to} (${participant.ranks.length} place(s)) · ${rendered.subject}`,
            );
          } else {
            console.log(
              `  [${sent}/${totalPending}] ${to} (contenu de ${participant.email}, ${participant.ranks.length} place(s))`,
            );
          }
        } catch (err) {
          failed += 1;
          const message = err instanceof Error ? err.message : String(err);
          console.error(`  ✗ Échec pour ${to} : ${message}`);
        }
      }

      if (sendMode && batchIndex < batches.length - 1) {
        console.log('Pause de 1 min avant le prochain lot...');
        await sleep(SEND_BATCH_DELAY_MS);
      }
    }

    if (sendMode) {
      console.log(
        `Envoi terminé : ${sent} envoyé(s), ${failed} échec(s), ${skippedAlreadySent} ignoré(s).`,
      );
      if (failed > 0) process.exitCode = 1;
    } else {
      console.log(`Envoi terminé : ${sent} mail(s) de test vers ${recipient}.`);
    }
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
