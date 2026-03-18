import webPush from "web-push";
import { prisma } from "~/server/utils/prisma";

interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface SendPushOptions {
  userIds: string[];
  excludeUserId?: string;
  title: string;
  body: string;
  url: string;
}

/**
 * Send push notifications to a set of users.
 * Fire-and-forget — never throws.
 */
export async function sendPushNotifications({
  userIds,
  excludeUserId,
  title,
  body,
  url,
}: SendPushOptions) {
  try {
    const config = useRuntimeConfig();
    const vapidPublicKey = config.public.vapidPublicKey as string;

    if (!vapidPublicKey || !config.vapidPrivateKey || !config.vapidSubject) {
      return;
    }

    webPush.setVapidDetails(
      config.vapidSubject,
      vapidPublicKey,
      config.vapidPrivateKey
    );

    const filteredIds = userIds.filter((id) => id !== excludeUserId);
    if (filteredIds.length === 0) return;

    const pushSubs = await prisma.pushSubscription.findMany({
      where: {
        user_id: { in: filteredIds },
        user: { push_notifications_enabled: true },
      },
    });

    if (pushSubs.length > 0) {
      const payload = JSON.stringify({ title, body, url });

      const results = await Promise.allSettled(
        pushSubs.map((sub) =>
          webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
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
        console.warn(
          `[push] ${failed.length} notification(s) failed:`,
          failed.map((r) => (r as PromiseRejectedResult).reason?.message || r)
        );
      }
    }
  } catch (err) {
    console.error("[push] Unexpected error:", err);
  }

  // Also send via FCM for native app users
  sendFcmNotifications({ userIds, excludeUserId, title, body, url });
}
