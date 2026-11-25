-- The debug tools now cover more than the stats (the games check, the stat
-- cards), so the flag is named after where they are: the profile pages.
UPDATE "FeatureFlag"
SET
  "name" = 'profile-pages-debug',
  "description" = 'Debug buttons on the profile pages (Games, Stats, stat cards): which games feed each card and stat, and the games check'
WHERE "name" = 'stats-debug';
