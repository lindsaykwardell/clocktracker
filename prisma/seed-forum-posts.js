const { PrismaClient } = require("../server/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const messages = [
  "Great point! I've been thinking about this too.",
  "Has anyone else encountered this? I'd love to hear other perspectives.",
  "I agree with the original post. This is something that should be addressed.",
  "Interesting discussion. Here are my thoughts on the matter...",
  "Thanks for bringing this up! Very relevant to our community.",
  "I have a slightly different take on this, but I see where you're coming from.",
  "Just wanted to add my two cents here. This has been on my mind lately.",
  "Bumping this thread — I think it deserves more attention.",
  "Can we get an update on this? Would love to know the current status.",
  "This is exactly what I was looking for. Thank you for starting this thread!",
];

async function main() {
  const threads = await prisma.forumThread.findMany({
    where: { deleted_at: null },
    select: { id: true, title: true, category_id: true, author_id: true },
  });

  if (threads.length === 0) {
    console.log("No threads found. Create some threads first.");
    return;
  }

  const users = await prisma.userSettings.findMany({
    select: { user_id: true, display_name: true },
    take: 10,
  });

  if (users.length === 0) {
    console.log("No users found.");
    return;
  }

  let created = 0;

  const threadsToUpdate = threads
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(threads.length, 8));

  for (const thread of threadsToUpdate) {
    const numPosts = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numPosts; i++) {
      const otherUsers = users.filter((u) => u.user_id !== thread.author_id);
      const poster =
        otherUsers.length > 0
          ? otherUsers[Math.floor(Math.random() * otherUsers.length)]
          : users[Math.floor(Math.random() * users.length)];

      const message = messages[Math.floor(Math.random() * messages.length)];

      await prisma.forumPost.create({
        data: {
          thread_id: thread.id,
          author_id: poster.user_id,
          body: message,
        },
      });

      await prisma.forumThread.update({
        where: { id: thread.id },
        data: { last_post_at: new Date() },
      });

      created++;
      console.log(
        `  Added post to "${thread.title}" by ${poster.display_name}`
      );
    }
  }

  console.log(
    `\nCreated ${created} new posts across ${threadsToUpdate.length} threads.`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
