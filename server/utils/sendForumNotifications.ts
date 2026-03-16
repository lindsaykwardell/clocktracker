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

    const vapidPublicKey = config.public.vapidPublicKey as string;

    if (!vapidPublicKey || !config.vapidPrivateKey || !config.vapidSubject) {
      console.warn("[push] VAPID keys not configured, skipping notifications");
      return;
    }

    webPush.setVapidDetails(
      config.vapidSubject,
      vapidPublicKey,
      config.vapidPrivateKey
    );

    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: {
        title: true,
        category: { select: { slug: true } },
      },
    });

    if (!thread) {
      console.warn("[push] Thread not found:", threadId);
      return;
    }

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

    console.log(`[push] Sending to ${pushSubs.length} device(s) for thread "${thread.title}"`);

    if (pushSubs.length === 0) return;

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
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.warn(`[push] ${failed.length} notification(s) failed:`, failed.map((r) => (r as PromiseRejectedResult).reason?.message || r));
    }
  } catch (err) {
    console.error("[push] Unexpected error:", err);
  }
}
