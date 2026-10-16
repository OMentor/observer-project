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
import { Label } from '@/components/ui/label';
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
  tone: string;
} {
  if (token.revoked_at) {
    return { key: 'revoked', label: 'Отозван', tone: 'text-conflict' };
  }
  if (token.used_at) {
    return { key: 'used', label: 'Использован', tone: 'text-muted' };
  }
  if (token.expires_at && new Date(token.expires_at).getTime() < Date.now()) {
    return { key: 'expired', label: 'Истёк', tone: 'text-muted' };
  }
  return { key: 'active', label: 'Активен', tone: 'text-accent' };
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
      return [await createToken(selectedSpaceId, { preset: tokenPreset, expires_at: expires })];
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
    return <p className="text-sm text-muted">Загрузка…</p>;
  }

  if (spaces.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="font-serif text-3xl text-text">Токены</h1>
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
          <h1 className="font-serif text-3xl text-text">Токены</h1>
          <p className="mt-1 text-sm text-muted">
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
            <Button onClick={() => { setError(null); setOpen(true); }}>
              <Plus className="size-4" />
              Токен
            </Button>
          )}
        </div>
      </div>

      {!isFull && (
        <div className="rounded-xl border border-border bg-surface/40 p-4 text-sm text-muted">
          {preset
            ? `Ваш пресет — «${PRESET_LABELS[preset]}». Управление токенами доступно только владельцу и участникам с полным доступом.`
            : 'Нет доступа к этому пространству.'}
        </div>
      )}

      {issued.length > 0 && (
        <div className="space-y-2 rounded-xl border border-accent/40 bg-accent/5 p-4">
          <p className="text-sm text-text">
            Токен{issued.length > 1 ? 'ы' : ''} показывается один раз —
            сохраните {issued.length > 1 ? 'их' : 'его'} сейчас.
          </p>
          {issued.map((token) => (
            <div
              key={token.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2"
            >
              <KeyRound className="size-4 text-accent" />
              <code className="min-w-0 flex-1 truncate text-xs text-text">
                {token.token}
              </code>
              <span className="text-xs text-muted">
                {PRESET_LABELS[token.preset]}
              </span>
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
            className="text-xs text-muted hover:text-text"
          >
            Скрыть
          </button>
        </div>
      )}

      {isFull && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | TokenStatusKey)
            }
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          >
            <option value="all">Все статусы</option>
            {(Object.keys(STATUS_LABELS) as TokenStatusKey[]).map((key) => (
              <option key={key} value={key}>
                {STATUS_LABELS[key]}
              </option>
            ))}
          </select>

          <select
            value={presetFilter}
            onChange={(e) => setPresetFilter(e.target.value as '' | Preset)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          >
            <option value="">Все пресеты</option>
            {PRESETS.map((item) => (
              <option key={item} value={item}>
                {PRESET_LABELS[item]}
              </option>
            ))}
          </select>

          <Input
            value={creatorSearch}
            onChange={(e) => setCreatorSearch(e.target.value)}
            placeholder="Поиск по автору"
            className="max-w-xs flex-1"
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

          <span className="text-xs text-muted">
            Найдено: {filteredTokens.length}
          </span>
        </div>
      )}

      {isFull &&
        (isLoading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : filteredTokens.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
            {filtersActive
              ? 'Нет токенов по заданным фильтрам.'
              : 'Активных токенов нет.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Пресет</th>
                  <th className="px-4 py-2 font-medium">Создал</th>
                  <th className="px-4 py-2 font-medium">Создан</th>
                  <th className="px-4 py-2 font-medium">Действует до</th>
                  <th className="px-4 py-2 font-medium">Статус</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map((token) => {
                  const status = tokenStatus(token);
                  return (
                    <tr key={token.id} className="border-t border-border">
                      <td className="px-4 py-2 text-text">
                        {PRESET_LABELS[token.preset]}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {token.creator?.name ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {formatDate(token.created_at)}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {formatDate(token.expires_at)}
                      </td>
                      <td className={`px-4 py-2 ${status.tone}`}>
                        {status.label}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {!token.revoked_at && (
                          <button
                            type="button"
                            onClick={() => revokeMutation.mutate(token.id)}
                            className="inline-flex items-center gap-1 text-xs text-muted hover:text-conflict"
                          >
                            <Trash2 className="size-3.5" />
                            Отозвать
                          </button>
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
        <DialogContent>
          <DialogTitle>Новый токен</DialogTitle>
          <DialogDescription>
            Участник активирует токен и получит доступ с указанным пресетом.
          </DialogDescription>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              createMutation.mutate();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="token-preset">Пресет</Label>
              <select
                id="token-preset"
                value={tokenPreset}
                onChange={(event) =>
                  setTokenPreset(event.target.value as Preset)
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
              >
                {PRESETS.map((item) => (
                  <option key={item} value={item}>
                    {PRESET_LABELS[item]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">{PRESET_HINTS[tokenPreset]}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="token-expires">Действует до</Label>
                <Input
                  id="token-expires"
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="token-count">Количество</Label>
                <Input
                  id="token-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(event) =>
                    setCount(
                      Math.min(100, Math.max(1, Number(event.target.value) || 1)),
                    )
                  }
                />
              </div>
            </div>

            {error && <p className="text-xs text-conflict">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Создать
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
