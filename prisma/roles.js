const { Alignment, RoleType } = require("@prisma/client");

function toRole(name, type, alignment) {
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
  "Shugenja",
  "Village Idiot",
  "Banshee",
  "Alsaahir",
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
  "Hatter",
  "Ogre",
  "Zealot",
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
  "Summoner",
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
  "Ojo",
  "Kazali",
  "Yaggababble",
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

const roleNames = [
  ...townsfolk,
  ...outsiders,
  ...minions,
  ...demons,
  ...travelers,
];

const roles = [
  ...townsfolk.map((role) => toRole(role, RoleType.TOWNSFOLK, Alignment.GOOD)),
  ...outsiders.map((role) => toRole(role, RoleType.OUTSIDER, Alignment.GOOD)),
  ...minions.map((role) => toRole(role, RoleType.MINION, Alignment.EVIL)),
  ...demons.map((role) => toRole(role, RoleType.DEMON, Alignment.EVIL)),
  ...travelers.map((role) => toRole(role, RoleType.TRAVELER, Alignment.GOOD)),
  ...fabled.map((role) => toRole(role, RoleType.FABLED, Alignment.NEUTRAL)),
];

const reminders = [
  {
    role_id: "washerwoman",
    reminder: "Townsfolk",
  },
  {
    role_id: "washerwoman",
    reminder: "Wrong",
  },
  {
    role_id: "librarian",
    reminder: "Outsider",
  },
  {
    role_id: "librarian",
    reminder: "Wrong",
  },
  {
    role_id: "investigator",
    reminder: "Minion",
  },
  {
    role_id: "investigator",
    reminder: "Wrong",
  },
  {
    role_id: "fortune_teller",
    reminder: "Red Herring",
  },
  {
    role_id: "undertaker",
    reminder: "Died Today",
  },
  {
    role_id: "monk",
    reminder: "Safe",
  },
  {
    role_id: "virgin",
    reminder: "No Ability",
  },
  {
    role_id: "slayer",
    reminder: "No Ability",
  },
  {
    role_id: "butler",
    reminder: "Master",
  },
  {
    role_id: "poisoner",
    reminder: "Poisoned",
  },
  {
    role_id: "scarlet_woman",
    reminder: "Is The Demon",
  },
  {
    role_id: "imp",
    reminder: "Dead",
  },
  {
    role_id: "bureaucrat",
    reminder: "3 Votes",
  },
  {
    role_id: "thief",
    reminder: "Negative Vote",
  },
  {
    role_id: "grandmother",
    reminder: "Grandchild",
  },
  {
    role_id: "grandmother",
    reminder: "Dead",
  },
  {
    role_id: "sailor",
    reminder: "Drunk",
  },
  {
    role_id: "exorcist",
    reminder: "Chosen",
  },
  {
    role_id: "innkeeper",
    reminder: "Safe",
  },
  {
    role_id: "innkeeper",
    reminder: "Safe",
  },
  {
    role_id: "innkeeper",
    reminder: "Drunk",
  },
  {
    role_id: "gambler",
    reminder: "Dead",
  },
  {
    role_id: "gossip",
    reminder: "Dead",
  },
  {
    role_id: "courtier",
    reminder: "Drunk 3",
  },
  {
    role_id: "courtier",
    reminder: "Drunk 2",
  },
  {
    role_id: "courtier",
    reminder: "Drunk 1",
  },
  {
    role_id: "courtier",
    reminder: "No Ability",
  },
  {
    role_id: "professor",
    reminder: "Alive",
  },
  {
    role_id: "professor",
    reminder: "No Ability",
  },
  {
    role_id: "minstrel",
    reminder: "Everyone Is Drunk",
  },
  {
    role_id: "tea_lady",
    reminder: "Cannot Die",
  },
  {
    role_id: "tea_lady",
    reminder: "Cannot Die",
  },
  {
    role_id: "fool",
    reminder: "No Ability",
  },
  {
    role_id: "tinker",
    reminder: "Dead",
  },
  {
    role_id: "moonchild",
    reminder: "Dead",
  },
  {
    role_id: "goon",
    reminder: "Drunk",
  },
  {
    role_id: "lunatic",
    reminder: "Chosen",
  },
  {
    role_id: "lunatic",
    reminder: "Chosen",
  },
  {
    role_id: "lunatic",
    reminder: "Chosen",
  },
  {
    role_id: "godfather",
    reminder: "Died Today",
  },
  {
    role_id: "godfather",
    reminder: "Dead",
  },
  {
    role_id: "devils_advocate",
    reminder: "Survives Execution",
  },
  {
    role_id: "assassin",
    reminder: "Dead",
  },
  {
    role_id: "assassin",
    reminder: "No Ability",
  },
  {
    role_id: "zombuul",
    reminder: "Died Today",
  },
  {
    role_id: "zombuul",
    reminder: "Dead",
  },
  {
    role_id: "pukka",
    reminder: "Poisoned",
  },
  {
    role_id: "pukka",
    reminder: "Poisoned",
  },
  {
    role_id: "pukka",
    reminder: "Dead",
  },
  {
    role_id: "shabaloth",
    reminder: "Dead",
  },
  {
    role_id: "shabaloth",
    reminder: "Dead",
  },
  {
    role_id: "shabaloth",
    reminder: "Alive",
  },
  {
    role_id: "po",
    reminder: "Dead",
  },
  {
    role_id: "po",
    reminder: "Dead",
  },
  {
    role_id: "po",
    reminder: "Dead",
  },
  {
    role_id: "po",
    reminder: "3 attacks",
  },
  {
    role_id: "apprentice",
    reminder: "Is The Apprentice",
  },
  {
    role_id: "judge",
    reminder: "No Ability",
  },
  {
    role_id: "bishop",
    reminder: "Nominate Good",
  },
  {
    role_id: "bishop",
    reminder: "Nominate Evil",
  },
  {
    role_id: "snake_charmer",
    reminder: "Poisoned",
  },
  {
    role_id: "mathematician",
    reminder: "Abnormal",
  },
  {
    role_id: "mathematician",
    reminder: "Abnormal",
  },
  {
    role_id: "mathematician",
    reminder: "Abnormal",
  },
  {
    role_id: "mathematician",
    reminder: "Abnormal",
  },
  {
    role_id: "mathematician",
    reminder: "Abnormal",
  },
  {
    role_id: "flowergirl",
    reminder: "Demon Voted",
  },
  {
    role_id: "flowergirl",
    reminder: "Demon Not Voted",
  },
  {
    role_id: "town_crier",
    reminder: "Minions Not Nominated",
  },
  {
    role_id: "town_crier",
    reminder: "Minion Nominated",
  },
  {
    role_id: "seamstress",
    reminder: "No Ability",
  },
  {
    role_id: "philosopher",
    reminder: "Drunk",
  },
  {
    role_id: "artist",
    reminder: "No Ability",
  },
  {
    role_id: "juggler",
    reminder: "Correct",
  },
  {
    role_id: "juggler",
    reminder: "Correct",
  },
  {
    role_id: "juggler",
    reminder: "Correct",
  },
  {
    role_id: "juggler",
    reminder: "Correct",
  },
  {
    role_id: "juggler",
    reminder: "Correct",
  },
  {
    role_id: "sweetheart",
    reminder: "Drunk",
  },
  {
    role_id: "barber",
    reminder: "Haircuts Tonight",
  },
  {
    role_id: "evil_twin",
    reminder: "Twin",
  },
  {
    role_id: "witch",
    reminder: "Cursed",
  },
  {
    role_id: "cerenovus",
    reminder: "Mad",
  },
  {
    role_id: "fang_gu",
    reminder: "Dead",
  },
  {
    role_id: "fang_gu",
    reminder: "Once",
  },
  {
    role_id: "vigormortis",
    reminder: "Dead",
  },
  {
    role_id: "vigormortis",
    reminder: "Has Ability",
  },
  {
    role_id: "vigormortis",
    reminder: "Has Ability",
  },
  {
    role_id: "vigormortis",
    reminder: "Has Ability",
  },
  {
    role_id: "vigormortis",
    reminder: "Poisoned",
  },
  {
    role_id: "vigormortis",
    reminder: "Poisoned",
  },
  {
    role_id: "vigormortis",
    reminder: "Poisoned",
  },
  {
    role_id: "no_dashii",
    reminder: "Dead",
  },
  {
    role_id: "no_dashii",
    reminder: "Poisoned",
  },
  {
    role_id: "no_dashii",
    reminder: "Poisoned",
  },
  {
    role_id: "vortox",
    reminder: "Dead",
  },
  {
    role_id: "barista",
    reminder: "Sober and Healthy",
  },
  {
    role_id: "barista",
    reminder: "Acts Twice",
  },
  {
    role_id: "barista",
    reminder: "?",
  },
  {
    role_id: "harlot",
    reminder: "Dead",
  },
  {
    role_id: "harlot",
    reminder: "Dead",
  },
  {
    role_id: "bone_collector",
    reminder: "No Ability",
  },
  {
    role_id: "bone_collector",
    reminder: "Has Ability",
  },
  {
    role_id: "noble",
    reminder: "Know",
  },
  {
    role_id: "noble",
    reminder: "Know",
  },
  {
    role_id: "noble",
    reminder: "Know",
  },
  {
    role_id: "bounty_hunter",
    reminder: "Known",
  },
  {
    role_id: "pixie",
    reminder: "Mad",
  },
  {
    role_id: "pixie",
    reminder: "Has Ability",
  },
  {
    role_id: "preacher",
    reminder: "No Ability",
  },
  {
    role_id: "preacher",
    reminder: "No Ability",
  },
  {
    role_id: "preacher",
    reminder: "No Ability",
  },
  {
    role_id: "balloonist",
    reminder: "Know",
  },
  {
    role_id: "lycanthrope",
    reminder: "Dead",
  },
  {
    role_id: "amnesiac",
    reminder: "?",
  },
  {
    role_id: "amnesiac",
    reminder: "?",
  },
  {
    role_id: "amnesiac",
    reminder: "?",
  },
  {
    role_id: "nightwatchman",
    reminder: "No Ability",
  },
  {
    role_id: "engineer",
    reminder: "No Ability",
  },
  {
    role_id: "fisherman",
    reminder: "No Ability",
  },
  {
    role_id: "huntsman",
    reminder: "No Ability",
  },
  {
    role_id: "poppy_grower",
    reminder: "Evil Wakes",
  },
  {
    role_id: "cannibal",
    reminder: "Poisoned",
  },
  {
    role_id: "cannibal",
    reminder: "Died Today",
  },
  {
    role_id: "acrobat",
    reminder: "Dead",
  },
  {
    role_id: "puzzlemaster",
    reminder: "Drunk",
  },
  {
    role_id: "puzzlemaster",
    reminder: "Guess Used",
  },
  {
    role_id: "damsel",
    reminder: "Guess Used",
  },
  {
    role_id: "golem",
    reminder: "May Not Nominate",
  },
  {
    role_id: "widow",
    reminder: "Poisoned",
  },
  {
    role_id: "fearmonger",
    reminder: "Fear",
  },
  {
    role_id: "goblin",
    reminder: "Claimed",
  },
  {
    role_id: "mezepheles",
    reminder: "Turns Evil",
  },
  {
    role_id: "mezepheles",
    reminder: "No Ability",
  },
  {
    role_id: "lleech",
    reminder: "Dead",
  },
  {
    role_id: "lleech",
    reminder: "Poisoned",
  },
  {
    role_id: "al-hadikhia",
    reminder: "1",
  },
  {
    role_id: "al-hadikhia",
    reminder: "2",
  },
  {
    role_id: "al-hadikhia",
    reminder: "3",
  },
  {
    role_id: "legion",
    reminder: "Dead",
  },
  {
    role_id: "legion",
    reminder: "About To Die",
  },
  {
    role_id: "leviathan",
    reminder: "Day 1",
  },
  {
    role_id: "leviathan",
    reminder: "Day 2",
  },
  {
    role_id: "leviathan",
    reminder: "Day 3",
  },
  {
    role_id: "leviathan",
    reminder: "Day 4",
  },
  {
    role_id: "leviathan",
    reminder: "Day 5",
  },
  {
    role_id: "leviathan",
    reminder: "Good Player Executed",
  },
  {
    role_id: "organ_grinder",
    reminder: "About To Die",
  },
  {
    role_id: "knight",
    reminder: "Know",
  },
  {
    role_id: "knight",
    reminder: "Know",
  },
  {
    role_id: "steward",
    reminder: "Know",
  },
  {
    role_id: "harpy",
    reminder: "Mad",
  },
  {
    role_id: "harpy",
    reminder: "2nd",
  },
  {
    role_id: "plague_doctor",
    reminder: "Duplicate",
  },
  {
    role_id: "ojo",
    reminder: "Dead",
  },
  {
    role_id: "hatter",
    reminder: "Tea Party Tonight",
  },
  {
    role_id: "kazali",
    reminder: "Dead",
  },
  {
    role_id: "village_idiot",
    reminder: "Drunk",
  },
  {
    role_id: "yaggababble",
    reminder: "Dead",
  },
  {
    role_id: "yaggababble",
    reminder: "Dead",
  },
  {
    role_id: "yaggababble",
    reminder: "Dead",
  },
  {
    role_id: "summoner",
    reminder: "Night 1",
  },
  {
    role_id: "summoner",
    reminder: "Night 2",
  },
  {
    role_id: "summoner",
    reminder: "Night 3",
  },
  {
    role_id: "banshee",
    reminder: "Has Ability",
  },
  {
    role_id: "ogre",
    reminder: "Friend",
  },
  {
    role_id: "angel",
    reminder: "Protected",
  },
  {
    role_id: "angel",
    reminder: "Protected",
  },
  {
    role_id: "angel",
    reminder: "Something Bad",
  },
  {
    role_id: "hells_librarian",
    reminder: "Something Bad",
  },
  {
    role_id: "revolutionary",
    reminder: "Register Falsely?",
  },
  {
    role_id: "revolutionary",
    reminder: "Aligned",
  },
  {
    role_id: "revolutionary",
    reminder: "Aligned",
  },
  {
    role_id: "toymaker",
    reminder: "Final Night: No Attack",
  },
  {
    role_id: "fibbin",
    reminder: "No Ability",
  },
  {
    role_id: "duchess",
    reminder: "Visitor",
  },
  {
    role_id: "duchess",
    reminder: "Visitor",
  },
  {
    role_id: "duchess",
    reminder: "False Info",
  },
  {
    role_id: "spirit_of_ivory",
    reminder: "No More Evil",
  },
  {
    role_id: "storm_catcher",
    reminder: "Safe",
  },
];

module.exports = {
  toRole,
  townsfolk,
  outsiders,
  minions,
  demons,
  fabled,
  roleNames,
  roles,
  reminders,
};
