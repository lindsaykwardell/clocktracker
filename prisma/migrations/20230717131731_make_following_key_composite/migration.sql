/*
  Warnings:

  - The primary key for the `Following` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Following` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Following" DROP CONSTRAINT "Following_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Following_pkey" PRIMARY KEY ("user_id", "following_id");
