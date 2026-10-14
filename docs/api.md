# API

Базовый URL локально: `http://localhost:3000`.
Машиночитаемый контракт: [`openapi/openapi.yaml`](../openapi/openapi.yaml).
Swagger UI: `http://localhost:3000/docs`.

## Аутентификация

Все эндпоинты требуют `Authorization: Bearer <access_token>`, кроме:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /tokens/:token/activate`

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

`FULL` — полный доступ; `OWN` — только свои события; `BUSY` — только занятость
(без деталей); `READ` — только чтение.
