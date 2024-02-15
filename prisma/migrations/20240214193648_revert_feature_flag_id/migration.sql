/*
  Warnings:

  - The primary key for the `FeatureFlag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FeatureFlag` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `A` on the `_FeatureFlagToUserSettings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "_FeatureFlagToUserSettings" DROP CONSTRAINT "_FeatureFlagToUserSettings_A_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "FeatureFlag" DROP CONSTRAINT "FeatureFlag_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "_FeatureFlagToUserSettings" DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "_FeatureFlagToUserSettings_AB_unique" ON "_FeatureFlagToUserSettings"("A", "B");

-- AddForeignKey
ALTER TABLE "_FeatureFlagToUserSettings" ADD CONSTRAINT "_FeatureFlagToUserSettings_A_fkey" FOREIGN KEY ("A") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
