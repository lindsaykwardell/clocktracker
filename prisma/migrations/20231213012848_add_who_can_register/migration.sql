-- CreateEnum
CREATE TYPE "WhoCanRegister" AS ENUM ('ANYONE', 'COMMUNITY_MEMBERS');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "who_can_register" "WhoCanRegister" NOT NULL DEFAULT 'COMMUNITY_MEMBERS',
ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';
