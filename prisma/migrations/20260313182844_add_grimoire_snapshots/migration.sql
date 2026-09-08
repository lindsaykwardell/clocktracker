-- CreateTable
CREATE TABLE "GrimoireSnapshot" (
    "id" SERIAL NOT NULL,
    "grimoire_id" INTEGER NOT NULL,
    "game_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrimoireSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GrimoireSnapshot_grimoire_id_idx" ON "GrimoireSnapshot"("grimoire_id");

-- CreateIndex
CREATE INDEX "GrimoireSnapshot_game_id_idx" ON "GrimoireSnapshot"("game_id");

-- AddForeignKey
ALTER TABLE "GrimoireSnapshot" ADD CONSTRAINT "GrimoireSnapshot_grimoire_id_fkey" FOREIGN KEY ("grimoire_id") REFERENCES "Grimoire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrimoireSnapshot" ADD CONSTRAINT "GrimoireSnapshot_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
