import { UserModel } from './user.model.js';

// 3–20 characters: lowercase letters, digits, dots and underscores. Starts and ends
// with a letter or digit, and no two dots/underscores in a row, so names stay
// readable in @mentions and URLs.
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9]|[._](?=[a-z0-9])){2,19}$/;

const RESERVED = new Set([
  'admin',
  'administrator',
  'root',
  'support',
  'help',
  'api',
  'system',
  'pulseboard',
  'everyone',
  'here',
  'me',
]);

export function checkUsernameFormat(username) {
  if (username.length < 3) return 'Use at least 3 characters';
  if (username.length > 20) return 'Use at most 20 characters';
  if (!USERNAME_PATTERN.test(username)) {
    return 'Use lowercase letters, numbers, dots or underscores, starting and ending with a letter or number';
  }
  if (RESERVED.has(username)) return 'That username is reserved';
  return null;
}

// Best-effort cleanup of whatever someone typed: "Maya Chen!" -> "maya.chen".
export function toUsername(text) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._]/g, '')
    .replace(/[._]{2,}/g, '.')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 20)
    .replace(/[._]+$/, '');
}

// Candidate usernames built from what the person typed and their display name,
// most natural first. Numbered variants are the fallback when the plain forms are gone.
export function usernameCandidates(typed, name = '', random = Math.random) {
  const base = toUsername(typed) || toUsername(name);
  if (!base) return [];

  const words = toUsername(name).split(/[._]/).filter(Boolean);
  const first = words[0] ?? '';
  const last = words.length > 1 ? words.at(-1) : '';

  const candidates = [
    base,
    first && last && `${first}.${last}`,
    first && last && `${first}${last}`,
    first && last && `${first}_${last[0]}`,
    first && last && `${first[0]}${last}`,
    `${base}.dev`,
    `${base}_hq`,
  ];
  for (let i = 0; i < 4; i++) candidates.push(`${base.slice(0, 16)}${Math.floor(10 + random() * 990)}`);

  return [...new Set(candidates.filter((c) => c && !checkUsernameFormat(c)))];
}

export async function suggestUsernames(typed, name, count = 4) {
  const candidates = usernameCandidates(typed, name).filter((c) => c !== toUsername(typed));
  const taken = await UserModel.find({ username: { $in: candidates } })
    .select('username')
    .lean();
  const takenSet = new Set(taken.map((u) => u.username));
  return candidates.filter((c) => !takenSet.has(c)).slice(0, count);
}

export async function isUsernameTaken(username) {
  return Boolean(await UserModel.exists({ username }));
}
