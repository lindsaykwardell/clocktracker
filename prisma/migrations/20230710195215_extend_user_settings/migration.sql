-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "bio" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "display_name" TEXT NOT NULL DEFAULT 'Your Name Here',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "pronouns" TEXT;

UPDATE "UserSettings" SET "display_name" = "username";
ALTER TABLE "UserSettings" ALTER COLUMN "display_name" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ExternalLink" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ExternalLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExternalLink" ADD CONSTRAINT "ExternalLink_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
