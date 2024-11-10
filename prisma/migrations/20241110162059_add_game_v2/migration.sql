/*
  Warnings:

  - A unique constraint covering the columns `[game_v2_id]` on the table `FavoriteGame` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "FavoriteGame" DROP CONSTRAINT "FavoriteGame_game_id_fkey";

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "game_v2_id" INTEGER;

-- AlterTable
ALTER TABLE "DemonBluff" ADD COLUMN     "game_details_id" TEXT;

-- AlterTable
ALTER TABLE "Fabled" ADD COLUMN     "game_details_id" TEXT;

-- AlterTable
ALTER TABLE "FavoriteGame" ADD COLUMN     "game_v2_id" INTEGER,
ALTER COLUMN "game_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ReminderToken" ADD COLUMN     "token_v2_id" INTEGER;

-- CreateTable
CREATE TABLE "GameV2" (
    "id" SERIAL NOT NULL,
    "bgg_id" INTEGER,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "favorite_id" INTEGER,
    "ignore_for_stats" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "waiting_for_confirmation" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameDetails" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privacy" "PrivacySetting" NOT NULL DEFAULT 'PUBLIC',
    "tags" TEXT[],
    "script" TEXT NOT NULL,
    "script_id" INTEGER,
    "location_type" "LocationType" NOT NULL DEFAULT 'ONLINE',
    "location" TEXT NOT NULL,
    "community_id" INTEGER,
    "player_count" INTEGER,
    "traveler_count" INTEGER,
    "win_v2" "WinStatus_V2" NOT NULL DEFAULT 'NOT_RECORDED',
    "image_urls" TEXT[],

    CONSTRAINT "GameDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrimoireV2" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrimoireV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenV2" (
    "id" SERIAL NOT NULL,
    "role_id" TEXT,
    "related_role_id" TEXT,
    "alignment" "Alignment" NOT NULL,
    "is_dead" BOOLEAN NOT NULL DEFAULT false,
    "used_ghost_vote" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grimoire_id" INTEGER NOT NULL,
    "player_name" TEXT NOT NULL DEFAULT '',
    "player_id" TEXT,

    CONSTRAINT "TokenV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Storyteller" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_GameDetailsToGrimoireV2" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GameV2_bgg_id_key" ON "GameV2"("bgg_id");

-- CreateIndex
CREATE UNIQUE INDEX "GameV2_favorite_id_key" ON "GameV2"("favorite_id");

-- CreateIndex
CREATE UNIQUE INDEX "_Storyteller_AB_unique" ON "_Storyteller"("A", "B");

-- CreateIndex
CREATE INDEX "_Storyteller_B_index" ON "_Storyteller"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GameDetailsToGrimoireV2_AB_unique" ON "_GameDetailsToGrimoireV2"("A", "B");

-- CreateIndex
CREATE INDEX "_GameDetailsToGrimoireV2_B_index" ON "_GameDetailsToGrimoireV2"("B");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteGame_game_v2_id_key" ON "FavoriteGame"("game_v2_id");

-- AddForeignKey
ALTER TABLE "FavoriteGame" ADD CONSTRAINT "FavoriteGame_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteGame" ADD CONSTRAINT "FavoriteGame_game_v2_id_fkey" FOREIGN KEY ("game_v2_id") REFERENCES "GameV2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameV2" ADD CONSTRAINT "GameV2_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameV2" ADD CONSTRAINT "GameV2_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "GameDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameDetails" ADD CONSTRAINT "GameDetails_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameDetails" ADD CONSTRAINT "GameDetails_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenV2" ADD CONSTRAINT "TokenV2_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenV2" ADD CONSTRAINT "TokenV2_related_role_id_fkey" FOREIGN KEY ("related_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenV2" ADD CONSTRAINT "TokenV2_grimoire_id_fkey" FOREIGN KEY ("grimoire_id") REFERENCES "GrimoireV2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenV2" ADD CONSTRAINT "TokenV2_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "UserSettings"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderToken" ADD CONSTRAINT "ReminderToken_token_v2_id_fkey" FOREIGN KEY ("token_v2_id") REFERENCES "TokenV2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_game_v2_id_fkey" FOREIGN KEY ("game_v2_id") REFERENCES "GameV2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemonBluff" ADD CONSTRAINT "DemonBluff_game_details_id_fkey" FOREIGN KEY ("game_details_id") REFERENCES "GameDetails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fabled" ADD CONSTRAINT "Fabled_game_details_id_fkey" FOREIGN KEY ("game_details_id") REFERENCES "GameDetails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Storyteller" ADD CONSTRAINT "_Storyteller_A_fkey" FOREIGN KEY ("A") REFERENCES "GameDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Storyteller" ADD CONSTRAINT "_Storyteller_B_fkey" FOREIGN KEY ("B") REFERENCES "UserSettings"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameDetailsToGrimoireV2" ADD CONSTRAINT "_GameDetailsToGrimoireV2_A_fkey" FOREIGN KEY ("A") REFERENCES "GameDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameDetailsToGrimoireV2" ADD CONSTRAINT "_GameDetailsToGrimoireV2_B_fkey" FOREIGN KEY ("B") REFERENCES "GrimoireV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
