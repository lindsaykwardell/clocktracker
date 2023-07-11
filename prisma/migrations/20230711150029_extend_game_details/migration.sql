-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "related" TEXT;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "community" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "player_count" DROP NOT NULL;
