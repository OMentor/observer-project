import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchMembers } from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import type { Preset, Space } from '@/lib/types';

export function useSpaceAccess(spaceId?: string) {
  const me = useAuthStore((s) => s.user?.id);
  const { data: members = [] } = useQuery({
    queryKey: ['members', spaceId],
    queryFn: () => fetchMembers(spaceId as string),
    enabled: Boolean(spaceId && me),
  });
  const preset: Preset | null =
    members.find((member) => member.user.id === me)?.preset ?? null;
  return {
    preset,
    isFull: preset === 'FULL',
    canWriteEvents: preset === 'FULL' || preset === 'OWN',
  };
}

export function useAccessMap(spaces: Space[]) {
  const me = useAuthStore((s) => s.user?.id);
  const results = useQueries({
    queries: spaces.map((space) => ({
      queryKey: ['members', space.id],
      queryFn: () => fetchMembers(space.id),
      enabled: Boolean(me),
    })),
  });
  const map = new Map<string, Preset>();
  results.forEach((result, index) => {
    const preset = result.data?.find((member) => member.user.id === me)
      ?.preset;
    if (preset) {
      map.set(spaces[index].id, preset);
    }
  });
  return map;
}
