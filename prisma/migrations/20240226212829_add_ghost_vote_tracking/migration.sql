-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "used_ghost_vote" BOOLEAN NOT NULL DEFAULT false;
