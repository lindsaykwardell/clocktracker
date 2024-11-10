-- AlterTable
ALTER TABLE "GameDetails" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GameV2" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;
