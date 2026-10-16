import { io, type Socket } from 'socket.io-client';
import { useRealtimeStore } from '@/store/realtime';
import type { CalendarEvent, Preset } from '@/lib/types';

export const RealtimeEvents = {
  connected: 'connected',
  spaceSubscribe: 'space:subscribe',
  spaceUnsubscribe: 'space:unsubscribe',
  eventCreated: 'event.created',
  eventUpdated: 'event.updated',
  eventDeleted: 'event.deleted',
  memberJoined: 'member.joined',
  memberUpdated: 'member.updated',
  memberKicked: 'member.kicked',
  tokenActivated: 'token.activated',
} as const;

export type RealtimeEventName =
  | typeof RealtimeEvents.eventCreated
  | typeof RealtimeEvents.eventUpdated
  | typeof RealtimeEvents.eventDeleted
  | typeof RealtimeEvents.memberJoined
  | typeof RealtimeEvents.memberUpdated
  | typeof RealtimeEvents.memberKicked
  | typeof RealtimeEvents.tokenActivated;

export type EventRealtimePayload = {
  space_id: string;
  source_id: string;
  event: CalendarEvent;
  actor_id: string;
};

export type MemberRealtimePayload = {
  space_id: string;
  member_id?: string;
  user_id: string;
  preset: Preset;
  actor_id?: string;
};

export type TokenRealtimePayload = {
  space_id: string;
  user_id: string;
  preset: Preset;
  actor_id?: string;
};

export type KickedRealtimePayload = {
  space_id: string;
  user_id: string;
  actor_id?: string;
};

export type RealtimePayload =
  | EventRealtimePayload
  | MemberRealtimePayload
  | TokenRealtimePayload
  | KickedRealtimePayload;

export type RealtimeMessage = {
  event: RealtimeEventName;
  payload: RealtimePayload;
};

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const BRCAST: RealtimeEventName[] = [
  RealtimeEvents.eventCreated,
  RealtimeEvents.eventUpdated,
  RealtimeEvents.eventDeleted,
  RealtimeEvents.memberJoined,
  RealtimeEvents.memberUpdated,
  RealtimeEvents.memberKicked,
  RealtimeEvents.tokenActivated,
];

let socket: Socket | null = null;

export function connectRealtime(
  token: string,
  onMessage: (message: RealtimeMessage) => void,
): () => void {
  const store = useRealtimeStore.getState();
  store.setStatus('connecting');

  const next = io(baseURL, {
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    transports: ['polling', 'websocket'],
  });

  socket = next;

  next.on('connect', () => {
    useRealtimeStore.getState().setStatus('connected');
  });
  next.on('disconnect', () => {
    useRealtimeStore.getState().setStatus('disconnected');
  });
  next.on('connect_error', () => {
    useRealtimeStore.getState().setStatus('disconnected');
  });

  for (const event of BRCAST) {
    next.on(event, (payload: RealtimePayload) => {
      onMessage({ event, payload });
    });
  }

  return () => {
    if (socket === next) {
      next.close();
      socket = null;
      useRealtimeStore.getState().setStatus('disconnected');
    }
  };
}

export function disconnectRealtime(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
  useRealtimeStore.getState().setStatus('disconnected');
}

export function subscribeSpace(spaceId: string): void {
  socket?.emit(RealtimeEvents.spaceSubscribe, { space_id: spaceId });
}

export function unsubscribeSpace(spaceId: string): void {
  socket?.emit(RealtimeEvents.spaceUnsubscribe, { space_id: spaceId });
}
