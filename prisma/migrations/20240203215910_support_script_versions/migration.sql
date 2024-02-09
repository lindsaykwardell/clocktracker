/*
  Warnings:

  - A unique constraint covering the columns `[script_id,version]` on the table `Script` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `script_id` to the `Script` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
CREATE SEQUENCE script_id_seq;
ALTER TABLE "Script" ADD COLUMN     "script_id" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('script_id_seq');
ALTER SEQUENCE script_id_seq OWNED BY "Script"."id";

-- Set the script_id for existing scripts to the id
UPDATE "Script" SET "script_id" = "id";

-- AlterTable
ALTER TABLE "Script" ALTER COLUMN "script_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Script_script_id_version_key" ON "Script"("script_id", "version");
