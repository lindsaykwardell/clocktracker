-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "script" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "script_id" INTEGER,
ADD COLUMN     "storytellers" TEXT[],
ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;
