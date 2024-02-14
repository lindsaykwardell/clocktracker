/*
  Warnings:

  - The primary key for the `FeatureFlag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `featureFlagId` on the `UserSettings` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_featureFlagId_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "FeatureFlag" DROP CONSTRAINT "FeatureFlag_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "FeatureFlag_id_seq";

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "featureFlagId";

-- CreateTable
CREATE TABLE "_FeatureFlagToUserSettings" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FeatureFlagToUserSettings_AB_unique" ON "_FeatureFlagToUserSettings"("A", "B");

-- CreateIndex
CREATE INDEX "_FeatureFlagToUserSettings_B_index" ON "_FeatureFlagToUserSettings"("B");

-- AddForeignKey
ALTER TABLE "_FeatureFlagToUserSettings" ADD CONSTRAINT "_FeatureFlagToUserSettings_A_fkey" FOREIGN KEY ("A") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeatureFlagToUserSettings" ADD CONSTRAINT "_FeatureFlagToUserSettings_B_fkey" FOREIGN KEY ("B") REFERENCES "UserSettings"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
