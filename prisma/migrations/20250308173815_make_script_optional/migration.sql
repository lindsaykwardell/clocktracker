-- DropForeignKey
ALTER TABLE "LSGame" DROP CONSTRAINT "LSGame_script_id_fkey";

-- AlterTable
ALTER TABLE "LSGame" ALTER COLUMN "script_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LSGame" ADD CONSTRAINT "LSGame_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;
