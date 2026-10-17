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
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

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
    return <p className="text-body-sm text-text-secondary">Загрузка…</p>;
  }

  if (spaces.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="font-serif text-h1 text-text-primary">Участники</h1>
        <EmptyState
          icon={<UserMinus className="size-5" />}
          title="Нет пространств"
          description="Сначала создайте пространство, чтобы приглашать участников."
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-h1 text-text-primary">Участники</h1>
          <p className="mt-1 text-body-sm text-text-secondary">
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
        <p className="text-body-sm text-text-secondary">Загрузка…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-bg-surface text-left text-caption text-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Участник
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Email
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Пресет
                </th>
                <th scope="col" className="px-4 py-2">
                  <span className="sr-only">Действия</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isOwner = member.user.id === selectedSpace?.owner_id;
                return (
                  <tr key={member.id} className="border-t border-border">
                    <td className="px-4 py-2 text-text-primary">
                      {member.user.name}
                      {isOwner && (
                        <Badge tone="accent" className="ml-2">
                          Владелец
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {member.user.email}
                    </td>
                    <td className="px-4 py-2">
                      {isFull && !isOwner ? (
                        <Select
                          containerClassName="w-40"
                          value={member.preset}
                          onChange={(event) =>
                            updateMutation.mutate({
                              id: member.id,
                              preset: event.target.value as Preset,
                            })
                          }
                        >
                          {PRESETS.map((item) => (
                            <option key={item} value={item}>
                              {PRESET_LABELS[item]}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <span className="text-text-secondary">
                          {PRESET_LABELS[member.preset]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isFull && !isOwner && (
                        <button
                          type="button"
                          onClick={() => kickMutation.mutate(member.id)}
                          className="inline-flex items-center gap-1 text-caption text-text-muted hover:text-danger"
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
