// Content for the public demo workspace. Dates are relative to the moment the demo
// is reset: `due` is days from now, `doneAgo` is how many days ago a task shipped.

export const DEMO_PASSWORD = 'pulseboard';
export const DEMO_WORKSPACE = 'Margalla Labs';

export const people = [
  { name: 'Ayesha Khan', username: 'ayesha', email: 'ayesha@margallalabs.dev' },
  { name: 'Bilal Ahmed', username: 'bilal', email: 'bilal@margallalabs.dev' },
  { name: 'Hira Siddiqui', username: 'hira', email: 'hira@margallalabs.dev' },
  { name: 'Usman Tariq', username: 'usman', email: 'usman@margallalabs.dev' },
  { name: 'Fatima Malik', username: 'fatima', email: 'fatima@margallalabs.dev' },
  { name: 'Zain Abbas', username: 'zain', email: 'zain@margallalabs.dev' },
];

// Index into `people` for each workspace role. Everyone else is a member.
export const roles = { 0: 'owner', 1: 'admin' };

// The accounts visitors can sign in as, one per role.
export const personas = [
  {
    role: 'owner',
    username: 'ayesha',
    title: 'Engineering lead',
    summary: 'Sees everything and can manage boards and people. Start here for the full tour.',
  },
  {
    role: 'admin',
    username: 'bilal',
    title: 'Backend engineer',
    summary: 'Runs boards and manages members, but can only manage people ranked below him.',
  },
  {
    role: 'member',
    username: 'hira',
    title: 'Full-stack engineer',
    summary: 'Works on tasks day to day. Try deleting a task someone else created.',
  },
];

const platform = [
  {
    title: 'Move sessions to a replicated MongoDB cluster',
    status: 'in_progress',
    priority: 'high',
    assignee: 1,
    labels: ['infra'],
    due: 3,
    description:
      'Sessions still live on a single primary, the last non-redundant piece of the stack. Move them to a 3-node replica set without downtime.',
  },
  {
    title: 'Rotate refresh tokens on every use',
    status: 'in_review',
    priority: 'high',
    assignee: 2,
    labels: ['auth', 'security'],
    due: 1,
  },
  {
    title: 'Retry failed webhooks with exponential backoff',
    status: 'todo',
    priority: 'medium',
    assignee: 3,
    labels: ['api'],
    due: 9,
  },
  {
    title: 'p95 latency regression on /boards/:id',
    status: 'blocked',
    priority: 'urgent',
    assignee: 1,
    labels: ['perf', 'bug'],
    due: -1,
    description:
      'Board reads went from 40ms to 380ms p95 after the members populate change. The fix depends on the cluster migration.',
  },
  { title: 'Audit log export (CSV)', status: 'backlog', priority: 'low', labels: ['api'] },
  {
    title: 'Rate limit the public API per token',
    status: 'done',
    priority: 'high',
    assignee: 2,
    labels: ['api', 'security'],
    doneAgo: 3,
  },
  { title: 'Upgrade to Node 22 LTS', status: 'done', priority: 'medium', assignee: 3, labels: ['infra'], doneAgo: 5 },
  {
    title: 'Signed upload URLs for attachments',
    status: 'done',
    priority: 'high',
    assignee: 4,
    labels: ['api'],
    doneAgo: 8,
  },
  {
    title: 'Fix duplicate emails on task reassignment',
    status: 'done',
    priority: 'medium',
    assignee: 4,
    labels: ['bug'],
    doneAgo: 10,
  },
  {
    title: 'OpenAPI spec for v1 endpoints',
    status: 'done',
    priority: 'medium',
    assignee: 2,
    labels: ['api', 'docs'],
    doneAgo: 12,
  },
  {
    title: 'Presence indicators across instances',
    status: 'done',
    priority: 'high',
    assignee: 1,
    labels: ['realtime'],
    doneAgo: 15,
  },
  {
    title: 'Structured logging with request ids',
    status: 'done',
    priority: 'low',
    assignee: 3,
    labels: ['infra'],
    doneAgo: 18,
  },
  {
    title: 'Reconnect sockets after network drops',
    status: 'done',
    priority: 'high',
    assignee: 1,
    labels: ['realtime'],
    doneAgo: 22,
  },
  {
    title: 'Workspace roles: owner / admin / member',
    status: 'done',
    priority: 'high',
    assignee: 2,
    labels: ['auth'],
    doneAgo: 26,
  },
  {
    title: 'Seed script for local development',
    status: 'done',
    priority: 'low',
    assignee: 5,
    labels: ['dx'],
    doneAgo: 30,
  },
  {
    title: 'Health checks for the load balancer',
    status: 'done',
    priority: 'medium',
    assignee: 3,
    labels: ['infra'],
    doneAgo: 33,
  },
  {
    title: 'Speed up board loading',
    status: 'todo',
    priority: 'high',
    assignee: 1,
    labels: ['perf'],
    due: 6,
    dependsOn: [0],
  },
  {
    title: 'Sign-in codes over SMS through a local gateway',
    status: 'backlog',
    priority: 'medium',
    labels: ['auth'],
    description: 'A lot of our users check SMS before email. Look at local gateways and their delivery rates.',
  },
  {
    title: 'Urdu translations and right-to-left layout',
    status: 'backlog',
    priority: 'medium',
    labels: ['i18n'],
  },
  {
    title: 'Send due-date reminders at 9am PKT',
    status: 'todo',
    priority: 'medium',
    assignee: 4,
    labels: ['notifications'],
    due: 12,
  },
  {
    title: 'Flaky test: socket fan-out under load',
    status: 'in_progress',
    priority: 'medium',
    assignee: 5,
    labels: ['bug', 'realtime'],
    due: 2,
  },
  { title: 'Archive boards instead of deleting them', status: 'backlog', priority: 'none', labels: ['product'] },
  {
    title: 'Backfill activity log for imported boards',
    status: 'blocked',
    priority: 'medium',
    assignee: 3,
    labels: ['api'],
    due: 4,
    description: 'Waiting on the data team to confirm which Trello export format we support.',
  },
];

const mobile = [
  {
    title: 'Offline mode for the task list',
    status: 'in_progress',
    priority: 'high',
    assignee: 4,
    labels: ['android', 'ios'],
    due: 8,
    description:
      'Load-shedding and patchy mobile data mean people lose connection halfway through an update. Cache the board locally and sync when the connection is back.',
  },
  {
    title: 'Push notifications for mentions',
    status: 'todo',
    priority: 'medium',
    assignee: 5,
    labels: ['notifications'],
    due: 14,
  },
  { title: 'Dark mode parity with web', status: 'in_review', priority: 'low', assignee: 4, labels: ['design'] },
  {
    title: 'Crash on Android 12 when opening attachments',
    status: 'done',
    priority: 'urgent',
    assignee: 5,
    labels: ['bug', 'android'],
    doneAgo: 4,
  },
  {
    title: 'Reduce APK size below 20 MB',
    status: 'todo',
    priority: 'medium',
    assignee: 2,
    labels: ['android', 'perf'],
    due: 10,
    description: 'Most of our users are on mid-range Android phones with little free storage.',
  },
  { title: 'Board switcher gesture', status: 'backlog', priority: 'low', labels: ['design'] },
  {
    title: 'Play Store listing and screenshots',
    status: 'done',
    priority: 'low',
    assignee: 0,
    labels: ['launch'],
    doneAgo: 9,
  },
];

const payments = [
  {
    title: 'JazzCash checkout integration',
    status: 'in_progress',
    priority: 'high',
    assignee: 3,
    labels: ['payments'],
    due: 5,
  },
  {
    title: 'Easypaisa wallet payments',
    status: 'todo',
    priority: 'high',
    assignee: 2,
    labels: ['payments'],
    due: 12,
    dependsOn: [0],
  },
  {
    title: 'Show prices in PKR with correct formatting',
    status: 'done',
    priority: 'medium',
    assignee: 4,
    labels: ['frontend'],
    doneAgo: 6,
    description: 'Rs 1,250 rather than PKR 1250.00, and lakh grouping for large amounts.',
  },
  {
    title: 'Refund flow for duplicate charges',
    status: 'blocked',
    priority: 'high',
    assignee: 3,
    labels: ['payments'],
    due: 3,
    description: 'Waiting on the bank to share sandbox credentials for the refund API.',
  },
  {
    title: 'Email receipts after payment',
    status: 'in_review',
    priority: 'medium',
    assignee: 5,
    labels: ['notifications'],
    due: 2,
  },
  { title: 'Reconcile failed transactions nightly', status: 'backlog', priority: 'medium', labels: ['payments'] },
  { title: 'Card payments through a local acquirer', status: 'backlog', priority: 'low', labels: ['payments'] },
  { title: 'Pricing page for teams', status: 'done', priority: 'low', assignee: 0, labels: ['frontend'], doneAgo: 13 },
];

export const boards = [
  { name: 'Platform', key: 'PLAT', description: 'API, infrastructure and realtime.', tasks: platform },
  { name: 'Mobile App', key: 'MOB', description: 'Android and iOS apps.', tasks: mobile },
  { name: 'Payments', key: 'PAY', description: 'JazzCash, Easypaisa and card checkout.', tasks: payments },
];

// Comment threads: [board key, task index, [[author index, body], ...]]. Long enough
// on PLAT-1 to show off the AI summary.
export const threads = [
  [
    'PLAT',
    0,
    [
      [1, 'Starting on this. Plan: stand up a 3-node replica set in staging, dual-write sessions for a day, then flip reads.'],
      [2, 'Heads up that sign-in reads sessions on every request. If the cluster adds latency there, everyone will feel it.'],
      [1, "Good point. I'll add an index on the session token and measure sign-in latency before and after the flip."],
      [0, "What's the rollback plan if latency gets worse after the flip?"],
      [
        1,
        "Reads go through a feature flag. Flipping it back points us at the old primary, which keeps receiving writes until we're confident.",
      ],
      [3, 'Staging numbers look fine: p95 on session reads went from 1.8ms to 2.1ms. Well within budget.'],
      [
        2,
        "@bilal refresh token rotation (PLAT-2) touches the same code path. Can we land that first so we don't rebase twice?",
      ],
      [1, "Agreed. I'll hold the flip until PLAT-2 is merged. Dual-writes can keep running in the meantime."],
      [0, "Sounds good. @bilal owns the flip once PLAT-2 is in, targeting Thursday. Let's not do it on a Friday."],
    ],
  ],
  [
    'PLAT',
    3,
    [[1, 'Profiled it: the members populate runs once per task. The fix is PLAT-17, but that needs the cluster migration first.']],
  ],
  [
    'PAY',
    0,
    [
      [3, 'Sandbox is working. Hosted checkout redirects back to /payments/return with the transaction status.'],
      [4, 'Do we verify the response hash on our side, or trust the redirect?'],
      [
        3,
        'We verify it. The redirect only updates the UI; the order is marked paid from the server-to-server callback after the hash checks out.',
      ],
      [0, '@usman please add a test for an expired transaction too. People often close the app halfway through paying.'],
    ],
  ],
];
