import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

type KoFiPayload = {
  data: {
    verification_token: string;
    message_id: string;
    timestamp: string;
    type: "Donation" | "Subscription" | "Shop Order";
    is_public: boolean;
    from_name: string;
    message: string;
    amount: string;
    url: string;
    email: string;
    currency: string;
    is_subscription_payment: boolean;
    is_first_subscription_payment: boolean;
    kofi_transaction_id: string;
    shop_items: {
      direct_link_code: string;
      variation_name: string;
      quantity: number;
    }[];
    tier_name: string | null;
  };
};

export default defineEventHandler(async (handler) => {
  const body = await readBody<KoFiPayload>(handler);

  if (typeof body.data !== "object") {
    body.data = JSON.parse(body.data);
  }

  if (!body || body.data.verification_token !== process.env.KOFI_TOKEN) {
    console.error("Invalid KoFi Webhook", body?.data);
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  // find the matching user, if any
  const user = await prisma.userSettings.findFirst({
    where: {
      email: body.data.email,
    },
  });

  await prisma.koFiPayment.create({
    data: {
      email: body.data.email,
      is_subscription_payment: body.data.is_subscription_payment,
      timestamp: new Date(body.data.timestamp),
      expires_at: dayjs(body.data.timestamp)
        .add(1, "month")
        .endOf("month")
        .toDate(),
      user_id: user?.user_id,
    },
  });

  return {
    status: 200,
    body: {
      message: "Success",
    },
  };
});
