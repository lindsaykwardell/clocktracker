-- This is an empty migration.
UPDATE "FeatureFlag" SET active = false where name = 'maintenance';