/*
  Warnings:

  - A unique constraint covering the columns `[ls_game_id]` on the table `Game` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ls_game_id]` on the table `Script` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "ls_game_id" INTEGER;

-- AlterTable
ALTER TABLE "Script" ADD COLUMN     "background" TEXT,
ADD COLUMN     "ls_game_id" INTEGER;

-- CreateTable
CREATE TABLE "LSCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "end_condition" TEXT NOT NULL,
    "end_value" TEXT NOT NULL DEFAULT '',
    "max_townsfolk" INTEGER NOT NULL,
    "max_outsiders" INTEGER NOT NULL,
    "max_minion" INTEGER NOT NULL,
    "max_demon" INTEGER NOT NULL,
    "script_growth_speed" TEXT NOT NULL DEFAULT 'off',
    "script_truncate_speed" TEXT NOT NULL DEFAULT 'off',
    "like_surprises" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LSCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LSGame" (
    "id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL,
    "submitted" TIMESTAMP(3),
    "win" "WinStatus_V2" NOT NULL DEFAULT 'NOT_RECORDED',
    "notes" TEXT NOT NULL DEFAULT '',
    "ls_campaign_id" TEXT NOT NULL,

    CONSTRAINT "LSGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LSCampaignToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Games" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Deaths" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Retire" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LSGame_id_game_id_key" ON "LSGame"("id", "game_id");

-- CreateIndex
CREATE UNIQUE INDEX "_LSCampaignToRole_AB_unique" ON "_LSCampaignToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_LSCampaignToRole_B_index" ON "_LSCampaignToRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Games_AB_unique" ON "_Games"("A", "B");

-- CreateIndex
CREATE INDEX "_Games_B_index" ON "_Games"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Deaths_AB_unique" ON "_Deaths"("A", "B");

-- CreateIndex
CREATE INDEX "_Deaths_B_index" ON "_Deaths"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Retire_AB_unique" ON "_Retire"("A", "B");

-- CreateIndex
CREATE INDEX "_Retire_B_index" ON "_Retire"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Game_ls_game_id_key" ON "Game"("ls_game_id");

-- CreateIndex
CREATE UNIQUE INDEX "Script_ls_game_id_key" ON "Script"("ls_game_id");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_ls_game_id_fkey" FOREIGN KEY ("ls_game_id") REFERENCES "LSGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_ls_game_id_fkey" FOREIGN KEY ("ls_game_id") REFERENCES "LSGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LSGame" ADD CONSTRAINT "LSGame_ls_campaign_id_fkey" FOREIGN KEY ("ls_campaign_id") REFERENCES "LSCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LSCampaignToRole" ADD CONSTRAINT "_LSCampaignToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "LSCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LSCampaignToRole" ADD CONSTRAINT "_LSCampaignToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Games" ADD CONSTRAINT "_Games_A_fkey" FOREIGN KEY ("A") REFERENCES "LSGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Games" ADD CONSTRAINT "_Games_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Deaths" ADD CONSTRAINT "_Deaths_A_fkey" FOREIGN KEY ("A") REFERENCES "LSGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Deaths" ADD CONSTRAINT "_Deaths_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Retire" ADD CONSTRAINT "_Retire_A_fkey" FOREIGN KEY ("A") REFERENCES "LSGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Retire" ADD CONSTRAINT "_Retire_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
