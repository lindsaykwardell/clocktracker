-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateTable
CREATE TABLE "DemonBluff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "related" TEXT,
    "game_id" TEXT,
    "role_id" TEXT,

    CONSTRAINT "DemonBluff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fabled" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "related" TEXT,
    "game_id" TEXT,
    "role_id" TEXT,

    CONSTRAINT "Fabled_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DemonBluff" ADD CONSTRAINT "DemonBluff_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemonBluff" ADD CONSTRAINT "DemonBluff_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fabled" ADD CONSTRAINT "Fabled_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fabled" ADD CONSTRAINT "Fabled_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
