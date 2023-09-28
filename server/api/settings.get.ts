import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const settings = await prisma.userSettings.findFirst({
    where: {
      user_id: user.id,
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
      finished_welcome: true,
      pronouns: true,
      bio: true,
      location: true,
      privacy: true,
      charts: true,
      bgg_username: true,
      enable_bgstats: true,
    },
  });

  if (settings) return settings;

  const existingUsername = user.user_metadata.full_name
    ? (
        await prisma.userSettings.findFirst({
          where: {
            username: {
              equals: user.user_metadata.full_name,
              mode: "insensitive",
            },
          },
        })
      )?.username
    : null;

  // If the username does not exist, use the full name from the user metadata.
  // Otherwise, generate a random username based on roles.

  const randomRole =
    roles[Math.floor(Math.random() * roles.length)] || "Traveler";
  const adjective = faker.word.adjective();

  const username = existingUsername
    ? user.user_metadata.full_name
    : faker.internet.userName({ firstName: adjective, lastName: randomRole });

  const newSettings = await prisma.userSettings.create({
    data: {
      user_id: user.id,
      username,
      display_name:
        user.user_metadata.full_name ||
        adjective.charAt(0).toUpperCase() +
          adjective.slice(1) +
          " " +
          randomRole,
      avatar: user.user_metadata.avatar_url || "/img/default.png",
      email: user.email,
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
      finished_welcome: true,
      pronouns: true,
      bio: true,
      location: true,
      privacy: true,
      charts: true,
      bgg_username: true,
      enable_bgstats: true,
    },
  });

  return newSettings;
});

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
  "Shugenja",
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
  "Plague Doctor",
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
  "Ferryman",
];

const roles = [...townsfolk, ...outsiders, ...minions, ...demons, ...travelers];
