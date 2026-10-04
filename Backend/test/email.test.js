// The email service talks to Brevo over HTTPS. fetch is stubbed, so nothing is sent.

import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEmail(env) {
  vi.resetModules();
  vi.stubEnv('BREVO_API_KEY', '');
  vi.stubEnv('GMAIL_USER', '');
  vi.stubEnv('GMAIL_APP_PASSWORD', '');
  vi.stubEnv('MAIL_FROM', '');
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('../src/services/email.js');
}

function stubFetch(status, body) {
  const fetchMock = vi.fn(async () => ({ ok: status < 300, status, statusText: 'x', json: async () => body }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('parseAddress', () => {
  it('reads "Name <email>" and bare addresses', async () => {
    const { parseAddress } = await loadEmail({});
    expect(parseAddress('Ayesha Khan <ayesha@example.com>')).toEqual({ name: 'Ayesha Khan', email: 'ayesha@example.com' });
    expect(parseAddress('"Team" <team@example.com>')).toEqual({ name: 'Team', email: 'team@example.com' });
    expect(parseAddress(' hira@example.com ')).toEqual({ email: 'hira@example.com' });
  });
});

describe('sendEmail with Brevo', () => {
  it('sends through the HTTP API with the verified sender', async () => {
    const fetchMock = stubFetch(201, { messageId: '<abc@brevo>' });
    const { sendEmail, provider } = await loadEmail({ BREVO_API_KEY: 'test-key', MAIL_FROM: 'team@example.com' });
    expect(provider).toBe('brevo');

    const result = await sendEmail({
      to: 'hira@example.com',
      subject: '123456 is your code',
      text: 'Your code is 123456',
      html: '<p>123456</p>',
      replyTo: 'Usman Tariq <usman@example.com>',
    });

    expect(result).toEqual({ provider: 'brevo', messageId: '<abc@brevo>' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.headers['api-key']).toBe('test-key');
    expect(JSON.parse(init.body)).toEqual({
      sender: { name: 'PulseBoard', email: 'team@example.com' },
      to: [{ email: 'hira@example.com' }],
      subject: '123456 is your code',
      textContent: 'Your code is 123456',
      htmlContent: '<p>123456</p>',
      replyTo: { name: 'Usman Tariq', email: 'usman@example.com' },
    });
  });

  it('surfaces the reason when Brevo refuses the email', async () => {
    stubFetch(400, { code: 'invalid_parameter', message: 'Sender is not valid' });
    const { sendEmail } = await loadEmail({ BREVO_API_KEY: 'test-key', MAIL_FROM: 'team@example.com' });
    await expect(sendEmail({ to: 'a@example.com', subject: 's', text: 't' })).rejects.toThrow(
      'Brevo rejected the email (400): Sender is not valid',
    );
  });
});

describe('sendEmail without a provider', () => {
  it("doesn't try to send anything", async () => {
    const fetchMock = stubFetch(201, {});
    const { sendEmail, provider } = await loadEmail({});
    expect(provider).toBe('none');
    expect(await sendEmail({ to: 'a@example.com', subject: 's', text: 't' })).toEqual({ provider: 'none', messageId: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
