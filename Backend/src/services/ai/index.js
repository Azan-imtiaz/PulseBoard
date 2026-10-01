import { z } from 'zod';
import { generateObject, generateText } from './nvidia.js';

// Business logic calls these three functions with plain data. Prompts live here;
// the provider lives in nvidia.js.

export function summarizeThread(thread) {
  const comments = thread.comments
    .map((c) => `[${c.createdAt.toISOString().slice(0, 16)}] ${c.author}: ${c.body}`)
    .join('\n');

  return generateText({
    system:
      'You summarize task discussions for a busy engineering team. Be concrete and brief. ' +
      'Use at most 5 short bullet points in Markdown: the current state, decisions made, open questions, and who owns the next step. ' +
      'No preamble, no headings.',
    prompt: `Task ${thread.key}: ${thread.title} (status: ${thread.status})\n\nDescription:\n${thread.description || '(none)'}\n\nComments:\n${comments || '(no comments yet)'}`,
    maxTokens: 500,
  });
}

export function writeSprintReport(facts) {
  return generateText({
    system:
      'You write sprint reports for an engineering team lead. Plain, direct Markdown. ' +
      'Sections, each as a "###" heading: Summary (2–3 sentences), Shipped, Blocked, Velocity, Watch next. ' +
      'Group related work instead of listing every task. Use only the facts given; never invent tasks, people, or numbers.',
    prompt: JSON.stringify(facts, null, 2),
    maxTokens: 1200,
  });
}

export const prioritySuggestionsSchema = z.object({
  overview: z.string().describe('One or two sentences on where the team should focus next.'),
  suggestions: z
    .array(
      z.object({
        taskId: z.string(),
        priority: z.enum(['urgent', 'high', 'medium', 'low']),
        reason: z.string().describe('Under 20 words, citing the signal that drove it.'),
      }),
    )
    .describe('Only tasks whose priority should change, most important first. At most 8.'),
});

export function suggestPriorities(board, candidates) {
  return generateObject({
    schema: prioritySuggestionsSchema,
    system:
      'You help an engineering team triage. Given open tasks with computed signals, suggest priority changes. ' +
      'Weigh overdue or soon-due work, tasks that unblock many others, and work that has gone stale while in progress. ' +
      'Suggest a change only when the signals clearly justify it. Use the taskId values exactly as given.',
    prompt: `Board: ${board}\nToday: ${new Date().toISOString().slice(0, 10)}\n\nOpen tasks:\n${JSON.stringify(candidates, null, 2)}`,
  });
}
