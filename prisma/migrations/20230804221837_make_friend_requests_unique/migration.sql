/*
  Warnings:

  - A unique constraint covering the columns `[user_id,from_user_id]` on the table `FriendRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_user_id_from_user_id_key" ON "FriendRequest"("user_id", "from_user_id");
