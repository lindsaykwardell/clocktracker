/*
  Warnings:

  - The values [EXECUTION] on the enum `DeathCause` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "DeathType" AS ENUM ('DEATH', 'EXECUTION');

-- AlterEnum
BEGIN;
CREATE TYPE "DeathCause_new" AS ENUM ('ABILITY', 'NOMINATION');
ALTER TABLE "DeathEvent" ALTER COLUMN "cause" TYPE "DeathCause_new" USING ("cause"::text::"DeathCause_new");
ALTER TYPE "DeathCause" RENAME TO "DeathCause_old";
ALTER TYPE "DeathCause_new" RENAME TO "DeathCause";
DROP TYPE "public"."DeathCause_old";
COMMIT;

-- AlterTable
ALTER TABLE "DeathEvent" ADD COLUMN     "by_role_id" TEXT,
ADD COLUMN     "death_type" "DeathType";

-- AddForeignKey
ALTER TABLE "DeathEvent" ADD CONSTRAINT "DeathEvent_by_role_id_fkey" FOREIGN KEY ("by_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
