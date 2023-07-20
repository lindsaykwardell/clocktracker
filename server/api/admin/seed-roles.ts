import type { User } from "@supabase/supabase-js";
import { PrismaClient, RoleType, Alignment } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  // Ensure user is admin
  const prisma = new PrismaClient();

  const settings = await prisma.userSettings.findUnique({
    where: {
      user_id: user.id,
    },
  });

  if (!settings?.is_admin) {
    throw createError({
      status: 403,
      statusMessage: "Forbidden",
    });
  }

  await prisma.role.deleteMany({});
  const saved = await prisma.role.createMany({
    data: [
      ...townsfolk.map((role) =>
        toRole(role, RoleType.TOWNSFOLK, Alignment.GOOD)
      ),
      ...outsiders.map((role) =>
        toRole(role, RoleType.OUTSIDER, Alignment.GOOD)
      ),
      ...minions.map((role) => toRole(role, RoleType.MINION, Alignment.EVIL)),
      ...demons.map((role) => toRole(role, RoleType.DEMON, Alignment.EVIL)),
      ...travelers.map((role) =>
        toRole(role, RoleType.TRAVELER, Alignment.GOOD)
      ),
      ...fabled.map((role) => toRole(role, RoleType.FABLED, Alignment.NEUTRAL)),
    ],
  });

  return saved;
});

function toRole(name: string, type: RoleType, alignment: Alignment) {
  return {
    id: name.toLowerCase().replace(/ /g, "_").replace(/'/g, ""),
    name,
    type,
    initial_alignment: alignment,
    token_url: `/img/role/${name
      .toLowerCase()
      .replace(/ /g, "")
      .replace(/'/g, "")
      .replace(/-/g, "")}.png`,
  };
}

const townsfolk = [
  "Alchemist",
  "Amnesiac",
  "Artist",
  "Atheist",
  "Balloonist",
  "Bounty Hunter",
  "Cannibal",
  "Chambermaid",
  "Chef",
  "Choirboy",
  "Clockmaker",
  "Courtier",
  "Cult Leader",
  "Dreamer",
  "Empath",
  "Engineer",
  "Exorcist",
  "Farmer",
  "Fisherman",
  "Flowergirl",
  "Fool",
  "Fortune Teller",
  "Gambler",
  "General",
  "Gossip",
  "Grandmother",
  "High Priestess",
  "Huntsman",
  "Innkeeper",
  "Investigator",
  "Juggler",
  "King",
  "Knight",
  "Librarian",
  "Lycanthrope",
  "Magician",
  "Mathematician",
  "Mayor",
  "Minstrel",
  "Monk",
  "Nightwatchman",
  "Noble",
  "Oracle",
  "Pacifist",
  "Philosopher",
  "Pixie",
  "Poppy Grower",
  "Preacher",
  "Professor",
  "Ravenkeeper",
  "Sage",
  "Sailor",
  "Savant",
  "Seamstress",
  "Slayer",
  "Snake Charmer",
  "Soldier",
  "Steward",
  "Tea Lady",
  "Town Crier",
  "Undertaker",
  "Virgin",
  "Washerwoman",
];

const outsiders = [
  "Acrobat",
  "Barber",
  "Butler",
  "Damsel",
  "Drunk",
  "Golem",
  "Goon",
  "Heretic",
  "Klutz",
  "Lunatic",
  "Moonchild",
  "Mutant",
  "Politician",
  "Puzzlemaster",
  "Recluse",
  "Saint",
  "Snitch",
  "Sweetheart",
  "Tinker",
];

const minions = [
  "Assassin",
  "Baron",
  "Boomdandy",
  "Cerenovus",
  "Devil's Advocate",
  "Evil Twin",
  "Fearmonger",
  "Goblin",
  "Godfather",
  "Marionette",
  "Mastermind",
  "Mezepheles",
  "Organ Grinder",
  "Pit-Hag",
  "Poisoner",
  "Psychopath",
  "Scarlet Woman",
  "Spy",
  "Vizier",
  "Widow",
  "Witch",
  "Harpy",
];

const demons = [
  "Al-Hadikhia",
  "Fang Gu",
  "Imp",
  "Legion",
  "Leviathan",
  "Lil' Monsta",
  "Lleech",
  "No Dashii",
  "Po",
  "Pukka",
  "Riot",
  "Shabaloth",
  "Vigormortis",
  "Vortox",
  "Zombuul",
];

const travelers = [
  "Scapegoat",
  "Gunslinger",
  "Beggar",
  "Bureaucrat",
  "Thief",
  "Butcher",
  "Bone Collector",
  "Harlot",
  "Barista",
  "Deviant",
  "Apprentice",
  "Matron",
  "Voudon",
  "Judge",
  "Bishop",
  "Gangster",
];

const fabled = [
  "Doomsayer",
  "Angel",
  "Buddhist",
  "Hell's Librarian",
  "Revolutionary",
  "Fiddler",
  "Toymaker",
  "Fibbin",
  "Duchess",
  "Sentinel",
  "Spirit of Ivory",
  "Djinn",
  "Storm Catcher",
  "Bootlegger",
  "Gardener",
];
