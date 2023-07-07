/*
  Warnings:

  - You are about to drop the column `usernrame` on the `UserSettings` table. All the data in the column will be lost.
  - Added the required column `username` to the `UserSettings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "usernrame",
ADD COLUMN     "username" TEXT NOT NULL;
