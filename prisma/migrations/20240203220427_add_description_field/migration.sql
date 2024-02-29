-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "Script" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';
