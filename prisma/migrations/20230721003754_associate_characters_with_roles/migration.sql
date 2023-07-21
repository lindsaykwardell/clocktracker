-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "role_id" TEXT;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- In SQL, insert role_id based on the value of "name" column
UPDATE "Character" SET "role_id" = (SELECT "id" FROM "Role" WHERE "name" = "Character"."name");


