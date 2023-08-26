-- CreateEnum
CREATE TYPE "ChartType" AS ENUM ('BAR', 'PIE', 'POLAR_AREA');

-- CreateEnum
CREATE TYPE "DataField" AS ENUM ('ROLE', 'ALIGNMENT', 'SCRIPT', 'GAME_SIZE', 'WIN');

-- CreateTable
CREATE TABLE "Chart" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ChartType" NOT NULL,
    "data" "DataField" NOT NULL,
    "pivot" "DataField",
    "include_tags" TEXT[],
    "exclude_tags" TEXT[],
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,

    CONSTRAINT "Chart_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Chart" ADD CONSTRAINT "Chart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
