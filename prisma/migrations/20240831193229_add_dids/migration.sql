-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "disable_tutorials" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Did" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Did_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Did" ADD CONSTRAINT "Did_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
