import { PrismaClient, Alignment, RoleType } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export type UploadedScript = [
  {
    id: "_meta";
    name: string;
    author?: string;
    logo?: string;
    almanac?: string;
    background?: string;
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

export async function saveCustomScript(body: UploadedScript, user: User) {
  const [script, ...roles] = body;
  console.log("Saving custom script", script, JSON.stringify(roles, null, 2));

  if (!script.name) {
    throw createError({
      status: 400,
      statusMessage: "Script name is required.",
    });
  }

  const roleMap = await getRoleMap();

  for (const roleId in roles) {
    const role = roles[roleId];

    if (typeof role === "string") {
      const existingRoleId = await mapOfficialIdToClocktrackerId(role);

      if (existingRoleId) {
        roles[roleId] = existingRoleId;
        continue;
      } else {
        throw createError({
          status: 400,
          statusMessage: `The provided role with id ${role} does not exist`,
        });
      }
    }

    const existingRoleId = await mapOfficialIdToClocktrackerId(role.id);

    const existingRole = roleMap.find((role) => role.id === existingRoleId);

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
        } else if (Array.isArray(role.image)) {
          return role.image[0];
        }
      }
      if (initial_alignment === Alignment.GOOD) {
        return "/img/role/good.png";
      } else if (initial_alignment === Alignment.EVIL) {
        return "/img/role/evil.png";
      }

      return "/img/default.png";
    })();
    const alternate_token_urls = (() => {
      if (role.image && role.image.length > 0) {
        if (typeof role.image === "string") {
          return [];
        } else if (Array.isArray(role.image)) {
          return role.image.slice(1);
        }
      }
      return [];
    })();

    role.id = role.id + "-" + nanoid(6);

    await prisma.role.create({
      data: {
        id: role.id,
        name: role.name,
        initial_alignment,
        ability: role.ability ?? "",
        token_url,
        alternate_token_urls,
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

  const existingScripts = await prisma.script.findMany({
    where: {
      name: script.name,
      user_id: user.id,
    },
  });

  const version =
    existingScripts.length > 0
      ? existingScripts[existingScripts.length - 1].version
      : 1;

  return prisma.script.create({
    data: {
      name: script.name,
      version: version.toString(),
      author: script.author || "",
      type: "",
      json_url: "",
      pdf_url: "",
      user_id: user.id,
      is_custom_script: true,
      script_id:
        existingScripts.length > 0
          ? existingScripts[existingScripts.length - 1].script_id
          : nanoid(8),
      json: JSON.stringify(body),
      logo: script.logo ?? null,
      website: script.almanac ?? null,
      background: script.background,
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
}
