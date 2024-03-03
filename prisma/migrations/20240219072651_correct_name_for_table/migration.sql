/*
  Warnings:

  - You are about to drop the `RoleReminders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoleReminders" DROP CONSTRAINT "RoleReminders_role_id_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- DropTable
DROP TABLE "RoleReminders";

-- CreateTable
CREATE TABLE "RoleReminder" (
    "id" SERIAL NOT NULL,
    "reminder" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "RoleReminder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoleReminder" ADD CONSTRAINT "RoleReminder_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
