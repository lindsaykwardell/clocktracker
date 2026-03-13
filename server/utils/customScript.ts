import { Alignment, RoleType } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { nanoid } from "nanoid";
import { prisma } from "./prisma";

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
          | "traveller"
          | "fabled"
          | "loric";
        ability?: string;
      }
    | string
  )[]
];

export async function saveCustomScript(
  body: UploadedScript,
  user: User,
  options?: {
    version: number;
  }
) {
  const [script, ...roles] = body;

  if (!script.name) {
    throw createError({
      status: 400,
      statusMessage: "Script name is required.",
    });
  }

  const existingScripts = await prisma.script.findMany({
    where: {
      name: script.name,
      user_id: user.id,
    },
    include: {
      roles: {
        select: {
          id: true,
        },
      },
    },
  });

  const lastScript = existingScripts.at(-1);
  const scriptId = lastScript?.script_id ?? nanoid(8);

  const version = options?.version
    ? options.version
    : lastScript
    ? +lastScript.version + 1
    : 1;

  const roleMap = await getRoleMap();

  for (const roleId in roles) {
    const role = roles[roleId];

    if (!role) continue;

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
        case "traveller":
          return Alignment.NEUTRAL;
        case "fabled":
          return Alignment.NEUTRAL;
        case "loric":
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
        case "traveller":
          return RoleType.TRAVELER;
        case "fabled":
          return RoleType.FABLED;
        case "loric":
          return RoleType.LORIC;
        default:
          return RoleType.TOWNSFOLK;
      }
    })();

    const token_url = (() => {
      if (role.image && role.image.length > 0) {
        if (typeof role.image === "string") {
          return role.image;
        } else if (Array.isArray(role.image)) {
          return role.image[0]!;
        }
      }
      if (initial_alignment === Alignment.GOOD) {
        return "/img/role/good.webp";
      } else if (initial_alignment === Alignment.EVIL) {
        return "/img/role/evil.webp";
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

  return prisma.script.upsert({
    where: {
      script_id_version: {
        script_id: scriptId,
        version: version.toString(),
      },
    },
    create: {
      name: script.name,
      version: version.toString(),
      author: script.author || "",
      type: "",
      json_url: "",
      pdf_url: "",
      user_id: user.id,
      is_custom_script: true,
      script_id: scriptId,
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
    // This should only happen for FnB games.
    update: {
      name: script.name,
      author: script.author || "",
      type: "",
      json_url: "",
      pdf_url: "",
      user_id: user.id,
      is_custom_script: true,
      json: JSON.stringify(body),
      logo: script.logo ?? null,
      website: script.almanac ?? null,
      background: script.background,
      roles: {
        disconnect: existingScripts
          .find((s) => s.script_id === script.id)
          ?.roles.map((role) => ({
            id: role.id,
          })),
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
