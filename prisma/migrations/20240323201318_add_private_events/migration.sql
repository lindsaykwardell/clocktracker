-- AlterEnum
ALTER TYPE "WhoCanRegister" ADD VALUE 'PRIVATE';

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';
