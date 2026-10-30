import { hiddenForumAuthors } from "./forumSafety";
import { prisma } from "~/server/utils/prisma";
import { filterForumRecipients } from "./forum";
import { getFeatureFlags } from "./featureFlags";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

interface SendForumNotificationsOptions {
  threadId: string;
  posterId: string;
  posterDisplayName: string;
  postBody: string;
}

export async function sendForumNotifications({
  threadId,
  posterId,
  posterDisplayName,
  postBody,
}: SendForumNotificationsOptions) {
  try {
    const thread = await prisma.forumThread.findFirst({
      where: { id: threadId, deleted_at: null, published: true },
      select: {
        title: true,
        author_id: true,
        category: { select: { id: true, slug: true, is_private: true } },
      },
    });

    if (!thread) return;

    const subscriptions = await prisma.forumThreadSubscription.findMany({
      where: {
        thread_id: threadId,
        user_id: { not: posterId },
      },
      select: { user_id: true },
    });

    const userIds = await notificationRecipients(subscriptions.map(s => s.user_id), thread.category, posterId);
    if (userIds.length === 0) return;

    // Strip markdown and truncate for the notification snippet
    const snippet = postBody
      .replace(/[#*_~`>\[\]()!|\\-]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 200);

    await sendPushNotifications({
      userIds,
      title: `${posterDisplayName} replied in: ${thread.title}`,
      body: snippet,
      url: `/forum/${thread.category.slug}/${threadId}`,
    });
  } catch (err) {
    console.error("[push] Forum notification error:", err);
  }
}

/**
 * Send push notifications to category subscribers
 * when a new thread is created in a subscribed category.
 */
export async function sendCategoryNewThreadNotifications({
  threadId,
  postBody,
  authorDisplayName,
  subscriberUserIds,
}: {
  threadId: string;
  postBody: string;
  authorDisplayName: string;
  subscriberUserIds: string[];
}) {
  try {
    const thread = await prisma.forumThread.findFirst({
      where: { id: threadId, deleted_at: null, published: true },
      include: { category: true },
    });
    if (!thread) return;
    const userIds = await notificationRecipients(subscriberUserIds, thread.category, thread.author_id);
    if (userIds.length === 0) return;

    const snippet = postBody
      .replace(/[#*_~`>\[\]()!|\\-]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 200);

    await sendPushNotifications({
      userIds,
      title: `New thread in ${thread.category.name}: ${thread.title}`,
      body: `${authorDisplayName}: ${snippet}`,
      url: `/forum/${thread.category.slug}/${threadId}`,
    });
  } catch (err) {
    console.error("[push] Category subscription notification error:", err);
  }
}

/**
 * Send push notifications to all users with push enabled
 * when a new announcement thread is created.
 */
export async function sendAnnouncementNotifications({
  threadId,
  postBody,
}: {
  threadId: string;
  postBody: string;
}) {
  try {
    const thread = await prisma.forumThread.findFirst({
      where: { id: threadId, deleted_at: null, published: true },
      include: { category: true },
    });
    if (!thread || !thread.category.is_announcement) return;
    // Get all users who have push notifications enabled
    const users = await prisma.userSettings.findMany({
      where: { push_notifications_enabled: true },
      select: { user_id: true },
    });

    const userIds = await notificationRecipients(users.map(u => u.user_id), thread.category, thread.author_id);
    if (userIds.length === 0) return;

    const snippet = postBody
      .replace(/[#*_~`>\[\]()!|\\-]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 200);

    await sendPushNotifications({
      userIds,
      title: `Announcement: ${thread.title}`,
      body: snippet,
      url: `/forum/${thread.category.slug}/${threadId}`,
    });
  } catch (err) {
    console.error("[push] Announcement notification error:", err);
  }
}

async function notificationRecipients(userIds: string[], category: { id: string; is_private: boolean }, authorId: string) {
  const visible = await filterForumRecipients(userIds, category);
  const enabled = await Promise.all(visible.map(async id => (await getFeatureFlags({ id })).forum && !(await hiddenForumAuthors(id)).includes(authorId)));
  return visible.filter((_, index) => enabled[index]);
}
