import nodemailer from 'nodemailer';
import { config, isProd } from '../config.js';
import { logger } from '../lib/logger.js';

// Outbound email, in order of preference:
//  1. Brevo's HTTP API (BREVO_API_KEY). Works on hosts that block SMTP ports, like
//     Render's free tier, because it's a plain HTTPS request.
//  2. Gmail over SMTP with an app password (GMAIL_USER + GMAIL_APP_PASSWORD). Handy
//     locally, blocked on hosts without outbound SMTP.
//  3. Neither: mail isn't sent. In development the full text is logged so sign-up
//     codes can still be read from the terminal.
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_SENDER_NAME = 'PulseBoard';

export const provider = config.BREVO_API_KEY
  ? 'brevo'
  : config.GMAIL_USER && config.GMAIL_APP_PASSWORD
    ? 'gmail'
    : 'none';

if (provider === 'none') {
  const log = isProd ? logger.error.bind(logger) : logger.warn.bind(logger);
  log('No email provider configured (BREVO_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD): emails will be logged, not sent');
}

// "Ayesha Khan <ayesha@example.com>" or "ayesha@example.com" -> { name, email }
export function parseAddress(value) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  if (match) return { name: match[1].replace(/^"|"$/g, '') || undefined, email: match[2].trim() };
  return { email: value.trim() };
}

function sender() {
  const from = parseAddress(config.MAIL_FROM ?? config.GMAIL_USER ?? 'no-reply@localhost');
  return { name: from.name ?? DEFAULT_SENDER_NAME, email: from.email };
}

async function sendWithBrevo({ to, subject, text, html, replyTo }) {
  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: { 'api-key': config.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: sender(),
      to: [parseAddress(to)],
      subject,
      textContent: text,
      ...(html && { htmlContent: html }),
      ...(replyTo && { replyTo: parseAddress(replyTo) }),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Brevo explains itself in `message` (unverified sender, bad key, quota...).
    throw new Error(`Brevo rejected the email (${res.status}): ${body.message ?? res.statusText}`);
  }
  return { provider: 'brevo', messageId: body.messageId };
}

let gmail;
async function sendWithGmail(email) {
  gmail ??= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.GMAIL_USER, pass: config.GMAIL_APP_PASSWORD },
  });
  const from = sender();
  const info = await gmail.sendMail({ from: `${from.name} <${from.email}>`, ...email });
  return { provider: 'gmail', messageId: info.messageId };
}

// `email` is { to, subject, text, html?, replyTo? }. Throws if the provider refuses
// it; callers decide whether that should fail the request.
export async function sendEmail(email) {
  if (provider === 'brevo') return sendWithBrevo(email);
  if (provider === 'gmail') return sendWithGmail(email);

  if (!isProd) {
    logger.info({ to: email.to, subject: email.subject, text: email.text }, 'email (not sent, no provider configured)');
  }
  return { provider: 'none', messageId: null };
}
