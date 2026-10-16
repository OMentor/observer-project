import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import {
  connectRealtime,
  RealtimeEvents,
  type RealtimeMessage,
} from '@/lib/realtime';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toasts';

function handleMessage(message: RealtimeMessage, queryClient: QueryClient) {
  const me = useAuthStore.getState().user?.id;
  const push = useToastStore.getState().push;
  const { event, payload } = message;

  if (event === RealtimeEvents.eventCreated) {
    const data = payload as { event: { title: string; creator_id: string } };
    queryClient.invalidateQueries({ queryKey: ['event-page'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    if (data.event.creator_id !== me) {
      push({ title: 'Новое событие', description: data.event.title, tone: 'info' });
    }
    return;
  }

  if (
    event === RealtimeEvents.eventUpdated ||
    event === RealtimeEvents.eventDeleted
  ) {
    const data = payload as { event: { creator_id: string } };
    queryClient.invalidateQueries({ queryKey: ['event-page'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['history'] });
    if (data.event.creator_id !== me) {
      push({
        title:
          event === RealtimeEvents.eventUpdated
            ? 'Событие обновлено'
            : 'Событие удалено',
        tone: 'info',
      });
    }
    return;
  }

  if (event === RealtimeEvents.memberKicked) {
    const data = payload as { space_id: string; user_id: string };
    queryClient.invalidateQueries({ queryKey: ['members'] });
    queryClient.invalidateQueries({ queryKey: ['spaces'] });
    if (data.user_id === me) {
      push({ title: 'Доступ отозван', description: 'Вы удалены из пространства', tone: 'warning' });
    } else {
      push({ title: 'Участник удалён', tone: 'info' });
    }
    return;
  }

  if (
    event === RealtimeEvents.memberJoined ||
    event === RealtimeEvents.memberUpdated
  ) {
    queryClient.invalidateQueries({ queryKey: ['members'] });
    queryClient.invalidateQueries({ queryKey: ['spaces'] });
    return;
  }

  if (event === RealtimeEvents.tokenActivated) {
    const data = payload as { user_id: string };
    queryClient.invalidateQueries({ queryKey: ['tokens'] });
    queryClient.invalidateQueries({ queryKey: ['members'] });
    queryClient.invalidateQueries({ queryKey: ['spaces'] });
    if (data.user_id !== me) {
      push({ title: 'Токен активирован', description: 'Новый участник присоединился', tone: 'success' });
    }
  }
}

export function useRealtime() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const disconnect = connectRealtime(accessToken, (message) => {
      handleMessage(message, queryClient);
    });
    return disconnect;
  }, [accessToken, queryClient]);
}
