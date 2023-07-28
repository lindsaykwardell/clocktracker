-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_role_id_fkey";

-- AlterTable
ALTER TABLE "Token" ALTER COLUMN "role_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
