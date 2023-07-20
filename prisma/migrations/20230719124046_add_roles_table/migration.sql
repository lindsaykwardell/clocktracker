/*
  Warnings:

  - You are about to drop the column `characters` on the `Script` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('TOWNSFOLK', 'OUTSIDER', 'MINION', 'DEMON', 'TRAVELER');

-- AlterTable
ALTER TABLE "Script" DROP COLUMN "characters";

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initial_alignment" "Alignment" NOT NULL,
    "token_url" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToScript" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToScript_AB_unique" ON "_RoleToScript"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToScript_B_index" ON "_RoleToScript"("B");

-- AddForeignKey
ALTER TABLE "_RoleToScript" ADD CONSTRAINT "_RoleToScript_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToScript" ADD CONSTRAINT "_RoleToScript_B_fkey" FOREIGN KEY ("B") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;
