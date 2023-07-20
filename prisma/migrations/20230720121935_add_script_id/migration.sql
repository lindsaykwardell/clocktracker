-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "script_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;
