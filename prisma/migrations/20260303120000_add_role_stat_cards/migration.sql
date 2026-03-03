-- CreateTable
CREATE TABLE "RoleStatCard" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "metric_key" TEXT NOT NULL,
    "storyteller_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleStatCard_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoleStatCard" ADD CONSTRAINT "RoleStatCard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleStatCard" ADD CONSTRAINT "RoleStatCard_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
