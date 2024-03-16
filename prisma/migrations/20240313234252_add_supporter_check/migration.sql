-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "FeatureFlag" ADD COLUMN     "enabled_for_supporters" BOOLEAN NOT NULL DEFAULT false;
