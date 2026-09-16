import { hashUserData, type UserData } from './hash';

export type EventName =
  | 'PageView'
  | 'ViewContent'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Subscribe'
  | 'Purchase';

export interface BrowserEvent {
  eventName: EventName;
  eventId: string;
  eventTime: number;
  sourceUrl: string;
  custom?: Record<string, unknown>;
}

export interface ServerEvent {
  event_name: EventName;
  event_id: string;
  event_time: number;
  action_source: 'website';
  event_source_url: string;
  user_data: Record<string, string>;
  custom_data?: Record<string, unknown>;
}

export function newEventId(): string {
  return crypto.randomUUID();
}

export function browserEvent(
  eventName: EventName,
  sourceUrl: string,
  custom?: Record<string, unknown>,
): BrowserEvent {
  return {
    eventName,
    eventId: newEventId(),
    eventTime: Math.floor(Date.now() / 1000),
    sourceUrl,
    custom,
  };
}

export function readClickIds(cookie: string): { fbp?: string; fbc?: string } {
  const out: { fbp?: string; fbc?: string } = {};
  for (const part of cookie.split(';')) {
    const [rawName, ...rest] = part.split('=');
    const name = rawName?.trim();
    const value = rest.join('=').trim();
    if (!value) continue;
    if (name === '_fbp') out.fbp = value;
    if (name === '_fbc') out.fbc = value;
  }
  return out;
}

export async function toServerEvent(
  event: BrowserEvent,
  user: UserData,
  clickIds: { fbp?: string; fbc?: string } = {},
): Promise<ServerEvent> {
  const user_data = await hashUserData(user);
  if (clickIds.fbp) user_data.fbp = clickIds.fbp;
  if (clickIds.fbc) user_data.fbc = clickIds.fbc;

  return {
    event_name: event.eventName,
    event_id: event.eventId,
    event_time: event.eventTime,
    action_source: 'website',
    event_source_url: event.sourceUrl,
    user_data,
    custom_data: event.custom,
  };
}
