-- CreateEnum
CREATE TYPE "ExternalProvider" AS ENUM ('yandex', 'mailru', 'apple');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('active', 'error', 'orphaned');

-- CreateEnum
CREATE TYPE "ExternalMapStatus" AS ENUM ('active', 'orphaned');

-- CreateEnum
CREATE TYPE "EventSyncStatus" AS ENUM ('local', 'synced', 'pending', 'conflict');

-- CreateEnum
CREATE TYPE "ConflictResolution" AS ENUM ('local', 'external', 'merged');

-- AlterEnum
BEGIN;
CREATE TYPE "SyncDirection_new" AS ENUM ('both', 'in', 'out');
ALTER TABLE "public"."source_external_map" ALTER COLUMN "sync_direction" DROP DEFAULT;
ALTER TABLE "source_external_map" ALTER COLUMN "sync_direction" TYPE "SyncDirection_new" USING ("sync_direction"::text::"SyncDirection_new");
ALTER TYPE "SyncDirection" RENAME TO "SyncDirection_old";
ALTER TYPE "SyncDirection_new" RENAME TO "SyncDirection";
DROP TYPE "public"."SyncDirection_old";
ALTER TABLE "source_external_map" ALTER COLUMN "sync_direction" SET DEFAULT 'both';
COMMIT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "external_etag" TEXT,
DROP COLUMN "external_provider",
ADD COLUMN     "external_provider" "ExternalProvider",
DROP COLUMN "sync_status",
ADD COLUMN     "sync_status" "EventSyncStatus" NOT NULL DEFAULT 'local';

-- AlterTable
ALTER TABLE "external_connections" DROP COLUMN "access_token",
DROP COLUMN "caldav_password",
DROP COLUMN "refresh_token",
DROP COLUMN "token_expires_at",
ADD COLUMN     "caldav_password_enc" TEXT NOT NULL,
ADD COLUMN     "last_error" TEXT,
DROP COLUMN "provider",
ADD COLUMN     "provider" "ExternalProvider" NOT NULL,
ALTER COLUMN "caldav_url" SET NOT NULL,
ALTER COLUMN "caldav_username" SET NOT NULL,
DROP COLUMN "sync_status",
ADD COLUMN     "sync_status" "ConnectionStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "source_external_map" ADD COLUMN     "external_calendar_name" TEXT,
ADD COLUMN     "sync_status" "ExternalMapStatus" NOT NULL DEFAULT 'active',
ALTER COLUMN "sync_direction" SET DEFAULT 'both';

-- AlterTable
ALTER TABLE "sync_conflicts" ADD COLUMN     "external_etag" TEXT,
DROP COLUMN "resolution",
ADD COLUMN     "resolution" "ConflictResolution";

-- DropEnum
DROP TYPE "SyncProvider";

-- DropEnum
DROP TYPE "SyncStatus";

-- CreateIndex
CREATE UNIQUE INDEX "source_external_map_external_connection_id_external_calenda_key" ON "source_external_map"("external_connection_id", "external_calendar_id");
