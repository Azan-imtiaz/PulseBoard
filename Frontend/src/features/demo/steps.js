import { BarChart3, Command, MousePointer2, Move, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { modKey } from '@/lib/format';

// The guided tour, shown on the demo page and as a checklist inside the app.
// `action` tells the in-app checklist what clicking the step should do.
export const steps = [
  {
    id: 'move',
    icon: Move,
    title: 'Move a card through the workflow',
    hint: 'Drag a Todo card to In Progress. The server enforces the rules: no assignee, no start.',
    action: { board: true },
  },
  {
    id: 'summary',
    icon: Sparkles,
    title: 'Summarize a long discussion with AI',
    hint: 'PLAT-1 has a nine-comment thread. One click turns it into decisions and next steps.',
    action: { board: true, params: { task: 'PLAT-1' } },
  },
  {
    id: 'report',
    icon: BarChart3,
    title: 'Generate a sprint report',
    hint: 'Real numbers from the activity log, with a write-up by AI.',
    action: { board: true, params: { report: '1' } },
  },
  {
    id: 'prioritize',
    icon: ShieldCheck,
    title: 'Ask AI to suggest priorities',
    hint: 'Weighs due dates, blockers and idle time. Nothing changes until you apply it.',
    action: { board: true, params: { prioritize: '1' } },
  },
  {
    id: 'palette',
    icon: Command,
    title: `Search everything with ${modKey} K`,
    hint: 'Jump to any task or board, or run an action, from the keyboard.',
    action: { palette: true },
  },
  {
    id: 'live',
    icon: MousePointer2,
    title: 'Watch it update live',
    hint: 'Open the board in a second tab and move your mouse. Cards, comments and cursors sync instantly.',
    action: { board: true, newTab: true },
  },
  {
    id: 'roles',
    icon: Users,
    title: 'Try it as a Member',
    hint: "Switch role, then try deleting a task someone else created. The API says no, not just the UI.",
    action: { role: 'member' },
  },
];
