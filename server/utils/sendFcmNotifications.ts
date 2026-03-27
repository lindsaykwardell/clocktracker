import { SignJWT, importPKCS8 } from "jose";
import { prisma } from "~/server/utils/prisma";

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(
  clientEmail: string,
  privateKey: string
): Promise<string> {
  // Reuse token if it's still valid (with 60s buffer)
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60_000) {
    return cachedAccessToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(privateKey, "RS256");

  const jwt = await new SignJWT({
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .sign(key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

interface FcmSendOptions {
  userIds: string[];
  excludeUserId?: string;
  title: string;
  body: string;
  url: string;
}

/**
 * Send FCM push notifications to native app users.
 * Fire-and-forget — never throws.
 */
export async function sendFcmNotifications({
  userIds,
  excludeUserId,
  title,
  body,
  url,
}: FcmSendOptions) {
  try {
    const config = useRuntimeConfig();
    const { fcmProjectId, fcmClientEmail, fcmPrivateKey } = config;

    console.log(`[fcm] called with ${userIds.length} userIds, excludeUserId=${excludeUserId ?? "none"}`);
    console.log(`[fcm] config: projectId=${fcmProjectId ? "set" : "MISSING"}, clientEmail=${fcmClientEmail ? "set" : "MISSING"}, privateKey=${fcmPrivateKey ? "set" : "MISSING"}`);

    if (!fcmProjectId || !fcmClientEmail || !fcmPrivateKey) {
      console.warn("[fcm] Missing FCM config — skipping");
      return;
    }

    const filteredIds = userIds.filter((id) => id !== excludeUserId);
    if (filteredIds.length === 0) {
      console.log("[fcm] No user IDs after filtering — skipping");
      return;
    }

    const tokens = await prisma.fcmToken.findMany({
      where: {
        user_id: { in: filteredIds },
        user: { push_notifications_enabled: true },
      },
    });

    console.log(`[fcm] Found ${tokens.length} FCM token(s) for ${filteredIds.length} user(s)`);

    if (tokens.length === 0) return;

    const accessToken = await getAccessToken(
      fcmClientEmail,
      fcmPrivateKey.replace(/\\n/g, "\n")
    );

    console.log("[fcm] Got access token, sending notifications...");

    const results = await Promise.allSettled(
      tokens.map(async (fcmToken) => {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token: fcmToken.token,
                notification: { title, body },
                data: { url },
                android: {
                  notification: {
                    click_action: url,
                    icon: "push",
                    color: "#292524",
                  },
                },
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorCode = (errorData as any)?.error?.details?.[0]?.errorCode;

          // Token is no longer valid — clean it up
          if (
            response.status === 404 ||
            response.status === 410 ||
            errorCode === "UNREGISTERED"
          ) {
            await prisma.fcmToken.delete({
              where: {
                user_id_token: {
                  user_id: fcmToken.user_id,
                  token: fcmToken.token,
                },
              },
            });
          }

          throw new Error(
            `FCM send failed (${response.status}): ${JSON.stringify(errorData)}`
          );
        }
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");
    console.log(`[fcm] Results: ${succeeded} succeeded, ${failed.length} failed`);
    if (failed.length > 0) {
      console.warn(
        `[fcm] Failed details:`,
        failed.map((r) => (r as PromiseRejectedResult).reason?.message || r)
      );
    }
  } catch (err) {
    console.error("[fcm] Unexpected error:", err);
  }
}
