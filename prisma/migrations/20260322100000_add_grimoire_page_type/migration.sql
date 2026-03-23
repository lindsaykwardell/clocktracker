CREATE TYPE "GrimoirePageType" AS ENUM ('NONE', 'NIGHT', 'DAY');

ALTER TABLE "Grimoire"
ADD COLUMN "page_type" "GrimoirePageType" NOT NULL DEFAULT 'NONE';
