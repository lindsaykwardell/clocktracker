const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { roles, reminders } = require("./roles");

const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString }) : undefined;
const adapter = pool ? new PrismaPg(pool) : undefined;

const prisma = new PrismaClient({
  adapter,
});

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
