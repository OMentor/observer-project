# API

Базовый URL локально: `http://localhost:3000`.
Машиночитаемый контракт: [`openapi/openapi.yaml`](../openapi/openapi.yaml).
Swagger UI: `http://localhost:3000/docs`.

## Аутентификация

Все эндпоинты требуют `Authorization: Bearer <access_token>`, кроме:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /health`

`POST /tokens/:token/activate` требует авторизации (активирует токен от имени вошедшего пользователя).

Access-токен живёт 15 минут, refresh — 30 дней (хранится в Redis, ротация при обновлении).

## Модули

| Модуль | Эндпоинты |
|--------|-----------|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Spaces | `POST/GET /spaces`, `GET/PATCH/DELETE /spaces/:id` |
| Sources | `POST/GET /spaces/:id/sources`, `PATCH/DELETE /sources/:id` |
| Events | `POST/GET /sources/:id/events`, `GET /events` (сводный список с фильтрами/пагинацией), `GET/PATCH/DELETE /events/:id` (для серии — `scope=single\|all` + `occurrence_at`), `GET /events/:id/history` |
| Tokens | `POST/GET /spaces/:id/tokens`, `POST /tokens/batch`, `POST /tokens/:token/activate`, `DELETE /tokens/:id` |
| Members | `GET /spaces/:id/members`, `PATCH/DELETE /members/:id` |
| Sync | `POST/GET /sync/connections`, `DELETE /sync/connections/:id`, `POST /sync/connections/:id/force`, `POST/DELETE /sources/:id/link`, `GET /sync/conflicts`, `POST /sync/conflicts/:id/resolve` |
| Shares (B2B) | `POST /events/:id/share`, `DELETE /shares/:id` |
| AI | `POST /ai/parse`, `GET /ai/filters`, `POST /ai/conflict-suggest` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read` |
| Admin | `GET /admin/spaces`, `GET /admin/users`, `PATCH /admin/spaces/:id`, `PATCH /admin/users/:id` |

## WebSocket

Socket.IO на том же хосте (`http://localhost:3000`, path `/socket.io`), CORS для
`http://localhost:5173` и `http://localhost:3000`. Реализация — `RealtimeGateway`
(см. `backend/src/realtime/`).

**Авторизация при подключении.** Соединение отклоняется, если JWT не передан или
невалиден. Токен берётся по приоритету: `auth.token` (handshake), `?token=` в query,
заголовок `Authorization: Bearer`. При успехе сервер добавляет сокет в комнату
`user:<userId>` и во все `space:<id>` доступных пользователю пространств.

**Комнаты.** `user:<id>` — личные адресные события; `space:<id>` — события
пространства. Подписка вручную: `space:subscribe` / `space:unsubscribe` с телом
`{ space_id }` (с проверкой доступа через `SpacesService.getAccess`).

**Исходящие события (сервер → клиент):**

| Событие | Получатели | Payload |
|---------|-----------|---------|
| `connected` | подключившийся сокет | `{ user_id }` |
| `event.created` / `event.updated` / `event.deleted` | пользователи пространства (по комнате `user:<id>`, маскированно под каждого) | `{ space_id, source_id, event, actor_id }` |
| `member.joined` | комната пространства + пользователь | `{ space_id, user_id, preset, actor_id }` |
| `member.updated` | комната пространства + пользователь | `{ space_id, member_id, user_id, preset, actor_id }` |
| `member.kicked` | комната пространства + пользователь | `{ space_id, user_id, actor_id }` |
| `token.activated` | комната пространства | `{ space_id, user_id, preset, actor_id }` |

`event` в payload уже маскирован под получателя (для `BUSY`/чужих `OWN` → `title`:
«Занято», `busy: true`). События из `PRIVATE`-источников не рассылаются получателям
без пресета `FULL`. `actor_id` — инициатор изменения (используется клиентами, чтобы
не показывать уведомление о собственном действии).

**Force-leave при кике.** При `DELETE /members/:id` сервер удаляет сокеты
отозванного пользователя из комнаты `space:<id>`, поэтому дальнейшие события
пространства ему не приходят.

Проверка протокола (два клиента, маскировка, кик, реконнект):
`pnpm qa:realtime` в `web/` (требует запущенных backend и PostgreSQL).

## Пресеты прав

`FULL` — полный доступ (владелец пространства всегда имеет FULL); `OWN` — только
свои события, чужие отдаются как «Занято»; `BUSY` — только занятость (без деталей
событий); `READ` — только чтение (полные данные, без изменений).

Права проверяются глобальным `PresetGuard` по `@RequirePreset(...)` на контроллерах
и дублируются в сервисах. Матрица по действиям:

| Действие | FULL | OWN | BUSY | READ |
|----------|:----:|:---:|:----:|:----:|
| Просмотр пространства/источников/событий | ✅ | ✅ (свои полностью) | ✅ (только занятость) | ✅ |
| Создание/изменение/удаление источников | ✅ | ⛔ | ⛔ | ⛔ |
| Создание события | ✅ | ✅ | ⛔ | ⛔ |
| Изменение/удаление события | ✅ (любого) | ✅ (только своего) | ⛔ | ⛔ |
| История события | ✅ | ✅ (своего) | ⛔ | ✅ |
| Токены (создание/batch/список/отзыв) | ✅ (владелец) | ⛔ | ⛔ | ⛔ |
| Участники (список) | ✅ | ✅ | ✅ | ✅ |
| Участники (пресет/кик) | ✅ (владелец) | ⛔ | ⛔ | ⛔ |

Маскировка события (`busy: true`) скрывает `title` (→ «Занято»), `description` и
`location`. Токен одноразовый: успешная активация помечает его использованным
(повтор → 409), отозванный/истёкший → 400. Кик участника — мягкий (`revoked_at`),
история сохраняется; владельца кикнуть/сменить пресет нельзя.
