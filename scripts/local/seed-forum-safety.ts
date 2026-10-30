import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../../server/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const database = new URL(process.env.DATABASE_URL!);
const authUrl = new URL(process.env.SUPABASE_URL!);
if (!["localhost", "127.0.0.1", "host.docker.internal"].includes(database.hostname) || !["localhost", "127.0.0.1", "clocktracker.localhost"].includes(authUrl.hostname)) {
  throw new Error("Forum test fixtures may only be seeded against local services.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.toString() }) });
const supabase = createClient(authUrl.toString(), process.env.SUPABASE_KEY!);
async function main() {
  await prisma.featureFlag.updateMany({ where: { name: "forum" }, data: { active: true, effective_date: null } });
  const category = await prisma.forumCategory.upsert({ where: { slug: "forum-testing" }, create: { name: "Forum Testing", slug: "forum-testing", description: "Local moderation and privacy checks" }, update: {} });
  for (const [label, established] of [["new", false], ["member", true]] as const) {
    const email = `forum-${label}@example.test`;
    const signIn = await supabase.auth.signInWithPassword({ email, password: "password123" });
    const result = signIn.error ? await supabase.auth.signUp({ email, password: "password123" }) : signIn;
    if (!result.data.user) throw new Error(result.error?.message || "Local user creation failed");
    const user = await prisma.userSettings.upsert({ where: { user_id: result.data.user.id }, create: { user_id: result.data.user.id, email, username: `forum-${label}`, display_name: `Forum ${label}`, finished_welcome: true, created_at: new Date(Date.now() - (established ? 30 : 0) * 86400000) }, update: {} });
    if (established && !await prisma.forumThread.findFirst({ where: { title: "Local established member thread", author_id: user.user_id } })) {
      await prisma.forumThread.create({ data: { title: "Local established member thread", category_id: category.id, author_id: user.user_id, posts: { create: Array.from({ length: 3 }, (_, i) => ({ author_id: user.user_id, body: `Established fixture ${i}: discussing Clocktower strategy.`, created_at: new Date(Date.now() - 2 * 86400000) })) } } });
    }
  }
  console.log("Local forum fixtures ready: forum-new@example.test and forum-member@example.test; password: password123");
}
main().finally(() => prisma.$disconnect());
