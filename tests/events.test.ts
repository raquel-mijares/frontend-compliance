import { describe, it, expect } from 'vitest';
import {
  browserEvent,
  newEventId,
  readClickIds,
  toServerEvent,
} from '../src/events';

describe('event deduplication', () => {
  it('gives every event its own id', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newEventId()));
    expect(ids.size).toBe(500);
  });

  it('keeps the same event_id and event_name on both sides', async () => {
    const browser = browserEvent('Purchase', 'https://example.com/checkout');
    const server = await toServerEvent(browser, { email: 'ana@example.com' });

    expect(server.event_id).toBe(browser.eventId);
    expect(server.event_name).toBe(browser.eventName);
  });

  it('sends event_time in seconds, not milliseconds', () => {
    const browser = browserEvent('Lead', 'https://example.com');
    expect(browser.eventTime).toBeLessThan(Date.now() / 100);
    expect(String(browser.eventTime)).toHaveLength(10);
  });

  it('never sends raw personal data to the server payload', async () => {
    const browser = browserEvent('Lead', 'https://example.com');
    const server = await toServerEvent(browser, {
      email: 'ana@example.com',
      phone: '+1 403 555 0142',
    });

    const serialized = JSON.stringify(server);
    expect(serialized).not.toContain('ana@example.com');
    expect(serialized).not.toContain('4035550142');
    expect(server.user_data.em).toMatch(/^[a-f0-9]{64}$/);
  });

  it('normalizes before hashing so both sides match', async () => {
    const a = await toServerEvent(browserEvent('Lead', 'https://example.com'), {
      email: '  Ana@Example.COM ',
    });
    const b = await toServerEvent(browserEvent('Lead', 'https://example.com'), {
      email: 'ana@example.com',
    });

    expect(a.user_data.em).toBe(b.user_data.em);
  });

  it('forwards fbp and fbc when present', async () => {
    const clickIds = readClickIds('_fbp=fb.1.123.456; _ga=GA1.1.9; _fbc=fb.1.123.abc');
    const server = await toServerEvent(
      browserEvent('Purchase', 'https://example.com'),
      {},
      clickIds,
    );

    expect(server.user_data.fbp).toBe('fb.1.123.456');
    expect(server.user_data.fbc).toBe('fb.1.123.abc');
  });

  it('ignores unrelated cookies', () => {
    expect(readClickIds('_ga=GA1.1.9; session=abc')).toEqual({});
    expect(readClickIds('')).toEqual({});
  });
});
