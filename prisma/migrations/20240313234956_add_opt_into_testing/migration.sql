-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "opt_into_testing" BOOLEAN NOT NULL DEFAULT false;
