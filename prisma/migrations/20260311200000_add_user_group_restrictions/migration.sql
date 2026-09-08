-- AlterTable
ALTER TABLE "UserGroup" ADD COLUMN "restrictions" TEXT[] DEFAULT ARRAY[]::TEXT[];
