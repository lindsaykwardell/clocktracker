-- CreateTable
CREATE TABLE "SharedCalendarLink" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "SharedCalendarLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedCalendarLink_user_id_key" ON "SharedCalendarLink"("user_id");

-- AddForeignKey
ALTER TABLE "SharedCalendarLink" ADD CONSTRAINT "SharedCalendarLink_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
