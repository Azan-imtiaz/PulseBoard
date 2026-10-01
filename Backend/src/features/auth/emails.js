import { sendEmail } from '../../services/email.js';
import { OTP_TTL_MINUTES } from './otp.js';

function codeEmail({ heading, intro, code }) {
  return `<div style="font-family:Inter,system-ui,sans-serif;font-size:14px;color:#111;max-width:480px">
  <p style="font-size:16px;font-weight:600;margin:0 0 12px">${heading}</p>
  <p style="margin:0 0 20px;color:#444;line-height:1.5">${intro}</p>
  <p style="font-family:'JetBrains Mono',Menlo,monospace;font-size:28px;letter-spacing:8px;font-weight:600;margin:0 0 20px">${code}</p>
  <p style="margin:0;color:#777;font-size:12px;line-height:1.5">This code expires in ${OTP_TTL_MINUTES} minutes. If you didn't ask for it, you can ignore this email.</p>
</div>`;
}

export function sendVerificationCode(user, code) {
  return sendEmail({
    to: user.email,
    subject: `${code} is your PulseBoard verification code`,
    text: `Hi ${user.name},\n\nYour PulseBoard verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: codeEmail({
      heading: 'Confirm your email',
      intro: `Hi ${user.name}, enter this code in PulseBoard to finish creating your account.`,
      code,
    }),
  });
}

export function sendPasswordResetCode(user, code) {
  return sendEmail({
    to: user.email,
    subject: `${code} is your PulseBoard password reset code`,
    text: `Hi ${user.name},\n\nYour PulseBoard password reset code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: codeEmail({
      heading: 'Reset your password',
      intro: `Hi ${user.name}, enter this code in PulseBoard to choose a new password.`,
      code,
    }),
  });
}
