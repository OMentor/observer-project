# Схема БД

Источник истины: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).
СУБД: PostgreSQL 16.

## Таблицы

| Модель | Назначение |
|--------|------------|
| `users` | Пользователи: email/phone, `password_hash` (bcrypt), `role`, `timezone` |
| `spaces` | Пространства (контейнер для группы). Мягкое удаление |
| `sources` | Источники (календари) внутри пространства: имя, цвет, `visibility` |
| `events` | События: `start_at`/`end_at` (UTC), `timezone`, `all_day`, `rrule`, `recurrence_parent_id` |
| `event_exceptions` | Изменённые/удалённые вхождения серии: `occurrence_at`, override-поля, `external_etag`, `sync_status` |
| `tokens` | Одноразовые приглашения: `token_hash`, `preset`, срок, отзыв |
| `space_members` | Участники пространства с пресетом |
| `event_history` | Аудит: `action`, `old_data`, `new_data` (JSON) |
| `external_connections` | Подключения пользователя к внешним календарям (шифрование AES-256-GCM) |
| `source_external_map` | Связь источника с внешним календарём и направление синхронизации |
| `sync_conflicts` | Конфликты синхронизации и их разрешение |
| `event_shares` | Расшаривание событий между источниками (B2B) |

## Проектные решения (сверх ТЗ)

1. **Повторяющиеся события.** Добавлены `rrule` (строка iCalendar RRULE),
   `recurrence_parent_id` (ссылка на «родителя» серии) и таблица
   `event_exceptions` для переопределённых и удалённых вхождений
   (`UNIQUE(event_id, occurrence_at)`, каскадное удаление).
2. **Часовые пояса.** Время хранится в UTC; на событии и пользователе есть IANA
   `timezone` для корректного отображения и синхронизации.
3. **Приватные источники.** У `sources` есть `owner_id` (nullable) и `visibility`
   (`SHARED` / `PRIVATE`). Общий источник виден участникам пространства; личные
   источники и личные записи видит только автор. Владелец решает, кому шарить свой
   календарь.
4. **Секрет токена.** В `tokens` хранится только `token_hash`; сам токен
   возвращается один раз при создании.
5. **Роль пользователя.** `users.role` (`USER` / `ADMIN`) для админ-панели этапа 8.

## Идентификаторы

Все первичные ключи — `uuid`. Внешние ключи — `uuid` с индексами по часто
фильтруемым полям (`source_id`, `start_at`, `creator_id`, `space_id`).
