-- CreateTable
CREATE TABLE "YearInReview" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "YearInReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YearInReview_year_user_id_key" ON "YearInReview"("year", "user_id");

-- AddForeignKey
ALTER TABLE "YearInReview" ADD CONSTRAINT "YearInReview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
