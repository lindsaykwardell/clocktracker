-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_date" TIMESTAMP(3);
