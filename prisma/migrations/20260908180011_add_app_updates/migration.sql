-- CreateTable
CREATE TABLE "AppUpdate" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "cursor" TEXT,
    "stats" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AppUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppUpdate_status_idx" ON "AppUpdate"("status");
