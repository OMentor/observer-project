import { api } from '@/lib/api';
import type {
  AuthResponse,
  CalendarEvent,
  EventHistoryEntry,
  EventPayload,
  Space,
  Source,
} from '@/lib/types';

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function logoutRequest(refreshToken: string) {
  await api.post('/auth/logout', { refreshToken });
}

export async function fetchSpaces() {
  const { data } = await api.get<Space[]>('/spaces');
  return data;
}

export async function fetchSpace(id: string) {
  const { data } = await api.get<Space>(`/spaces/${id}`);
  return data;
}

export async function createSpace(name: string) {
  const { data } = await api.post<Space>('/spaces', { name });
  return data;
}

export async function updateSpace(id: string, name: string) {
  const { data } = await api.patch<Space>(`/spaces/${id}`, { name });
  return data;
}

export async function deleteSpace(id: string) {
  await api.delete(`/spaces/${id}`);
}

export async function createSource(
  spaceId: string,
  payload: { name: string; color?: string; visibility?: 'SHARED' | 'PRIVATE' },
) {
  const { data } = await api.post<Source>(
    `/spaces/${spaceId}/sources`,
    payload,
  );
  return data;
}

export async function deleteSource(id: string) {
  await api.delete(`/sources/${id}`);
}

export async function fetchEvents(sourceId: string) {
  const { data } = await api.get<CalendarEvent[]>(
    `/sources/${sourceId}/events`,
  );
  return data;
}

export async function createEvent(sourceId: string, payload: EventPayload) {
  const { data } = await api.post<CalendarEvent>(
    `/sources/${sourceId}/events`,
    payload,
  );
  return data;
}

export async function updateEvent(id: string, payload: EventPayload) {
  const { data } = await api.patch<CalendarEvent>(`/events/${id}`, payload);
  return data;
}

export async function deleteEvent(id: string) {
  await api.delete(`/events/${id}`);
}

export async function fetchEventHistory(id: string) {
  const { data } = await api.get<EventHistoryEntry[]>(`/events/${id}/history`);
  return data;
}
