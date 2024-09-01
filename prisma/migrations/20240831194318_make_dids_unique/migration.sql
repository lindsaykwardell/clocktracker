/*
  Warnings:

  - A unique constraint covering the columns `[user_id,did]` on the table `Did` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Did_user_id_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "Did_user_id_did_key" ON "Did"("user_id", "did");
