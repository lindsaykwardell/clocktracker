import { prisma } from "~/server/utils/prisma";
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
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: {
        title: true,
        category: { select: { slug: true } },
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

    if (subscriptions.length === 0) return;

    // Strip markdown and truncate for the notification snippet
    const snippet = postBody
      .replace(/[#*_~`>\[\]()!|\\-]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 200);

    await sendPushNotifications({
      userIds: subscriptions.map((s) => s.user_id),
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
  threadTitle,
  categorySlug,
  categoryName,
  postBody,
  authorDisplayName,
  subscriberUserIds,
}: {
  threadId: string;
  threadTitle: string;
  categorySlug: string;
  categoryName: string;
  postBody: string;
  authorDisplayName: string;
  subscriberUserIds: string[];
}) {
  try {
    if (subscriberUserIds.length === 0) return;

    const snippet = postBody
      .replace(/[#*_~`>\[\]()!|\\-]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 200);

    await sendPushNotifications({
      userIds: subscriberUserIds,
      title: `New thread in ${categoryName}: ${threadTitle}`,
      body: `${authorDisplayName}: ${snippet}`,
      url: `/forum/${categorySlug}/${threadId}`,
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
  threadTitle,
  categorySlug,
  postBody,
}: {
  threadId: string;
  threadTitle: string;
  categorySlug: string;
  postBody: string;
}) {
  try {
    // Get all users who have push notifications enabled
    const users = await prisma.userSettings.findMany({
      where: { push_notifications_enabled: true },
      select: { user_id: true },
    });

    if (users.length === 0) return;

    const snippet = postBody
      .replace(/[#*_~`>\[\]()!|\\-]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 200);

    await sendPushNotifications({
      userIds: users.map((u) => u.user_id),
      title: `Announcement: ${threadTitle}`,
      body: snippet,
      url: `/forum/${categorySlug}/${threadId}`,
    });
  } catch (err) {
    console.error("[push] Announcement notification error:", err);
  }
}
