import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import {
  batchTokens,
  createToken,
  fetchSpaces,
  fetchTokens,
  revokeToken,
} from '@/lib/services';
import type { Preset, Token } from '@/lib/types';
import { PRESETS, PRESET_HINTS, PRESET_LABELS } from '@/lib/presets';
import { useSpaceAccess } from '@/hooks/access';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { PresetBadge } from '@/components/ui/preset-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { CopyButton } from '@/components/CopyButton';
import { SpacePicker } from '@/components/SpacePicker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

function formatDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleString('ru-RU');
}

type TokenStatusKey = 'active' | 'used' | 'expired' | 'revoked';

function tokenStatus(token: Token): {
  key: TokenStatusKey;
  label: string;
  tone: BadgeTone;
} {
  if (token.revoked_at) {
    return { key: 'revoked', label: 'Отозван', tone: 'danger' };
  }
  if (token.used_at) {
    return { key: 'used', label: 'Использован', tone: 'muted' };
  }
  if (token.expires_at && new Date(token.expires_at).getTime() < Date.now()) {
    return { key: 'expired', label: 'Истёк', tone: 'muted' };
  }
  return { key: 'active', label: 'Активен', tone: 'accent' };
}

const STATUS_LABELS: Record<TokenStatusKey, string> = {
  active: 'Активные',
  used: 'Использованные',
  expired: 'Истёкшие',
  revoked: 'Отозванные',
};

export function TokensPage() {
  const queryClient = useQueryClient();
  const { data: spaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const [searchParams] = useSearchParams();
  const [spaceId, setSpaceId] = useState(searchParams.get('space') ?? '');
  const selectedSpaceId = spaceId || spaces[0]?.id || '';
  const { isFull, preset } = useSpaceAccess(selectedSpaceId);

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['tokens', selectedSpaceId],
    queryFn: () => fetchTokens(selectedSpaceId),
    enabled: Boolean(selectedSpaceId && isFull),
  });

  const [open, setOpen] = useState(false);
  const [tokenPreset, setTokenPreset] = useState<Preset>('OWN');
  const [expiresAt, setExpiresAt] = useState('');
  const [count, setCount] = useState(1);
  const [issued, setIssued] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | TokenStatusKey>(
    'active',
  );
  const [presetFilter, setPresetFilter] = useState<'' | Preset>('');
  const [creatorSearch, setCreatorSearch] = useState('');

  const filtersActive =
    statusFilter !== 'active' || Boolean(presetFilter) || Boolean(creatorSearch);

  const filteredTokens = useMemo(
    () =>
      tokens.filter((token) => {
        if (presetFilter && token.preset !== presetFilter) {
          return false;
        }
        if (
          creatorSearch &&
          !(token.creator?.name ?? '')
            .toLowerCase()
            .includes(creatorSearch.toLowerCase())
        ) {
          return false;
        }
        if (statusFilter !== 'all' && tokenStatus(token).key !== statusFilter) {
          return false;
        }
        return true;
      }),
    [tokens, presetFilter, creatorSearch, statusFilter],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const expires = expiresAt
        ? new Date(`${expiresAt}T23:59:59`).toISOString()
        : null;
      if (count > 1) {
        return batchTokens({
          space_id: selectedSpaceId,
          preset: tokenPreset,
          count,
          expires_at: expires,
        });
      }
      return [
        await createToken(selectedSpaceId, {
          preset: tokenPreset,
          expires_at: expires,
        }),
      ];
    },
    onSuccess: (created) => {
      setIssued(created);
      setOpen(false);
      setExpiresAt('');
      setCount(1);
      queryClient.invalidateQueries({ queryKey: ['tokens', selectedSpaceId] });
    },
    onError: () => setError('Не удалось создать токен'),
  });

  const revokeMutation = useMutation({
    mutationFn: revokeToken,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tokens', selectedSpaceId] }),
  });

  if (spacesLoading) {
    return <p className="text-body-sm text-text-secondary">Загрузка…</p>;
  }

  if (spaces.length === 0) {
    return (
      <section className="space-y-6">
        <h1 className="font-serif text-h1 text-text-primary">Токены</h1>
        <EmptyState
          icon={<KeyRound className="size-5" />}
          title="Сначала создайте пространство"
          description="Токены приглашают участников в пространство с заданным пресетом прав."
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-h1 text-text-primary">Токены</h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            Токены приглашают участников с заданным пресетом прав.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SpacePicker
            spaces={spaces}
            value={selectedSpaceId}
            onChange={setSpaceId}
          />
          {isFull && (
            <Button
              onClick={() => {
                setError(null);
                setOpen(true);
              }}
            >
              <Plus className="size-4" />
              Токен
            </Button>
          )}
        </div>
      </div>

      {!isFull && (
        <div className="rounded-lg bg-bg-surface p-4 text-body-sm text-text-secondary shadow-card">
          {preset
            ? `Ваш пресет — «${PRESET_LABELS[preset]}». Управление токенами доступно только владельцу и участникам с полным доступом.`
            : 'Нет доступа к этому пространству.'}
        </div>
      )}

      {issued.length > 0 && (
        <div className="space-y-2 rounded-lg border border-accent/40 bg-accent-muted p-4">
          <p className="text-body text-text-primary">
            Токен{issued.length > 1 ? 'ы' : ''} показывается один раз —
            сохраните {issued.length > 1 ? 'их' : 'его'} сейчас.
          </p>
          {issued.map((token) => (
            <div
              key={token.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg px-3 py-2"
            >
              <KeyRound className="size-4 shrink-0 text-amber" />
              <code className="min-w-0 flex-1 truncate font-mono text-mono text-text-primary">
                {token.token}
              </code>
              <PresetBadge preset={token.preset} />
              <CopyButton value={token.token ?? ''} label="Токен" />
              <CopyButton
                value={`${window.location.origin}/activate/${token.token}`}
                label="Ссылка"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setIssued([])}
            className="text-caption text-text-muted transition-colors hover:text-text-primary"
          >
            Скрыть
          </button>
        </div>
      )}

      {isFull && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-bg-surface p-3 shadow-card">
          <Select
            containerClassName="w-[180px]"
            aria-label="Статус"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | TokenStatusKey)
            }
          >
            <option value="all">Все статусы</option>
            {(Object.keys(STATUS_LABELS) as TokenStatusKey[]).map((key) => (
              <option key={key} value={key}>
                {STATUS_LABELS[key]}
              </option>
            ))}
          </Select>

          <Select
            containerClassName="w-[180px]"
            aria-label="Пресет"
            value={presetFilter}
            onChange={(e) => setPresetFilter(e.target.value as '' | Preset)}
          >
            <option value="">Все пресеты</option>
            {PRESETS.map((item) => (
              <option key={item} value={item}>
                {PRESET_LABELS[item]}
              </option>
            ))}
          </Select>

          <Input
            value={creatorSearch}
            onChange={(e) => setCreatorSearch(e.target.value)}
            placeholder="Поиск по автору"
            className="max-w-xs flex-1"
            aria-label="Поиск по автору"
          />

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('active');
                setPresetFilter('');
                setCreatorSearch('');
              }}
            >
              Сбросить
            </Button>
          )}

          <span className="text-caption text-text-muted">
            Найдено: {filteredTokens.length}
          </span>
        </div>
      )}

      {isFull &&
        (isLoading ? (
          <p className="text-body-sm text-text-secondary">Загрузка…</p>
        ) : filteredTokens.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="size-5" />}
            title={
              filtersActive
                ? 'Нет токенов по заданным фильтрам'
                : 'Активных токенов нет'
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-bg-surface shadow-card">
            <table className="w-full text-body-sm">
              <thead className="border-b border-border bg-bg-elevated text-left">
                <tr>
                  <th className="px-4 py-3 text-overline text-text-secondary">
                    Пресет
                  </th>
                  <th className="px-4 py-3 text-overline text-text-secondary">
                    Создал
                  </th>
                  <th className="px-4 py-3 text-overline text-text-secondary">
                    Создан
                  </th>
                  <th className="px-4 py-3 text-overline text-text-secondary">
                    Действует до
                  </th>
                  <th className="px-4 py-3 text-overline text-text-secondary">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-right text-overline text-text-secondary">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map((token) => {
                  const status = tokenStatus(token);
                  return (
                    <tr
                      key={token.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-bg-elevated/50"
                    >
                      <td className="px-4 py-3">
                        <PresetBadge preset={token.preset} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {token.creator?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(token.created_at)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(token.expires_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!token.revoked_at && (
                          <IconButton
                            icon={<Trash2 className="size-4" />}
                            label="Отозвать"
                            variant="danger"
                            className="ml-auto"
                            onClick={() => revokeMutation.mutate(token.id)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[640px]">
          <DialogTitle>Новый токен</DialogTitle>
          <DialogDescription>
            Участник активирует токен и получит доступ с указанным пресетом.
          </DialogDescription>
          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              createMutation.mutate();
            }}
          >
            <Field label="Пресет" htmlFor="token-preset" helper={PRESET_HINTS[tokenPreset]}>
              <Select
                id="token-preset"
                value={tokenPreset}
                onChange={(event) =>
                  setTokenPreset(event.target.value as Preset)
                }
              >
                {PRESETS.map((item) => (
                  <option key={item} value={item}>
                    {PRESET_LABELS[item]}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Действует до" htmlFor="token-expires">
                <Input
                  id="token-expires"
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
              </Field>
              <Field label="Количество" htmlFor="token-count">
                <Input
                  id="token-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(event) =>
                    setCount(
                      Math.min(
                        100,
                        Math.max(1, Number(event.target.value) || 1),
                      ),
                    )
                  }
                />
              </Field>
            </div>

            {error && <p className="text-caption text-danger">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending}
              >
                Создать
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
