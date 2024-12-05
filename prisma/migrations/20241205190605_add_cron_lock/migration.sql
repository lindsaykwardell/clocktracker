-- CreateTable
CREATE TABLE "CronLock" (
    "task_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronLock_pkey" PRIMARY KEY ("task_id")
);
