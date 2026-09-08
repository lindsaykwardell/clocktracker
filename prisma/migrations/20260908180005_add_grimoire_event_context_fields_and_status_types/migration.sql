-- AlterEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'GrimoireEventType' AND e.enumlabel = 'MAD'
  ) THEN
    ALTER TYPE "GrimoireEventType" ADD VALUE 'MAD';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'GrimoireEventType' AND e.enumlabel = 'DRUNK'
  ) THEN
    ALTER TYPE "GrimoireEventType" ADD VALUE 'DRUNK';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'GrimoireEventType' AND e.enumlabel = 'POISONED'
  ) THEN
    ALTER TYPE "GrimoireEventType" ADD VALUE 'POISONED';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "GrimoireEvent"
ADD COLUMN "old_role_id" TEXT,
ADD COLUMN "new_role_id" TEXT,
ADD COLUMN "old_alignment" "Alignment",
ADD COLUMN "new_alignment" "Alignment";
