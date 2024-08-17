-- AlterTable
ALTER TABLE "FeatureFlag" ADD COLUMN     "effective_date" TIMESTAMP(3);

INSERT INTO "FeatureFlag" ("name", "description", "active", "effective_date") 
VALUES 
  ('maintenance', 'Is the site in maintenance mode', true, '2024-08-20T13:00:00.000Z');
