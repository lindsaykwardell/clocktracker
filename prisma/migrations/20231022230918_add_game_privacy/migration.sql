-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "privacy" "PrivacySetting" NOT NULL DEFAULT 'PUBLIC';

-- Set game privacy to match the privacy setting found in UserSettings

UPDATE "Game" SET "privacy" = 'PUBLIC' WHERE "id" IN (SELECT game."id" FROM "UserSettings" userSettings INNER JOIN "Game" game ON game."user_id" = userSettings."user_id" WHERE userSettings."privacy" = 'PUBLIC');
UPDATE "Game" SET "privacy" = 'FRIENDS_ONLY' WHERE "id" IN (SELECT game."id" FROM "UserSettings" userSettings INNER JOIN "Game" game ON game."user_id" = userSettings."user_id" WHERE userSettings."privacy" = 'FRIENDS_ONLY');
UPDATE "Game" SET "privacy" = 'PRIVATE' WHERE "id" IN (SELECT game."id" FROM "UserSettings" userSettings INNER JOIN "Game" game ON game."user_id" = userSettings."user_id" WHERE userSettings."privacy" = 'PRIVATE');
