/*
  Warnings:

  - A unique constraint covering the columns `[grimoire_id]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "grimoire_id" INTEGER;

-- CreateTable
CREATE TABLE "Grimoire" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grimoire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "role_id" TEXT NOT NULL,
    "related_role_id" TEXT,
    "alignment" "Alignment" NOT NULL,
    "is_dead" BOOLEAN NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grimoire_id" INTEGER,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_grimoire_id_key" ON "Game"("grimoire_id");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_grimoire_id_fkey" FOREIGN KEY ("grimoire_id") REFERENCES "Grimoire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_related_role_id_fkey" FOREIGN KEY ("related_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_grimoire_id_fkey" FOREIGN KEY ("grimoire_id") REFERENCES "Grimoire"("id") ON DELETE SET NULL ON UPDATE CASCADE;
