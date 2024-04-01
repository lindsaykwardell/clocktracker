-- AlterEnum
ALTER TYPE "ChartType" ADD VALUE 'LIST';

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateIndex
CREATE INDEX "Friend_user_id_idx" ON "Friend"("user_id");

-- CreateIndex
CREATE INDEX "Game_user_id_idx" ON "Game"("user_id");
