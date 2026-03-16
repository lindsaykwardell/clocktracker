import webPush from "web-push";
import { prisma } from "~/server/utils/prisma";

interface SendForumNotificationsOptions {
  threadId: string;
  posterId: string;
  posterDisplayName: string;
}

export async function sendForumNotifications({
  threadId,
  posterId,
  posterDisplayName,
}: SendForumNotificationsOptions) {
  try {
    const config = useRuntimeConfig();

    if (!config.vapidPublicKey || !config.vapidPrivateKey || !config.vapidSubject) {
      return;
    }

    webPush.setVapidDetails(
      config.vapidSubject,
      config.vapidPublicKey,
      config.vapidPrivateKey
    );

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
        user: { push_notifications_enabled: true },
      },
      select: {
        user: {
          select: {
            push_subscriptions: true,
          },
        },
      },
    });

    const payload = JSON.stringify({
      title: `New post in: ${thread.title}`,
      body: `${posterDisplayName} replied`,
      url: `/forum/${thread.category.slug}/${threadId}`,
    });

    const pushSubs = subscriptions.flatMap((s) => s.user.push_subscriptions);

    const results = await Promise.allSettled(
      pushSubs.map((sub) =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    // Clean up expired subscriptions (410 Gone)
    const expiredEndpoints: string[] = [];
    results.forEach((result, index) => {
      if (
        result.status === "rejected" &&
        "statusCode" in result.reason &&
        result.reason.statusCode === 410
      ) {
        expiredEndpoints.push(pushSubs[index].endpoint);
      }
    });

    if (expiredEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: expiredEndpoints } },
      });
    }
  } catch {
    // Never throw — this is fire-and-forget
  }
}
