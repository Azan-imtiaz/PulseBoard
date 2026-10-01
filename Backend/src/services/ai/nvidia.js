import { z } from 'zod';
import { config } from '../../config.js';
import { HttpError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

// The only file that knows which model provider we use. NVIDIA's hosted models
// (build.nvidia.com) speak the OpenAI chat-completions format, so this is a plain
// fetch. Swapping providers means reimplementing these two functions.

async function chat(messages, maxTokens) {
  if (!config.NVIDIA_API_KEY) {
    throw new HttpError(503, 'AI features are not configured on this server', 'ai_disabled');
  }

  const res = await fetch(`${config.NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.NVIDIA_MODEL, messages, max_tokens: maxTokens, temperature: 0.2 }),
    signal: AbortSignal.timeout(60_000),
  });

  if (res.status === 429) {
    throw new HttpError(429, 'The AI provider is rate limiting us. Try again in a minute.', 'rate_limited');
  }
  if (!res.ok) {
    logger.error({ status: res.status, body: await res.text() }, 'NVIDIA API request failed');
    throw new HttpError(502, 'The AI service returned an error. Try again.', 'ai_bad_response');
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim();
}

export function generateText({ system, prompt, maxTokens = 1024 }) {
  return chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    maxTokens,
  );
}

// Models wrap JSON in prose or code fences often enough that we take the outermost
// {...} rather than trusting the whole reply.
function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no JSON object in reply');
  return JSON.parse(text.slice(start, end + 1));
}

// Structured output: describe the shape with the zod schema, ask for JSON only,
// validate the reply, and give the model one chance to fix a bad answer.
export async function generateObject({ system, prompt, schema, maxTokens = 2048 }) {
  const { $schema: _, ...jsonSchema } = z.toJSONSchema(schema);
  const messages = [
    {
      role: 'system',
      content: `${system}\n\nReply with a single JSON object that matches this JSON Schema, and nothing else:\n${JSON.stringify(jsonSchema)}`,
    },
    { role: 'user', content: prompt },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const reply = await chat(messages, maxTokens);
    try {
      return schema.parse(extractJson(reply));
    } catch (err) {
      messages.push(
        { role: 'assistant', content: reply },
        {
          role: 'user',
          content: `That reply was not valid (${err.message.slice(0, 300)}). Reply with only the corrected JSON object.`,
        },
      );
    }
  }
  throw new HttpError(502, 'The AI response was incomplete. Try again.', 'ai_bad_response');
}
