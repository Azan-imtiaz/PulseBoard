import { HttpError } from '../../lib/errors.js';

export const demoLocked = () =>
  new HttpError(
    403,
    "That's turned off in the demo so it stays tidy for the next visitor. Create a free account to try it.",
    'demo_locked',
  );

// For changes that would spoil the shared demo: deleting or renaming workspaces and
// boards, and changing who's in them. Everything else works normally.
export const blockInDemo = (req, _res, next) => {
  if (req.isDemo) throw demoLocked();
  next();
};
