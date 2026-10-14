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
| Events | `POST/GET /sources/:id/events`, `GET/PATCH/DELETE /events/:id`, `GET /events/:id/history` |
| Tokens | `POST/GET /spaces/:id/tokens`, `POST /tokens/batch`, `POST /tokens/:token/activate`, `DELETE /tokens/:id` |
| Members | `GET /spaces/:id/members`, `PATCH/DELETE /members/:id` |
| Sync | `POST/GET /sync/connections`, `DELETE /sync/connections/:id`, `POST /sync/connections/:id/force`, `POST/DELETE /sources/:id/link`, `GET /sync/conflicts`, `POST /sync/conflicts/:id/resolve` |
| Shares (B2B) | `POST /events/:id/share`, `DELETE /shares/:id` |
| AI | `POST /ai/parse`, `GET /ai/filters`, `POST /ai/conflict-suggest` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read` |
| Admin | `GET /admin/spaces`, `GET /admin/users`, `PATCH /admin/spaces/:id`, `PATCH /admin/users/:id` |

## WebSocket

Socket.IO на том же хосте. Комнаты — по пространствам. События:
`event.created`, `event.updated`, `event.deleted`, `member.joined`, `member.kicked`,
`token.activated`. Авторизация — JWT при подключении (этап 4).

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
