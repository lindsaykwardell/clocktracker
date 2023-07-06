-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('ONLINE', 'IN_PERSON');

-- AlterTable
ALTER TABLE "game" ADD COLUMN     "location_type" "LocationType" NOT NULL DEFAULT 'ONLINE';
