/*
  Warnings:

  - A unique constraint covering the columns `[user_id,id]` on the table `Did` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Did_user_id_id_key" ON "Did"("user_id", "id");
