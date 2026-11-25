-- Why a grimoire revision was saved, when it wasn't the user's own save (for
-- example the background fill repairing broken seat numbers). Null for saves.
ALTER TABLE "GrimoireSnapshot"
ADD COLUMN "message" TEXT;
