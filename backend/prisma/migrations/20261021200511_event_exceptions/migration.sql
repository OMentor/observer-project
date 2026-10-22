-- CreateTable
CREATE TABLE "event_exceptions" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "occurrence_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "all_day" BOOLEAN,
    "timezone" TEXT,
    "location" TEXT,
    "rrule" TEXT,
    "external_etag" TEXT,
    "sync_status" "EventSyncStatus" NOT NULL DEFAULT 'local',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_exceptions_event_id_occurrence_at_key" ON "event_exceptions"("event_id", "occurrence_at");

-- AddForeignKey
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
