import { randomUUID } from 'crypto';

export interface BaseEvent<T = unknown> {
  eventId: string;
  eventName: string;
  aggregateId: string;
  occurredAt: string;
  payload: T;
}

export function createEvent<T>(
  eventName: string,
  aggregateId: string,
  payload: T,
): BaseEvent<T> {
  return {
    eventId: randomUUID(),
    eventName,
    aggregateId,
    occurredAt: new Date().toISOString(),
    payload,
  };
}
