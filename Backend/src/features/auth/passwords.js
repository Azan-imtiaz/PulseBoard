// A short list of the passwords that show up at the top of every breach dump.
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

// Returns the first problem with a password, or null if it's acceptable. Length
// matters far more than character classes, so we only insist on 8+ characters and
// block the obviously guessable.
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
