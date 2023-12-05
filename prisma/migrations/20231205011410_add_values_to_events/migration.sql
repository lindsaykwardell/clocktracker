/*
  Warnings:

  - Added the required column `location` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "location_type" "LocationType" NOT NULL DEFAULT 'ONLINE',
ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';
