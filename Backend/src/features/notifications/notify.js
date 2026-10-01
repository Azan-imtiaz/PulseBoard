import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { sendEmail } from '../../services/email.js';
import { UserModel } from '../auth/user.model.js';

function taskUrl(task, board) {
  return `${config.CLIENT_ORIGIN}/w/${board.workspace}/b/${board._id}?task=${board.key}-${task.number}`;
}

function layout(heading, body, url) {
  return `<div style="font-family:Inter,system-ui,sans-serif;font-size:14px;color:#111;max-width:520px">
  <p style="font-size:15px;font-weight:600;margin:0 0 12px">${escape(heading)}</p>
  <p style="margin:0 0 20px;color:#444;line-height:1.5">${escape(body)}</p>
  <a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">Open task</a>
</div>`;
}

function escape(value) {
  return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

// Notifications are fire-and-forget: a mail outage must never fail the request that caused it.
function deliver(to, subject, heading, body, url) {
  sendEmail({ to, subject, text: `${heading}\n\n${body}\n\n${url}`, html: layout(heading, body, url) }).catch((err) =>
    logger.error({ err, to, subject }, 'failed to send notification email'),
  );
}

export async function notifyAssigned(task, board, actorId) {
  if (String(task.assignee) === actorId) return;
  const [assignee, actor] = await Promise.all([UserModel.findById(task.assignee), UserModel.findById(actorId)]);
  if (!assignee) return;

  const key = `${board.key}-${task.number}`;
  deliver(
    assignee.email,
    `[${key}] Assigned to you: ${task.title}`,
    `${actor?.name ?? 'Someone'} assigned you ${key}`,
    task.title,
    taskUrl(task, board),
  );
}

export async function notifyMentioned(task, board, actorId, userIds, body) {
  const recipients = userIds.filter((id) => id !== actorId);
  if (!recipients.length) return;

  const [users, actor] = await Promise.all([UserModel.find({ _id: { $in: recipients } }), UserModel.findById(actorId)]);
  const key = `${board.key}-${task.number}`;
  const excerpt = body.length > 280 ? `${body.slice(0, 277)}…` : body;

  for (const user of users) {
    deliver(
      user.email,
      `[${key}] ${actor?.name ?? 'Someone'} mentioned you`,
      `${actor?.name ?? 'Someone'} mentioned you on ${key}: ${task.title}`,
      excerpt,
      taskUrl(task, board),
    );
  }
}

export async function notifyDueSoon(task, board) {
  const assignee = await UserModel.findById(task.assignee);
  if (!assignee || !task.dueDate) return;

  const key = `${board.key}-${task.number}`;
  const due = task.dueDate.toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  deliver(assignee.email, `[${key}] Due ${due}`, `${key} is due ${due}`, task.title, taskUrl(task, board));
}
