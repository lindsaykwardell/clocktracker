const { Alignment, RoleType } = require("@prisma/client");

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
  "Boffin",
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
  "Lord of Typhon",
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

const abilities = [
  {
    role_id: "washerwoman",
    ability: "You start knowing that 1 of 2 players is a particular Townsfolk.",
  },
  {
    role_id: "librarian",
    ability:
      "You start knowing that 1 of 2 players is a particular Outsider. (Or that zero are in play.)",
  },
  {
    role_id: "investigator",
    ability: "You start knowing that 1 of 2 players is a particular Minion.",
  },
  {
    role_id: "chef",
    ability: "You start knowing how many pairs of evil players there are.",
  },
  {
    role_id: "empath",
    ability:
      "Each night, you learn how many of your 2 alive neighbors are evil.",
  },
  {
    role_id: "fortune_teller",
    ability:
      "Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.",
  },
  {
    role_id: "undertaker",
    ability: "Each night*, you learn which character died by execution today.",
  },
  {
    role_id: "monk",
    ability:
      "Each night*, choose a player (not yourself): they are safe from the Demon tonight.",
  },
  {
    role_id: "ravenkeeper",
    ability:
      "If you die at night, you are woken to choose a player: you learn their character.",
  },
  {
    role_id: "virgin",
    ability:
      "The 1st time you are nominated, if the nominator is a Townsfolk, they are executed immediately.",
  },
  {
    role_id: "slayer",
    ability:
      "Once per game, during the day, publicly choose a player: if they are the Demon, they die.",
  },
  {
    role_id: "soldier",
    ability: "You are safe from the Demon.",
  },
  {
    role_id: "mayor",
    ability:
      "If only 3 players live & no execution occurs, your team wins. If you die at night, another player might die instead.",
  },
  {
    role_id: "butler",
    ability:
      "Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.",
  },
  {
    role_id: "drunk",
    ability:
      "You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.",
  },
  {
    role_id: "recluse",
    ability: "You might register as evil & as a Minion or Demon, even if dead.",
  },
  {
    role_id: "saint",
    ability: "If you die by execution, your team loses.",
  },
  {
    role_id: "poisoner",
    ability:
      "Each night, choose a player: they are poisoned tonight and tomorrow day.",
  },
  {
    role_id: "spy",
    ability:
      "Each night, you see the Grimoire. You might register as good & as a Townsfolk or Outsider, even if dead.",
  },
  {
    role_id: "scarlet_woman",
    ability:
      "If there are 5 or more players alive & the Demon dies, you become the Demon. (Travellers don't count.)",
  },
  {
    role_id: "baron",
    ability: "There are extra Outsiders in play. [+2 Outsiders]",
  },
  {
    role_id: "imp",
    ability:
      "Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.",
  },
  {
    role_id: "bureaucrat",
    ability:
      "Each night, choose a player (not yourself): their vote counts as 3 votes tomorrow.",
  },
  {
    role_id: "thief",
    ability:
      "Each night, choose a player (not yourself): their vote counts negatively tomorrow.",
  },
  {
    role_id: "gunslinger",
    ability:
      "Each day, after the 1st vote has been tallied, you may choose a player that voted: they die.",
  },
  {
    role_id: "scapegoat",
    ability:
      "If a player of your alignment is executed, you might be executed instead.",
  },
  {
    role_id: "beggar",
    ability:
      "You must use a vote token to vote. If a dead player gives you theirs, you learn their alignment. You are sober & healthy.",
  },
  {
    role_id: "grandmother",
    ability:
      "You start knowing a good player & their character. If the Demon kills them, you die too.",
  },
  {
    role_id: "sailor",
    ability:
      "Each night, choose an alive player: either you or they are drunk until dusk. You can't die.",
  },
  {
    role_id: "chambermaid",
    ability:
      "Each night, choose 2 alive players (not yourself): you learn how many woke tonight due to their ability.",
  },
  {
    role_id: "exorcist",
    ability:
      "Each night*, choose a player (different to last night): the Demon, if chosen, learns who you are then doesn't wake tonight.",
  },
  {
    role_id: "innkeeper",
    ability:
      "Each night*, choose 2 players: they can't die tonight, but 1 is drunk until dusk.",
  },
  {
    role_id: "gambler",
    ability:
      "Each night*, choose a player & guess their character: if you guess wrong, you die.",
  },
  {
    role_id: "gossip",
    ability:
      "Each day, you may make a public statement. Tonight, if it was true, a player dies.",
  },
  {
    role_id: "courtier",
    ability:
      "Once per game, at night, choose a character: they are drunk for 3 nights & 3 days.",
  },
  {
    role_id: "professor",
    ability:
      "Once per game, at night*, choose a dead player: if they are a Townsfolk, they are resurrected.",
  },
  {
    role_id: "minstrel",
    ability:
      "When a Minion dies by execution, all other players (except Travellers) are drunk until dusk tomorrow.",
  },
  {
    role_id: "tea_lady",
    ability: "If both your alive neighbors are good, they can't die.",
  },
  {
    role_id: "pacifist",
    ability: "Executed good players might not die.",
  },
  {
    role_id: "fool",
    ability: "The first time you die, you don't.",
  },
  {
    role_id: "tinker",
    ability: "You might die at any time.",
  },
  {
    role_id: "moonchild",
    ability:
      "When you learn that you died, publicly choose 1 alive player. Tonight, if it was a good player, they die.",
  },
  {
    role_id: "goon",
    ability:
      "Each night, the 1st player to choose you with their ability is drunk until dusk. You become their alignment.",
  },
  {
    role_id: "lunatic",
    ability:
      "You think you are a Demon, but you are not. The Demon knows who you are & who you choose at night.",
  },
  {
    role_id: "godfather",
    ability:
      "You start knowing which Outsiders are in play. If 1 died today, choose a player tonight: they die. [-1 or +1 Outsider]",
  },
  {
    role_id: "devils_advocate",
    ability:
      "Each night, choose a living player (different to last night): if executed tomorrow, they don't die.",
  },
  {
    role_id: "assassin",
    ability:
      "Once per game, at night*, choose a player: they die, even if for some reason they could not.",
  },
  {
    role_id: "mastermind",
    ability:
      "If the Demon dies by execution (ending the game), play for 1 more day. If a player is then executed, their team loses.",
  },
  {
    role_id: "zombuul",
    ability:
      "Each night*, if no-one died today, choose a player: they die. The 1st time you die, you live but register as dead.",
  },
  {
    role_id: "pukka",
    ability:
      "Each night, choose a player: they are poisoned. The previously poisoned player dies then becomes healthy.",
  },
  {
    role_id: "shabaloth",
    ability:
      "Each night*, choose 2 players: they die. A dead player you chose last night might be regurgitated.",
  },
  {
    role_id: "po",
    ability:
      "Each night*, you may choose a player: they die. If your last choice was no-one, choose 3 players tonight.",
  },
  {
    role_id: "apprentice",
    ability:
      "On your 1st night, you gain a Townsfolk ability (if good), or a Minion ability (if evil).",
  },
  {
    role_id: "matron",
    ability:
      "Each day, you may choose up to 3 sets of 2 players to swap seats. Players may not leave their seats to talk in private.",
  },
  {
    role_id: "judge",
    ability:
      "Once per game, if another player nominated, you may choose to force the current execution to pass or fail.",
  },
  {
    role_id: "bishop",
    ability:
      "Only the Storyteller can nominate. At least 1 opposing player must be nominated each day.",
  },
  {
    role_id: "voudon",
    ability:
      "Only you and the dead can vote. They don't need a vote token to do so. A 50% majority is not required.",
  },
  {
    role_id: "clockmaker",
    ability:
      "You start knowing how many steps from the Demon to its nearest Minion.",
  },
  {
    role_id: "dreamer",
    ability:
      "Each night, choose a player (not yourself or Travellers): you learn 1 good and 1 evil character, 1 of which is correct.",
  },
  {
    role_id: "snake_charmer",
    ability:
      "Each night, choose an alive player: a chosen Demon swaps characters & alignments with you & is then poisoned.",
  },
  {
    role_id: "mathematician",
    ability:
      "Each night, you learn how many players’ abilities worked abnormally (since dawn) due to another character's ability.",
  },
  {
    role_id: "flowergirl",
    ability: "Each night*, you learn if a Demon voted today.",
  },
  {
    role_id: "town_crier",
    ability: "Each night*, you learn if a Minion nominated today.",
  },
  {
    role_id: "oracle",
    ability: "Each night*, you learn how many dead players are evil.",
  },
  {
    role_id: "savant",
    ability:
      "Each day, you may visit the Storyteller to learn 2 things in private: 1 is true & 1 is false.",
  },
  {
    role_id: "seamstress",
    ability:
      "Once per game, at night, choose 2 players (not yourself): you learn if they are the same alignment.",
  },
  {
    role_id: "philosopher",
    ability:
      "Once per game, at night, choose a good character: gain that ability. If this character is in play, they are drunk.",
  },
  {
    role_id: "artist",
    ability:
      "Once per game, during the day, privately ask the Storyteller any yes/no question.",
  },
  {
    role_id: "juggler",
    ability:
      "On your 1st day, publicly guess up to 5 players' characters. That night, you learn how many you got correct.",
  },
  {
    role_id: "sage",
    ability: "If the Demon kills you, you learn that it is 1 of 2 players.",
  },
  {
    role_id: "mutant",
    ability: "If you are “mad” about being an Outsider, you might be executed.",
  },
  {
    role_id: "sweetheart",
    ability: "When you die, 1 player is drunk from now on.",
  },
  {
    role_id: "barber",
    ability:
      "If you died today or tonight, the Demon may choose 2 players (not another Demon) to swap characters.",
  },
  {
    role_id: "klutz",
    ability:
      "When you learn that you died, publicly choose 1 alive player: if they are evil, your team loses.",
  },
  {
    role_id: "evil_twin",
    ability:
      "You & an opposing player know each other. If the good player is executed, evil wins. Good can't win if you both live.",
  },
  {
    role_id: "witch",
    ability:
      "Each night, choose a player: if they nominate tomorrow, they die. If just 3 players live, you lose this ability.",
  },
  {
    role_id: "cerenovus",
    ability:
      "Each night, choose a player & a good character: they are “mad” they are this character tomorrow, or might be executed.",
  },
  {
    role_id: "pit-hag",
    ability:
      "Each night*, choose a player & a character they become (if not-in-play). If a Demon is made, deaths tonight are arbitrary.",
  },
  {
    role_id: "fang_gu",
    ability:
      "Each night*, choose a player: they die. The 1st Outsider this kills becomes an evil Fang Gu & you die instead. [+1 Outsider]",
  },
  {
    role_id: "vigormortis",
    ability:
      "Each night*, choose a player: they die. Minions you kill keep their ability & poison 1 Townsfolk neighbor. [-1 Outsider]",
  },
  {
    role_id: "no_dashii",
    ability:
      "Each night*, choose a player: they die. Your 2 Townsfolk neighbors are poisoned.",
  },
  {
    role_id: "vortox",
    ability:
      "Each night*, choose a player: they die. Townsfolk abilities yield false info. Each day, if no-one is executed, evil wins.",
  },
  {
    role_id: "barista",
    ability:
      "Each night, until dusk, 1) a player becomes sober, healthy and gets true info, or 2) their ability works twice. They learn which.",
  },
  {
    role_id: "harlot",
    ability:
      "Each night*, choose a living player: if they agree, you learn their character, but you both might die.",
  },
  {
    role_id: "butcher",
    ability: "Each day, after the 1st execution, you may nominate again.",
  },
  {
    role_id: "bone_collector",
    ability:
      "Once per game, at night, choose a dead player: they regain their ability until dusk.",
  },
  {
    role_id: "deviant",
    ability: "If you were funny today, you cannot die by exile.",
  },
  {
    role_id: "noble",
    ability: "You start knowing 3 players, 1 and only 1 of which is evil.",
  },
  {
    role_id: "bounty_hunter",
    ability:
      "You start knowing 1 evil player. If the player you know dies, you learn another evil player tonight. [1 Townsfolk is evil]",
  },
  {
    role_id: "pixie",
    ability:
      "You start knowing 1 in-play Townsfolk. If you were mad that you were this character, you gain their ability when they die.",
  },
  {
    role_id: "general",
    ability:
      "Each night, you learn which alignment the Storyteller believes is winning: good, evil, or neither.",
  },
  {
    role_id: "preacher",
    ability:
      "Each night, choose a player: a Minion, if chosen, learns this. All chosen Minions have no ability.",
  },
  {
    role_id: "king",
    ability:
      "Each night, if the dead equal or outnumber the living, you learn 1 alive character. The Demon knows who you are.",
  },
  {
    role_id: "balloonist",
    ability:
      "Each night, you learn a player of a different character type than last night. [+0 or +1 Outsider]",
  },
  {
    role_id: "cult_leader",
    ability:
      "Each night, you become the alignment of an alive neighbor. If all good players choose to join your cult, your team wins.",
  },
  {
    role_id: "lycanthrope",
    ability:
      "Each night*, choose a living player: if good, they die, but they are the only player that can die tonight.",
  },
  {
    role_id: "amnesiac",
    ability:
      "You do not know what your ability is. Each day, privately guess what it is: you learn how accurate you are.",
  },
  {
    role_id: "nightwatchman",
    ability:
      "Once per game, at night, choose a player: they learn who you are.",
  },
  {
    role_id: "engineer",
    ability:
      "Once per game, at night, choose which Minions or which Demon is in play.",
  },
  {
    role_id: "fisherman",
    ability:
      "Once per game, during the day, visit the Storyteller for some advice to help your team win.",
  },
  {
    role_id: "huntsman",
    ability:
      "Once per game, at night, choose a living player: the Damsel, if chosen, becomes a not-in-play Townsfolk. [+the Damsel]",
  },
  {
    role_id: "alchemist",
    ability: "You have a not-in-play Minion ability.",
  },
  {
    role_id: "farmer",
    ability: "If you die at night, an alive good player becomes a Farmer.",
  },
  {
    role_id: "magician",
    ability:
      "The Demon thinks you are a Minion. Minions think you are a Demon.",
  },
  {
    role_id: "choirboy",
    ability:
      "If the Demon kills the King, you learn which player is the Demon. [+ the King]",
  },
  {
    role_id: "poppy_grower",
    ability:
      "Minions & Demons do not know each other. If you die, they learn who each other are that night.",
  },
  {
    role_id: "atheist",
    ability:
      "The Storyteller can break the game rules & if executed, good wins, even if you are dead. [No evil characters]",
  },
  {
    role_id: "cannibal",
    ability:
      "You have the ability of the recently killed executee. If they are evil, you are poisoned until a good player dies by execution.",
  },
  {
    role_id: "snitch",
    ability: "Minions start knowing 3 not-in-play characters.",
  },
  {
    role_id: "acrobat",
    ability:
      "Each night*, if either good living neighbor is drunk or poisoned, you die.",
  },
  {
    role_id: "puzzlemaster",
    ability:
      "1 player is drunk, even if you die. If you guess (once) who it is, learn the Demon player, but guess wrong & get false info.",
  },
  {
    role_id: "heretic",
    ability: "Whoever wins, loses & whoever loses, wins, even if you are dead.",
  },
  {
    role_id: "damsel",
    ability:
      "All Minions know you are in play. If a Minion publicly guesses you (once), your team loses.",
  },
  {
    role_id: "golem",
    ability:
      "You may only nominate once per game. When you do, if the nominee is not the Demon, they die.",
  },
  {
    role_id: "politician",
    ability:
      "If you were the player most responsible for your team losing, you change alignment & win, even if dead.",
  },
  {
    role_id: "widow",
    ability:
      "On your 1st night, look at the Grimoire and choose a player: they are poisoned. 1 good player knows a Widow is in play.",
  },
  {
    role_id: "fearmonger",
    ability:
      "Each night, choose a player. If you nominate & execute them, their team loses. All players know if you choose a new player.",
  },
  {
    role_id: "psychopath",
    ability:
      "Each day, before nominations, you may publicly choose a player: they die. If executed, you only die if you lose roshambo.",
  },
  {
    role_id: "goblin",
    ability:
      "If you publicly claim to be the Goblin when nominated & are executed that day, your team wins.",
  },
  {
    role_id: "mezepheles",
    ability:
      "You start knowing a secret word. The 1st good player to say this word becomes evil that night.",
  },
  {
    role_id: "marionette",
    ability:
      "You think you are a good character but you are not. The Demon knows who you are. [You neighbor the Demon]",
  },
  {
    role_id: "boomdandy",
    ability:
      "If you are executed, all but 3 players die. 1 minute later, the player with the most players pointing at them dies.",
  },
  {
    role_id: "lil_monsta",
    ability:
      'Each night, Minions choose who babysits Lil\' Monsta & "is the Demon". Each night*, a player might die. [+1 Minion]',
  },
  {
    role_id: "lleech",
    ability:
      "Each night*, choose a player: they die. You start by choosing a player: they are poisoned. You die if & only if they are dead.",
  },
  {
    role_id: "al-hadikhia",
    ability:
      "Each night*, choose 3 players (all players learn who): each silently chooses to live or die, but if all live, all die.",
  },
  {
    role_id: "legion",
    ability:
      "Each night*, a player might die. Executions fail if only evil voted. You register as a Minion too. [Most players are Legion]",
  },
  {
    role_id: "leviathan",
    ability:
      "If more than 1 good player is executed, evil wins. All players know you are in play. After day 5, evil wins.",
  },
  {
    role_id: "riot",
    ability:
      "Nominees die, but may nominate again immediately (on day 3, they must). After day 3, evil wins. [All Minions are Riot]",
  },
  {
    role_id: "gangster",
    ability:
      "Once per day, you may choose to kill an alive neighbor, if your other alive neighbor agrees.",
  },
  {
    role_id: "organ_grinder",
    ability:
      "All players keep their eyes closed when voting & the vote tally is secret. Votes for you only count if you vote.",
  },
  {
    role_id: "vizier",
    ability:
      "All players know who you are. You can not die during the day. If good voted, you may choose to execute immediately.",
  },
  {
    role_id: "knight",
    ability: "You start knowing 2 players that are not the Demon.",
  },
  {
    role_id: "steward",
    ability: "You start knowing 1 good player.",
  },
  {
    role_id: "high_priestess",
    ability:
      "Each night, learn which player the Storyteller believes you should talk to most.",
  },
  {
    role_id: "harpy",
    ability:
      "Each night, choose 2 players: tomorrow, the 1st player is mad that the 2nd is evil, or one or both might die.",
  },
  {
    role_id: "plague_doctor",
    ability: "If you die, the Storyteller gains a Minion ability.",
  },
  {
    role_id: "shugenja",
    ability:
      "You start knowing if your closest evil player is clockwise or anti-clockwise. If equidistant, this info is arbitrary.",
  },
  {
    role_id: "ojo",
    ability:
      "Each night*, choose a character: they die. If they are not in play, the Storyteller chooses who dies.",
  },
  {
    role_id: "hatter",
    ability:
      "If you died today or tonight, the Minion & Demon players may choose new Minion & Demon characters to be.",
  },
  {
    role_id: "kazali",
    ability:
      "Each night*, choose a player: they die. [You choose which players are which Minions. -? to +? Outsiders]",
  },
  {
    role_id: "village_idiot",
    ability:
      "Each night, choose a player: you learn their alignment. [+0 to +2 Village Idiots. 1 of the extras is drunk]",
  },
  {
    role_id: "yaggababble",
    ability:
      "You start knowing a secret phrase. For each time you said it publicly today, a player might die.",
  },
  {
    role_id: "summoner",
    ability:
      "You get 3 bluffs. On the 3rd night, choose a player: they become an evil Demon of your choice. [No Demon]",
  },
  {
    role_id: "banshee",
    ability:
      "If the Demon kills you, all players learn this. From now on, you may nominate twice per day and vote twice per nomination.",
  },
  {
    role_id: "ogre",
    ability:
      "On your 1st night, choose a player (not yourself): you become their alignment (you don't know which) even if drunk or poisoned.",
  },
  {
    role_id: "alsaahir",
    ability:
      "Once per day, if you publicly guess which players are Minion(s) and which are Demon(s), good wins.",
  },
  {
    role_id: "zealot",
    ability:
      "If there are 5 or more players alive, you must vote for every nomination.",
  },
  {
    role_id: "lord_of_typhon",
    ability:
      "Each night*, choose a player: they die. [Evil characters are in a line. You are in the middle. +1 Minion. -? to +? Outsiders]",
  },
  {
    role_id: "boffin",
    ability:
      "The Demon (even if drunk or poisoned) has a not-in-play good character’s ability. You both know which.",
  },
  {
    role_id: "doomsayer",
    ability:
      "If 4 or more players live, each living player may publicly choose (once per game) that a player of their own alignment dies.",
  },
  {
    role_id: "angel",
    ability:
      "Something bad might happen to whoever is most responsible for the death of a new player.",
  },
  {
    role_id: "buddhist",
    ability:
      "For the first 2 minutes of each day, veteran players may not talk.",
  },
  {
    role_id: "hells_librarian",
    ability:
      "Something bad might happen to whoever talks when the Storyteller has asked for silence.",
  },
  {
    role_id: "revolutionary",
    ability:
      "2 neighboring players are known to be the same alignment. Once per game, 1 of them registers falsely.",
  },
  {
    role_id: "fiddler",
    ability:
      "Once per game, the Demon secretly chooses an opposing player: all players choose which of these 2 players win.",
  },
  {
    role_id: "toymaker",
    ability:
      "The Demon may choose not to attack & must do this at least once per game. Evil players get normal starting info.",
  },
  {
    role_id: "fibbin",
    ability: "Once per game, 1 good player might get incorrect information.",
  },
  {
    role_id: "duchess",
    ability:
      "Each day, 3 players may choose to visit you. At night*, each visitor learns how many visitors are evil, but 1 gets false info.",
  },
  {
    role_id: "sentinel",
    ability: "There might be 1 extra or 1 fewer Outsider in play.",
  },
  {
    role_id: "spirit_of_ivory",
    ability: "There can't be more than 1 extra evil player.",
  },
  {
    role_id: "djinn",
    ability: "Use the Djinn's special rule. All players know what it is.",
  },
  {
    role_id: "storm_catcher",
    ability:
      "Name a good character. If in play, they can only die by execution, but evil players learn which player it is.",
  },
  {
    role_id: "gardener",
    ability: "The Storyteller assigns 1 or more players' characters.",
  },
  {
    role_id: "bootlegger",
    ability: "This script has homebrew characters or rules.",
  },
  {
    role_id: "ferryman",
    ability: "On the final day, all dead players regain their vote token.",
  },
];

function toRole(name, type, alignment) {
  const id = name.toLowerCase().replace(/ /g, "_").replace(/'/g, "");

  return {
    id,
    name,
    type,
    initial_alignment: alignment,
    ability: abilities.find((ability) => ability.role_id === id)?.ability || "",
    token_url: `/img/role/${name
      .toLowerCase()
      .replace(/ /g, "")
      .replace(/'/g, "")
      .replace(/-/g, "")}.png`,
  };
}

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
  abilities,
};
