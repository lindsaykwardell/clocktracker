require("dotenv/config");
const { PrismaClient } = require("../server/generated/prisma/client.ts");
const { PrismaPg } = require("@prisma/adapter-pg");
const { roles, reminders } = require("./roles");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  console.log(
    "[import-roles] DATABASE_URL not set, using fallback",
    process.env.DATABASE_URL
  );
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Upsert all the roles
  console.log("Upserting roles...");
  for (const role of roles) {
    console.log(`Upserting role: ${role.name}`);
    await prisma.role.upsert({
      where: {
        id: role.id,
      },
      update: role,
      create: role,
    });
  }

  // Upsert the reminders
  console.log("Upserting reminders...");
  for (const reminder of reminders) {
    console.log(`Upserting reminder`, reminder);
    await prisma.roleReminder.upsert({
      where: {
        role_id_reminder: {
          role_id: reminder.role_id,
          reminder: reminder.reminder,
        },
      },
      update: reminder,
      create: reminder,
    });
  }

  // Delete all the cron locks
  console.log("Deleting all cron locks...");
  await prisma.cronLock.deleteMany();

  console.log("Done!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
