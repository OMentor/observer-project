import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { UserMinus } from 'lucide-react';
import {
  fetchMembers,
  fetchSpaces,
  removeMember,
  updateMember,
} from '@/lib/services';
import type { Preset } from '@/lib/types';
import { PRESETS, PRESET_LABELS } from '@/lib/presets';
import { useSpaceAccess } from '@/hooks/access';
import { SpacePicker } from '@/components/SpacePicker';

export function MembersPage() {
  const queryClient = useQueryClient();
  const { data: spaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const [searchParams] = useSearchParams();
  const [spaceId, setSpaceId] = useState(searchParams.get('space') ?? '');
  const selectedSpaceId = spaceId || spaces[0]?.id || '';
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId);
  const { isFull } = useSpaceAccess(selectedSpaceId);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', selectedSpaceId],
    queryFn: () => fetchMembers(selectedSpaceId),
    enabled: Boolean(selectedSpaceId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, preset }: { id: string; preset: Preset }) =>
      updateMember(id, preset),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['members', selectedSpaceId] }),
  });

  const kickMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['members', selectedSpaceId] }),
  });

  if (spacesLoading) {
    return <p className="text-sm text-muted">Загрузка…</p>;
  }

  if (spaces.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="font-serif text-3xl text-text">Участники</h1>
        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
          Сначала создайте пространство.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-text">Участники</h1>
          <p className="mt-1 text-sm text-muted">
            Пресеты определяют, что доступно участнику.
          </p>
        </div>
        <SpacePicker
          spaces={spaces}
          value={selectedSpaceId}
          onChange={setSpaceId}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Участник</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Пресет</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isOwner = member.user.id === selectedSpace?.owner_id;
                return (
                  <tr key={member.id} className="border-t border-border">
                    <td className="px-4 py-2 text-text">
                      {member.user.name}
                      {isOwner && (
                        <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                          Владелец
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {member.user.email}
                    </td>
                    <td className="px-4 py-2">
                      {isFull && !isOwner ? (
                        <select
                          value={member.preset}
                          onChange={(event) =>
                            updateMutation.mutate({
                              id: member.id,
                              preset: event.target.value as Preset,
                            })
                          }
                          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-accent"
                        >
                          {PRESETS.map((item) => (
                            <option key={item} value={item}>
                              {PRESET_LABELS[item]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-muted">
                          {PRESET_LABELS[member.preset]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isFull && !isOwner && (
                        <button
                          type="button"
                          onClick={() => kickMutation.mutate(member.id)}
                          className="inline-flex items-center gap-1 text-xs text-muted hover:text-conflict"
                        >
                          <UserMinus className="size-3.5" />
                          Исключить
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
