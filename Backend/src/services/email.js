import nodemailer from 'nodemailer';
import { config, isProd } from '../config.js';
import { logger } from '../lib/logger.js';

// Gmail over SMTP with an app password (Google Account → Security → App passwords).
// Without credentials, mail is rendered but not sent; in development the full text
// is logged so sign-up codes can still be read from the terminal.
const gmailConfigured = Boolean(config.GMAIL_USER && config.GMAIL_APP_PASSWORD);

const transport = gmailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.GMAIL_USER, pass: config.GMAIL_APP_PASSWORD },
    })
  : nodemailer.createTransport({ jsonTransport: true });

if (!gmailConfigured) {
  const log = isProd ? logger.error.bind(logger) : logger.warn.bind(logger);
  log('GMAIL_USER / GMAIL_APP_PASSWORD not set: emails will be logged, not sent');
}

export async function sendEmail(email) {
  const info = await transport.sendMail({
    from: config.MAIL_FROM ?? `PulseBoard <${config.GMAIL_USER ?? 'no-reply@localhost'}>`,
    ...email,
  });
  if (!gmailConfigured && !isProd) {
    logger.info({ to: email.to, subject: email.subject, text: email.text }, 'email (not sent, Gmail not configured)');
  }
  return info;
}
