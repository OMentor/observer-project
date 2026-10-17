import { useQuery } from '@tanstack/react-query';
import { fetchEventPage, fetchSpaces, fetchTokens } from '@/lib/services';
import type { OnboardingProgress } from '@/lib/onboarding';

export function useOnboardingProgress(): OnboardingProgress & {
  isLoading: boolean;
} {
  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const firstSpaceId = spaces[0]?.id;

  const { data: tokens = [] } = useQuery({
    queryKey: ['tokens', firstSpaceId],
    queryFn: () => fetchTokens(firstSpaceId as string),
    enabled: Boolean(firstSpaceId),
    retry: false,
  });

  const { data: eventPage } = useQuery({
    queryKey: ['events', { onboarding: true }],
    queryFn: () => fetchEventPage({ page: 1, pageSize: 1 }),
  });

  return {
    isLoading,
    spacesCount: spaces.length,
    hasToken: tokens.length > 0,
    hasEvent: (eventPage?.total ?? 0) > 0,
  };
}
