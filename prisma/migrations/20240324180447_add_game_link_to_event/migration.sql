-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "game_link" TEXT,
ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';
