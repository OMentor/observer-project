export type UserRole = 'USER' | 'ADMIN';
export type Visibility = 'SHARED' | 'PRIVATE';

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
