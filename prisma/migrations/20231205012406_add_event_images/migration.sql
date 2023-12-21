-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "image" TEXT,
ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';
