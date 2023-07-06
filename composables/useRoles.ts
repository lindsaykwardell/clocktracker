import naturalOrder from "natural-order";

const townsfolk = naturalOrder([
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
]).sort();

const outsiders = naturalOrder([
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
]).sort();

const minions = naturalOrder([
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
]).sort();

const demons = naturalOrder([
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
]).sort();

const travelers = naturalOrder([
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
]).sort();

enum RoleType {
  TOWNSFOLK,
  OUTSIDER,
  MINION,
  DEMON,
  TRAVELER,
}

export const useRoles = () => {
  const roles = naturalOrder([
    ...townsfolk,
    ...outsiders,
    ...minions,
    ...demons,
    ...travelers,
  ]).sort();

  return {
    roles,
    townsfolk,
    isTownsfolk: (role: string) => townsfolk.includes(role),
    outsiders,
    isOutsider: (role: string) => outsiders.includes(role),
    minions,
    isMinion: (role: string) => minions.includes(role),
    demons,
    isDemon: (role: string) => demons.includes(role),
    travelers,
    isTraveler: (role: string) => travelers.includes(role),
    roleType: (role: string) => {
      if (townsfolk.includes(role)) {
        return RoleType.TOWNSFOLK;
      } else if (outsiders.includes(role)) {
        return RoleType.OUTSIDER;
      } else if (minions.includes(role)) {
        return RoleType.MINION;
      } else if (demons.includes(role)) {
        return RoleType.DEMON;
      } else if (travelers.includes(role)) {
        return RoleType.TRAVELER;
      } else {
        return null;
      }
    },
  };
};
