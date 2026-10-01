// Mirrors the server's rules (Backend/src/features/auth/passwords.js) so problems
// show while typing. The server still has the final say.
const COMMON = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyuiop',
  '11111111',
  '00000000',
  'iloveyou',
  'abc12345',
  'letmein1',
  'welcome1',
  'pulseboard',
]);

export function passwordProblem(password, { email = '', username = '' } = {}) {
  if (password.length < 8) return 'Use at least 8 characters';
  if (password.length > 200) return 'Use at most 200 characters';

  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return 'That password is too common';
  if (/^(.)\1+$/.test(password)) return "Don't use a single repeated character";
  const emailName = email.split('@')[0].toLowerCase();
  if (username.length >= 3 && lower.includes(username.toLowerCase())) return "Don't include your username";
  if (emailName.length >= 3 && lower.includes(emailName)) return "Don't include your email address";
  return null;
}

// 0–4. Length does most of the work; mixing character types adds a little.
export function passwordScore(password) {
  if (!password) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((re) => re.test(password)).length;
  let score = password.length >= 8 ? 1 : 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (kinds >= 3) score++;
  return Math.min(score, 4);
}
