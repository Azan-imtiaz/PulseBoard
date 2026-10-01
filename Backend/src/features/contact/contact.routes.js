import { Router } from 'express';
import { z } from 'zod';
import { config } from '../../config.js';
import { HttpError } from '../../lib/errors.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { sendEmail } from '../../services/email.js';

export const contactRouter = Router();

// Public: anyone can reach the team, signed in or not. Keyed by IP since there's
// no account behind most of these requests; a handful per window is plenty and
// mainly guards against spam. Attached to the route, not the router: this router
// is mounted at the API root, so router-level middleware would throttle every request.
const contactLimiter = rateLimit({
  name: 'contact',
  limit: 5,
  windowMs: 10 * 60_000,
  key: (req) => req.ip ?? 'unknown',
});

const sendSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(5000),
});

contactRouter.post('/contact', contactLimiter, async (req, res) => {
  if (!config.CONTACT_EMAIL) {
    throw new HttpError(503, 'The contact form is not configured on this server', 'contact_disabled');
  }

  const { name, email, subject, message } = sendSchema.parse(req.body);

  await sendEmail({
    to: config.CONTACT_EMAIL,
    replyTo: `${name} <${email}>`,
    subject: `[PulseBoard] ${subject}`,
    text: `From ${name} <${email}>:\n\n${message}`,
  });

  res.status(201).json({ ok: true });
});
