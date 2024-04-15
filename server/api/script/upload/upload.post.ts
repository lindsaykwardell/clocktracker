import type { User } from "@supabase/supabase-js";
import { Alignment, PrismaClient, RoleType } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

type UploadedScript = [
  {
    id: "_meta";
    name: string;
    author: string;
    logo?: string;
    almanac?: string;
  },
  ...(
    | {
        id: string;
        image?: string;
        reminders?: string[];
        name: string;
        team?:
          | "townsfolk"
          | "outsider"
          | "minion"
          | "demon"
          | "traveler"
          | "fabled";
        ability?: string;
      }
    | string
  )[]
];

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<UploadedScript>(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const [script, ...roles] = body;

  for (const role of roles) {
    if (typeof role === "string") {
      continue;
    }

    const existingRole = await prisma.role.findFirst({
      where: {
        id: role.id,
      },
    });

    if (existingRole) {
      continue;
    }

    const initial_alignment = (() => {
      switch (role.team) {
        case "townsfolk":
          return Alignment.GOOD;
        case "outsider":
          return Alignment.GOOD;
        case "minion":
          return Alignment.EVIL;
        case "demon":
          return Alignment.EVIL;
        case "traveler":
          return Alignment.NEUTRAL;
        case "fabled":
          return Alignment.NEUTRAL;
        default:
          return Alignment.NEUTRAL;
      }
    })();

    const role_type = (() => {
      switch (role.team) {
        case "townsfolk":
          return RoleType.TOWNSFOLK;
        case "outsider":
          return RoleType.OUTSIDER;
        case "minion":
          return RoleType.MINION;
        case "demon":
          return RoleType.DEMON;
        case "traveler":
          return RoleType.TRAVELER;
        case "fabled":
          return RoleType.FABLED;
        default:
          return RoleType.TOWNSFOLK;
      }
    })();

    const token_url = (() => {
      if (role.image) {
        return role.image;
      }
      if (initial_alignment === Alignment.GOOD) {
        return "/img/role/good.png";
      } else if (initial_alignment === Alignment.EVIL) {
        return "/img/role/evil.png";
      }

      return "/img/default.png";
    })();

    role.id = role.id + "-" + nanoid(6);

    await prisma.role.create({
      data: {
        id: role.id,
        name: role.name,
        initial_alignment,
        token_url,
        type: role_type,
        custom_role: true,
        reminders: {
          create: role.reminders?.map((reminder) => ({
            reminder,
          })),
        },
      },
    });
  }

  const version =
    (await prisma.script.count({
      where: {
        name: script.name,
        user_id: user.id,
      },
    })) + 1;

  return await prisma.script.create({
    data: {
      name: script.name,
      version: version.toString(),
      author: script.author || "",
      type: "",
      json_url: "",
      pdf_url: "",
      user_id: user.id,
      is_custom_script: true,
      script_id: nanoid(6),
      roles: {
        connect: roles.map((role) => ({
          id: typeof role === "string" ? role : role.id,
        })),
      },
    },
    include: {
      roles: true,
    },
  });
});
