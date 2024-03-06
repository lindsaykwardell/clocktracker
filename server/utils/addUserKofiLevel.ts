import { PrismaClient, UserSettings } from "@prisma/client";

const prisma = new PrismaClient();

export async function addUserKofiLevel<T>(
  user: T & { user_id: string }
): Promise<T & { kofi_level: "NONE" | "SUBSCRIBER" | "ONE_TIME" }> {
  const latest_payment = await prisma.koFiPayment.findFirst({
    select: {
      is_subscription_payment: true,
    },
    where: {
      user_id: user.user_id,
      expires_at: {
        gte: new Date(),
      },
    },
    orderBy: {
      expires_at: "desc",
    },
  });

  if (!latest_payment) {
    return { ...user, kofi_level: "NONE" };
  } else if (latest_payment.is_subscription_payment) {
    return { ...user, kofi_level: "SUBSCRIBER" };
  } else {
    return { ...user, kofi_level: "ONE_TIME" };
  }
}
