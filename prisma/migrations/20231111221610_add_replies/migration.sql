-- AlterTable
ALTER TABLE "CommunityPost" ADD COLUMN     "reply_to_id" TEXT;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "CommunityPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
