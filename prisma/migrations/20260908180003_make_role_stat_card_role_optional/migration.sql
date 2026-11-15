ALTER TABLE "RoleStatCard" ALTER COLUMN "role_id" DROP NOT NULL;

ALTER TABLE "RoleStatCard" DROP CONSTRAINT "RoleStatCard_role_id_fkey";

ALTER TABLE "RoleStatCard"
ADD CONSTRAINT "RoleStatCard_role_id_fkey"
FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
