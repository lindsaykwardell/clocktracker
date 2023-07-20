/*
  Warnings:

  - Added the required column `type` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "type" "RoleType" NOT NULL;
