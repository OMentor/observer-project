# Отчёт о ходе работ (для заказчика)

Проект: **Плетение** — самостоятельный календарь-планировщик.
Формат: обновляется после каждого этапа. Ведёт: команда разработки.

---

## Этап 0 — Подготовка ✅

**Статус:** завершён. Все данные и код — только локально, удалённых репозиториев нет.

### Что сделано

- **Структура репозитория** `calendar-project/`: `backend/`, `web/`, `mobile/`,
  `infra/`, `docs/`, `openapi/`, `scripts/`. Локальный git (без remote).
- **Инфраструктура:** `infra/docker-compose.yml` — PostgreSQL 16, Redis 7, MinIO,
  MailHog. Скрипты `scripts/`: `db-reset`, `db-seed`, `logs`, `backup`.
- **Backend:** NestJS 11 + Prisma 6 + Jest + ESLint/Prettier. Полная схема БД
  (11 таблиц), генерация Prisma-клиента, Swagger, health-check, заготовка worker.
- **Web:** React 19 + Vite 8 + TypeScript, Tailwind CSS 4, Radix, React Router 7,
  TanStack Query, Zustand, Vitest. Layout (шапка/сайдбар/контент), роутинг, форма
  входа, дизайн-токены из ТЗ (тёмная/светлая темы).
- **Mobile:** Flutter + Riverpod, GoRouter, Dio, sqflite, SharedPreferences.
  Структура `core/ features/ shared/`, экраны входа/календаря/профиля, тема.
- **Контракты:** `openapi/openapi.yaml` — 34 пути, все модули из ТЗ.
- **Документация:** `README.md`, `docs/api.md`, `docs/db.md`, `docs/sync.md`,
  `docs/ai.md`.

### Проверка (критерии этапа 0)

| Критерий | Результат |
|----------|-----------|
| Backend собирается, тесты и линт зелёные | ✅ `nest build`, 1/1 тест, ESLint 0 |
| Backend запускается, `/health` → `ok`, `/docs` → 200 | ✅ |
| Web собирается, тесты и линт зелёные | ✅ Vite build, Vitest 1/1, oxlint 0 |
| Web dev-сервер отдаёт страницу | ✅ `http://localhost:5173` → 200 |
| Mobile: `flutter analyze` без замечаний, тест проходит | ✅ 0 issues, 1/1 |
| OpenAPI-схема согласована | ✅ (валидный YAML) |
| Локальный git без remote | ✅ |

### Проектные решения (согласованы с заказчиком)

- Название продукта — **Плетение**.
- Повторяющиеся события (RRULE), часовые пояса (UTC + IANA), приватные источники —
  заложены в модель сразу.
- Версии — актуальные стабильные; зафиксированы: **NestJS 11** (CommonJS; Nest 12
  в этом окружении ESM-only и несовместим с Node 22 + Jest), **Prisma 6**,
  **React 19 / Vite 8**.
- **Docker установлен** (Docker Desktop 4.95); инфраструктура поднята:
  PostgreSQL 16, Redis 7, MailHog. Postgres доступен на хосте как
  `localhost:5433` — порт 5432 на машине занят нативным PostgreSQL 16,
  поэтому Docker-порт переназначен на 5433.
- Внешние API (DeepSeek/Google/Microsoft) — моки до отдельного подключения.

### Известные ограничения

- Миграция `init` применена и seed выполнен: пользователь
  `demo@pletenie.local`, пространство «Личное», источник «Мой календарь».
- MinIO отключён из профиля по умолчанию: официальный образ `minio/minio`
  больше не доступен публично; включим `--profile storage`, когда понадобятся
  вложения.
- Для сборки mobile под Windows-таргет с плагинами нужен Developer Mode
  (для эмулятора Android/iOS не требуется).

---

## Этап 1 — Ядро ⏳

Ожидает старта: схема БД уже готова, далее — Auth, CRUD пространств/источников/
событий, валидация Zod, unit-тесты.

_Следующие записи добавляются по мере завершения этапов._
