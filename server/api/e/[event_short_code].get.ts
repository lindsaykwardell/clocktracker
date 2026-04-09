import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const event_short_code = handler.context.params!.event_short_code;

  const event = await prisma.event.findUnique({
    where: {
      short_link: event_short_code,
    },
    select: {
      id: true,
    },
  });

  if (!event) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return expandLink(event);
});

function expandLink(event: {
  id: string;
}): string {
  return `/event/${event.id}/`;
}
