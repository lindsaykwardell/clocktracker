-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "custom_role" BOOLEAN NOT NULL DEFAULT false;
