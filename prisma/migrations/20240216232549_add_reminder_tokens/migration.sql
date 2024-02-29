-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateTable
CREATE TABLE "ReminderToken" (
    "id" SERIAL NOT NULL,
    "reminder" TEXT NOT NULL DEFAULT '',
    "token_url" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_id" INTEGER,

    CONSTRAINT "ReminderToken_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReminderToken" ADD CONSTRAINT "ReminderToken_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;
