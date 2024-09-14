import type { User } from "@supabase/supabase-js";
import { Alignment, PrismaClient, RoleType } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

type UploadedScript = [
  {
    id: "_meta";
    name: string;
    author?: string;
    logo?: string;
    almanac?: string;
  },
  ...(
    | {
        id: string;
        image?: string | string[];
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

  if (!script.name) {
    throw createError({
      status: 400,
      statusMessage: "Script name is required.",
    });
  }

  const baseRoles = await prisma.role.findMany({
    where: {
      custom_role: false,
    },
  });

  const existingRoleIds = baseRoles.map((role) => ({
    id: role.id,
    map_id: role.id,
  }));

  baseRoles.forEach((role) => {
    if (role.id.includes("_")) {
      existingRoleIds.push({
        id: role.id.replaceAll("_", ""),
        map_id: role.id,
      });
    }
  });

  for (const roleId in roles) {
    const role = roles[roleId];

    if (typeof role === "string") {
      const existingRoleId = existingRoleIds.find(
        (existingRole) => existingRole.id === role
      );

      if (existingRoleId) {
        roles[roleId] = existingRoleId.map_id;
        continue;
      } else {
        throw createError({
          status: 400,
          statusMessage: `The provided role with id ${role} does not exist`,
        });
      }
    }

    const existingRoleId = existingRoleIds.find(
      (existingRole) => existingRole.id === role.id
    );

    const existingRole = baseRoles.find(
      (role) => role.id === existingRoleId?.map_id
    );

    if (existingRole) {
      role.id = existingRole.id;
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
      if (role.image && role.image.length > 0) {
        if (typeof role.image === "string") {
          return role.image;
        } else if (role.image.length === 1) {
          return role.image[0];
        } else {
          // Get the correct image for the role type
          switch (role_type) {
            case RoleType.TOWNSFOLK:
            case RoleType.OUTSIDER:
              return role.image[0];
            case RoleType.MINION:
            case RoleType.DEMON:
              return role.image[1];
            default:
              return role.image[0];
          }
        }
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
          create: role.reminders
            ?.filter(
              (reminder, index, arr) =>
                arr.findIndex((r) => r === reminder) === index
            )
            .map((reminder) => ({
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
      script_id: nanoid(8),
      json: JSON.stringify(body),
      logo: script.logo ?? null,
      website: script.almanac ?? null,
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
