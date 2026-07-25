import 'dotenv/config';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
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
const LOGO_PATH = resolve(__dirname, 'emails/assets/logo-white-text.png');
const HUMAN_PATH = resolve(__dirname, '../../../client/public/images/marcus.png');
const FONT_PATH = resolve(__dirname, 'emails/fonts/tbj-one-more.otf');
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.one_more.app';
const LOGO_CID = 'one-more-logo';
const HUMAN_CID = 'one-more-human';

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
  npm run event:thankyou -- --to toi@exemple.com [--email participant@exemple.com] [--sample]
  npm run event:thankyou -- --send [--limit N]

Flags:
  --dry-run          Écrit les HTML dans api/tmp/event-emails (aucun envoi)
  --sample           Données fictives sans DB (avec --dry-run ou --to)
  --to <addr>        Envoie un seul mail de test vers cette adresse
  --email <addr>     Participant source pour --to (sinon le premier)
  --send             Envoie à tous les participants
  --limit N          Plafonne le nombre d'envois / aperçus`);
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
  return 'https://one-more.app';
}

function getPublicAppUrl(): string {
  const raw = process.env.PUBLIC_APP_URL?.trim() || 'https://one-more.app';
  return raw.replace(/\/$/, '');
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
  const rows = await dataSource.query(`
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

  return groupParticipants(rows as RankedEntryRow[]);
}

async function loadLogoBase64(): Promise<string> {
  const buffer = await readFile(LOGO_PATH);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function loadHumanBase64(): Promise<string> {
  const buffer = await readFile(HUMAN_PATH);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function createTransport() {
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
  const useSample = process.argv.includes('--sample');
  const sendAll = process.argv.includes('--send');
  const toArg = getArgValue('--to');
  const emailArg = getArgValue('--email')?.trim().toLowerCase();
  const limitRaw = getArgValue('--limit');
  const limit = limitRaw ? Number(limitRaw) : undefined;

  if (!dryRun && !sendAll && !toArg) {
    printUsage();
    throw new Error(
      'Choisis un mode : --dry-run, --to <addr> ou --send.',
    );
  }

  if ([dryRun, sendAll, Boolean(toArg)].filter(Boolean).length > 1) {
    throw new Error(
      'Utilise un seul mode parmi --dry-run, --to et --send.',
    );
  }

  if (useSample && !dryRun && !toArg) {
    throw new Error('--sample ne fonctionne qu’avec --dry-run ou --to.');
  }

  if (limitRaw !== undefined && (!Number.isFinite(limit) || (limit ?? 0) <= 0)) {
    throw new Error('--limit doit être un entier positif.');
  }

  const needsDb = !useSample;
  if (needsDb && !dataSource.isInitialized) await dataSource.initialize();

  try {
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

    if (toArg && !emailArg) {
      participants = participants.slice(0, 1);
    }

    if (limit !== undefined) {
      participants = participants.slice(0, limit);
    }

    const appStoreUrl = getAppStoreUrl();
    const publicAppUrl = getPublicAppUrl();
    const downloadUrl = getOneLinkDownloadUrl();

    console.log(
      `${dryRun ? '[dry-run] ' : sendAll ? '[send] ' : '[to] '}${useSample ? '[sample] ' : ''}Préparation de ${participants.length} destinataire(s)...`,
    );
    console.log(`  CTA téléchargement : ${downloadUrl}`);

    if (dryRun) {
      await mkdir(PREVIEW_DIR, { recursive: true });
      const previewFontsDir = join(PREVIEW_DIR, 'fonts');
      await mkdir(previewFontsDir, { recursive: true });
      await copyFile(FONT_PATH, join(previewFontsDir, 'tbj-one-more.otf'));
      const logoSrc = await loadLogoBase64();
      const humanSrc = await loadHumanBase64();
      const fontFaceSrc = 'fonts/tbj-one-more.otf';

      for (const participant of participants) {
        const { html } = renderEventThankYouEmail({
          firstName: participant.firstName,
          ranks: participant.ranks,
          logoSrc,
          humanSrc,
          fontFaceSrc,
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

    const { transporter, from } = await createTransport();
    const logoBuffer = await readFile(LOGO_PATH);
    const humanBuffer = await readFile(HUMAN_PATH);

    if (toArg) {
      const participant = participants[0];
      const rendered = renderEventThankYouEmail({
        firstName: participant.firstName,
        ranks: participant.ranks,
        logoSrc: `cid:${LOGO_CID}`,
        humanSrc: `cid:${HUMAN_CID}`,
        downloadUrl,
        appStoreUrl,
        playStoreUrl: PLAY_STORE_URL,
        publicAppUrl,
      });

      await transporter.sendMail({
        from,
        to: toArg,
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
        ],
      });

      console.log(
        `Mail de test envoyé à ${toArg} (contenu de ${participant.email}, ${participant.ranks.length} place(s)).`,
      );
      return;
    }

    let sent = 0;
    for (const participant of participants) {
      const rendered = renderEventThankYouEmail({
        firstName: participant.firstName,
        ranks: participant.ranks,
        logoSrc: `cid:${LOGO_CID}`,
        humanSrc: `cid:${HUMAN_CID}`,
        downloadUrl,
        appStoreUrl,
        playStoreUrl: PLAY_STORE_URL,
        publicAppUrl,
      });

      await transporter.sendMail({
        from,
        to: participant.email,
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
        ],
      });

      sent += 1;
      console.log(
        `  [${sent}/${participants.length}] ${participant.email} (${participant.ranks.length} place(s))`,
      );
    }

    console.log(`Envoi terminé : ${sent} mail(s).`);
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
