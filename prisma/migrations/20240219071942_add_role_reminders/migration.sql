-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateTable
CREATE TABLE "RoleReminders" (
    "id" SERIAL NOT NULL,
    "reminder" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "RoleReminders_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoleReminders" ADD CONSTRAINT "RoleReminders_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
