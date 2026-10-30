import { prisma } from "./prisma";
import { filterForumRecipients } from "./forum";
import { sendAnnouncementNotifications, sendCategoryNewThreadNotifications, sendForumNotifications } from "./sendForumNotifications";

// Called only after content becomes public, never for pending revisions.
export async function notifyForumPublication(threadId: string, postId: string, newThread: boolean) {
  const post = await prisma.forumPost.findFirst({ where: { id: postId, published: true, deleted_at: null }, include: { author: true, thread: { include: { category: true } } } });
  if (!post || !post.thread.published || post.thread.deleted_at) return;
  await prisma.forumThreadSubscription.upsert({
    where: { thread_id_user_id: { thread_id: threadId, user_id: post.author_id } },
    create: { thread_id: threadId, user_id: post.author_id }, update: {},
  });
  if (!newThread) {
    await sendForumNotifications({ threadId, posterId: post.author_id, posterDisplayName: post.author.display_name, postBody: post.body });
    return;
  }
  const subscriptions = await prisma.forumCategorySubscription.findMany({ where: { category_id: post.thread.category_id, user_id: { not: post.author_id } }, select: { user_id: true } });
  const recipients = await filterForumRecipients(subscriptions.map(s => s.user_id), post.thread.category);
  await prisma.forumThreadSubscription.createMany({ data: recipients.map(user_id => ({ thread_id: threadId, user_id, last_read_at: new Date(0) })), skipDuplicates: true });
  if (post.thread.category.is_announcement) {
    await sendAnnouncementNotifications({ threadId, postBody: post.body });
  } else {
    await sendCategoryNewThreadNotifications({ threadId, postBody: post.body, authorDisplayName: post.author.display_name, subscriberUserIds: recipients });
  }
}
