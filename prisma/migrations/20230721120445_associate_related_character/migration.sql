-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "related_role_id" TEXT;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_related_role_id_fkey" FOREIGN KEY ("related_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "Character" SET "related_role_id" = (SELECT "id" FROM "Role" WHERE "name" = "Character"."related");