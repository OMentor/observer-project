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
  syncConflict: 'sync.conflict',
} as const;

export type EventAction =
  | typeof RealtimeEvents.eventCreated
  | typeof RealtimeEvents.eventUpdated
  | typeof RealtimeEvents.eventDeleted;
