-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "storyteller_id" INTEGER;

-- CreateTable
CREATE TABLE "Storyteller" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userSettingsUser_id" TEXT,

    CONSTRAINT "Storyteller_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_storyteller_id_fkey" FOREIGN KEY ("storyteller_id") REFERENCES "Storyteller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storyteller" ADD CONSTRAINT "Storyteller_userSettingsUser_id_fkey" FOREIGN KEY ("userSettingsUser_id") REFERENCES "UserSettings"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
