export type UserRole = 'USER' | 'ADMIN';
export type Visibility = 'SHARED' | 'PRIVATE';
export type Preset = 'FULL' | 'OWN' | 'BUSY' | 'READ';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  timezone: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type Space = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  deleted_at: string | null;
  sources?: Source[];
};

export type Source = {
  id: string;
  space_id: string;
  owner_id: string | null;
  name: string;
  color: string;
  visibility: Visibility;
  created_at: string;
};

export type SyncStatus = 'local' | 'synced' | 'pending' | 'conflict';

export type CalendarEvent = {
  id: string;
  source_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  timezone: string;
  location: string | null;
  rrule: string | null;
  created_at: string;
  updated_at: string;
  sync_status?: SyncStatus;
  busy?: boolean;
};

export type EventPayload = {
  title: string;
  start_at: string;
  end_at: string;
  all_day?: boolean;
  timezone?: string;
  location?: string | null;
  description?: string | null;
};

export type EventHistoryEntry = {
  id: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  created_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user: { id: string; name: string };
};

export type EventPage = {
  items: CalendarEvent[];
  total: number;
  page: number;
  pageSize: number;
};

export type EventQuery = {
  space_id?: string;
  source_id?: string;
  creator_id?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type Token = {
  id: string;
  space_id: string;
  preset: Preset;
  created_by: string;
  expires_at: string | null;
  used_at: string | null;
  used_by: string | null;
  revoked_at: string | null;
  created_at: string;
  token?: string;
  creator?: { id: string; name: string };
  used_by_user?: { id: string; name: string } | null;
};

export type Member = {
  id: string;
  space_id: string;
  user_id: string;
  preset: Preset;
  joined_at: string;
  revoked_at: string | null;
  user: { id: string; name: string; email: string };
};

export type TokenActivation = {
  success: boolean;
  space_id: string;
  preset: Preset;
};

export type FunnelStepKey =
  | 'signup'
  | 'space_created'
  | 'token_created'
  | 'token_activated'
  | 'event_created';

export type FunnelStep = {
  key: FunnelStepKey;
  label: string;
  count: number;
};

export type FunnelReport = {
  steps: FunnelStep[];
  generated_at: string;
};

/** Снимок полей события в конфликте (snake_case, даты — ISO-строки). */
export type EventSnapshot = {
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  timezone: string;
  location: string | null;
  rrule: string | null;
};

export type ConflictResolution = 'local' | 'external' | 'merged';

export type Conflict = {
  id: string;
  event_id: string;
  connection_id: string;
  local_data: EventSnapshot;
  external_data: EventSnapshot;
  external_etag: string | null;
  resolution: ConflictResolution | null;
  resolved_at: string | null;
  created_at: string;
  event: { id: string; title: string; source_id: string };
};

export type ConflictList = {
  items: Conflict[];
  limit: number;
  offset: number;
};

export type MergedEventData = Partial<{
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  timezone: string;
  location: string | null;
}>;

export type ResolveConflictPayload =
  | { resolution: 'local' }
  | { resolution: 'external' }
  | { resolution: 'merged'; merged_data: MergedEventData };
