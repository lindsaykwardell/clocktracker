import { githubApiFetch } from "~/server/utils/github";
import { hasForumPermission } from "~/server/utils/forum";
import { isAdmin } from "~/server/utils/permissions";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const admin = await isAdmin(me.id);
  const hasGithub = await hasForumPermission(me.id, "GITHUB");
  if (!admin && !hasGithub) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const threadId = handler.context.params!.id;
  const body = await readBody<{ labels?: string[] } | null>(handler);

  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    include: {
      category: { select: { name: true, slug: true } },
      author: { select: { display_name: true, username: true } },
    },
  });

  if (!thread) {
    throw createError({ status: 404, statusMessage: "Thread not found" });
  }

  // Get the first post (thread body)
  const firstPost = await prisma.forumPost.findFirst({
    where: { thread_id: threadId, deleted_at: null },
    orderBy: { created_at: "asc" },
  });

  const config = useRuntimeConfig();
  const owner = config.githubRepoOwner;
  const repo = config.githubRepoName;

  if (!owner || !repo) {
    throw createError({
      status: 500,
      statusMessage: "GitHub repo not configured",
    });
  }

  const threadUrl = `https://clocktracker.app/forum/${thread.category.slug}/${thread.id}`;
  const issueBody = [
    `**Forum thread by ${thread.author.display_name} (@${thread.author.username})**`,
    `**Category:** ${thread.category.name}`,
    `**Link:** ${threadUrl}`,
    "",
    "---",
    "",
    firstPost?.body ?? "",
  ].join("\n");

  const issue = await githubApiFetch<{
    number: number;
    html_url: string;
    title: string;
  }>(`/repos/${owner}/${repo}/issues`, {
    method: "POST",
    body: {
      title: thread.title,
      body: issueBody,
      labels: body?.labels ?? [],
    },
  });

  // Store the link on the thread for future reference
  await prisma.forumThread.update({
    where: { id: threadId },
    data: { github_issue_url: issue.html_url },
  });

  return {
    number: issue.number,
    url: issue.html_url,
    title: issue.title,
  };
});
