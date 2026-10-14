# Плетение

Самостоятельный календарь-планировщик: **пространства**, **источники**, **события**,
**токены доступа** и двусторонняя синхронизация с внешними календарями
(Яндекс, Mail.ru, Apple через CalDAV; Google; Microsoft).

> Все работы ведутся **локально**. До готовности UI-беты запрещены: удалённые
> git-репозитории, деплои, облака, внешние CI/CD и передача секретов третьим лицам
> (см. ТЗ, разделы 1 и 8.5).

## Стек

| Слой | Технологии |
|------|------------|
| Backend | Node.js 22 LTS, NestJS 11, Prisma 6, PostgreSQL 16, Redis 7, BullMQ, Socket.IO, Zod, JWT |
| Web | React 19, Vite 8, TypeScript, React Router 7, TanStack Query 5, Zustand 5, Tailwind CSS 4, Radix |
| Mobile | Flutter 3.x, Riverpod, GoRouter, Dio, sqflite, SharedPreferences |
| Infra | Docker Compose (PostgreSQL, Redis, MinIO, MailHog) |

Полные контракты: [`openapi/openapi.yaml`](openapi/openapi.yaml).

## Структура

```
calendar-project/
├── backend/    NestJS: REST API + WebSocket + worker (BullMQ)
├── web/        React + Vite + TypeScript (SPA)
├── mobile/     Flutter
├── infra/      docker-compose, локальная инфраструктура
├── docs/       документация (api, db, sync, ai, progress)
├── openapi/    OpenAPI-контракты
└── scripts/    db-reset, db-seed, logs, backup
```

## Требуется установить

- Node.js 22 LTS + pnpm (`corepack enable pnpm`)
- Docker + Docker Compose
- Flutter SDK 3.x

## Локальный запуск

### 1. Инфраструктура

```powershell
docker compose -f infra/docker-compose.yml up -d
```

Сервисы: Postgres `localhost:5432`, Redis `localhost:6379`,
MinIO `localhost:9000` (консоль `:9001`), MailHog SMTP `localhost:1025` (UI `:8025`).

### 2. Backend

```powershell
cd backend
pnpm install
pnpm prisma:migrate
pnpm prisma:seed
pnpm start:dev
```

API: `http://localhost:3000`, Swagger: `http://localhost:3000/docs`.

### 3. Web

```powershell
cd web
pnpm install
pnpm dev
```

`http://localhost:5173`.

### 4. Mobile

```powershell
cd mobile
flutter pub get
flutter run
```

## Переменные окружения

Скопируйте `.env.example` в `.env` (в `backend/` и `web/`). Секреты **не коммитятся**.

## Документация

- [docs/api.md](docs/api.md) — описание API
- [docs/db.md](docs/db.md) — схема БД
- [docs/sync.md](docs/sync.md) — синхронизация и конфликты
- [docs/ai.md](docs/ai.md) — интеграция с DeepSeek
- [docs/progress.md](docs/progress.md) — отчёт о ходе работ (по этапам)
