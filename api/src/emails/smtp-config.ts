export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

export function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim() ?? '';
  const portRaw = process.env.SMTP_PORT?.trim() ?? '587';
  const port = Number(portRaw);
  const user = process.env.SMTP_USER?.trim() ?? '';
  const pass = process.env.SMTP_PASS?.trim() ?? '';
  const from =
    process.env.SMTP_FROM?.trim() || 'One More <noreply@one-more.app>';

  if (!host || !Number.isFinite(port) || port <= 0 || !user || !pass) {
    return null;
  }

  return { host, port, user, pass, from };
}
