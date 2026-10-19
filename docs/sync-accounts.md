# Проверка CalDAV-провайдеров (Этап 6, Фаза 0.1)

Статус: **в процессе**. Яндекс/Mail.ru — ожидают получения паролей от владельца
аккаунтов. Apple iCloud — отложен до Этапа 7 (нет iPhone/Mac у тестировщика).
Для разработки и интеграционных тестов используется локальный Radicale
(`http://localhost:5232`, контейнер `calendar-radicale`, `auth type = none`).
Стоп-условие этапа: подтверждены ≥2 провайдера (Яндекс, Mail.ru).
Пароли сюда **не вписывать** — только результаты. Рабочие креды хранить вне репозитория.

## Как проверить (PROPFIND)

URL-ы (кандидаты на подтверждение):

| Провайдер | CalDAV URL | Тип пароля |
|-----------|-----------|------------|
| Яндекс | `https://caldav.yandex.ru` | App Password (настройки → Почтовые клиенты) |
| Mail.ru | `https://caldav.mail.ru` | Пароль приложения (Настройки → Пароли приложений) |
| Apple iCloud | `https://caldav.icloud.com` | App-specific password (appleid.apple.com); требует устройство Apple для выдачи |

Пример (заменить `$LOGIN`/`$APP_PASSWORD`):

```
curl -u "$LOGIN:$APP_PASSWORD" -X PROPFIND \
  -H "Depth: 1" \
  --data '<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:"><d:prop><d:displayname/></d:prop></d:propfind>' \
  "https://caldav.yandex.ru/"
```

Ожидаемый успех: HTTP **207 Multi-Status** с `<d:response>`; отдельно проверить
`PROPFIND` на `/calendars/` (или `<home-sets>`) с `Depth: 1` — должны вернуться календари.
Типичные ошибки: **401** (не app-password/не тот URL), **403** (двухфактор без app-password),
**404** (сменился базовый URL).

## Результаты

| Провайдер | Дата | PROPFIND корень | PROPFIND календари | Список календарей | Заметки | Итог |
|-----------|------|-----------------|--------------------|-------------------|---------|------|
| Яндекс | 19.10.2026 | 207 | 207 | 2 («Мои события», «Не забыть») | home-set `/calendars/fingertrax111@yandex.ru/`; tsdav вернул 2 календаря | ✅ работает |
| Mail.ru | — | — | — | — | ожидаем пароль | не проверено |
| Apple iCloud | 19.10.2026 | — | — | — | отложен до Этапа 7 (нет iPhone/Mac) | отложен |
| Radicale (local) | 19.10.2026 | 207 | — | — | `http://localhost:5232`, `auth none`, principal `/dev/` | ok (dev) |

## Pull end-to-end (Фаза 2, локальный Radicale)

Проверено вручную 19.10.2026 через реальную очередь BullMQ и воркер
(`calendar-radicale`, календарь `dev/e2e`):

| Сценарий | Действие во внешнем календаре | Результат pull |
|----------|-------------------------------|----------------|
| create | PUT нового VEVENT | `+1` (`sync_status='synced'`, `external_etag` заполнен) |
| idempotent | повторный force-pull без изменений | `+0 ~0 -0 (=1)` (ETag совпал) |
| update | PUT того же UID с новым SUMMARY/DTSTART | `+0 ~1 -0` (обновлено на месте, без дубля) |
| delete | DELETE ресурса | `+0 ~0 -1`; событие soft-delete (`GET /events` → 0) |

## Push end-to-end (Фаза 3, локальный Radicale)

Проверено вручную 19.10.2026 через реальную очередь BullMQ и воркер:

| Локальное действие | Внешний календарь | Итог |
|--------------------|-------------------|------|
| `POST /sources/:id/events` | появляется `/dev/e2e/<id>.ics` с UID/SUMMARY/DTSTART | `push … created`, `sync_status='synced'`, `external_etag` |
| `PATCH /events/:id` | ресурс обновлён (новый DTSTART/SUMMARY) | `push … updated` |
| `DELETE /events/:id` | `GET` ресурса → **404** | `push … deleted` |
| правка в Radicale (curl PUT) + `PATCH /events/:id` | внешний объект **не** перезаписан | `push … conflict`, `sync_conflicts` запись, `sync_status='conflict'` |

## Решение по этапу

- Подтверждено провайдеров: **1 / 2** (Яндекс ✅; нужен ещё Mail.ru или ≥2 суммарно).
- Разработка Фазы 1 (CalDAV-адаптер) велась против локального Radicale и
  подтверждена на реальном Яндексе (интеграционный тест
  `backend/src/sync/providers/caldav.provider.integration.spec.ts`, пропускается
  без `YANDEX_TEST_LOGIN/PASS` в локальном `.env`).
- Apple отложен до Этапа 7 — scope Фазы 1 не меняется (Яндекс + Mail.ru).

## Заметки по Яндексу

- Базовый URL: `https://caldav.yandex.ru`; discovery: `current-user-principal`
  → `/principals/users/<login>/` → `calendar-home-set`
  → `/calendars/<login>/`.
- tsdav (Node fetch) прошёл и без явного `User-Agent`, но провайдер отправляет
  `User-Agent: Pletenie/0.1 (Sync-Engine)` защитно (Яндекс может блокировать без него).
- `todos-*` возвращается как календарь (`resourcetype: calendar`); фильтрация
  задач (VTODO) — вне scope MVP.
