-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "discord_server_id" TEXT;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';
