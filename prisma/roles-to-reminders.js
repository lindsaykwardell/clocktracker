const roles = [
  {
    id: "dusk",
    edition: "special",
    name: "Dusk",
    firstNightReminder: "Start the Night Phase.",
    otherNightReminder: "Start the Night Phase.",
    firstNight: 1,
    otherNight: 1,
  },
  {
    id: "dawn",
    edition: "special",
    name: "Dawn",
    firstNightReminder: "Wait for a few seconds. End the Night Phase.",
    otherNightReminder: "Wait for a few seconds. End the Night Phase.",
    firstNight: 69,
    otherNight: 87,
  },
  {
    id: "minioninfo",
    edition: "special",
    name: "Minion Info",
    team: "minion",
    firstNightReminder:
      "If there are 7 or more players, wake all Minions:\n\tShow the *THIS IS THE DEMON* token. Point to the Demon.\n\tShow the *THESE ARE YOUR MINIONS* token. Point to the other Minions.",
    firstNight: 14,
    otherNight: 0,
  },
  {
    id: "demoninfo",
    edition: "special",
    name: "Demon Info",
    team: "demon",
    firstNightReminder:
      "If there are 7 or more players, wake the Demon:\n\tShow the *THESE ARE YOUR MINIONS* token. Point to all Minions.\n\tShow the *THESE CHARACTERS ARE NOT IN PLAY* token. Show 3 not-in-play good character tokens.",
    firstNight: 18,
    otherNight: 0,
  },
  {
    id: "washerwoman",
    name: "Washerwoman",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder:
      "Show the Townsfolk character token. Point to both the *TOWNSFOLK* and *WRONG* players.",
    otherNightReminder: "",
    reminders: ["Townsfolk", "Wrong"],
    setup: false,
    ability: "You start knowing that 1 of 2 players is a particular Townsfolk.",
    firstNight: 43,
    otherNight: 0,
  },
  {
    id: "librarian",
    name: "Librarian",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder:
      "Show the Outsider character token. Point to both the *OUTSIDER* and *WRONG* players.",
    otherNightReminder: "",
    reminders: ["Outsider", "Wrong"],
    setup: false,
    ability:
      "You start knowing that 1 of 2 players is a particular Outsider. (Or that zero are in play.)",
    firstNight: 44,
    otherNight: 0,
  },
  {
    id: "investigator",
    name: "Investigator",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder:
      "Show the Minion character token. Point to both the *MINION* and *WRONG* players.",
    otherNightReminder: "",
    reminders: ["Minion", "Wrong"],
    setup: false,
    ability: "You start knowing that 1 of 2 players is a particular Minion.",
    firstNight: 45,
    otherNight: 0,
  },
  {
    id: "chef",
    name: "Chef",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder: "Give a finger signal.",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "You start knowing how many pairs of evil players there are.",
    firstNight: 46,
    otherNight: 0,
  },
  {
    id: "empath",
    name: "Empath",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder: "Give a finger signal.",
    otherNightReminder: "Give a finger signal.",
    reminders: [],
    setup: false,
    ability:
      "Each night, you learn how many of your 2 alive neighbors are evil.",
    firstNight: 47,
    otherNight: 66,
  },
  {
    id: "fortuneteller",
    name: "Fortune Teller",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder:
      "The Fortune Teller chooses 2 players. Nod if either is the Demon (or the *RED HERRING*).",
    otherNightReminder:
      "The Fortune Teller chooses 2 players. Nod if either is the Demon (or the *RED HERRING*).",
    reminders: ["Red Herring"],
    setup: false,
    ability:
      "Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.",
    firstNight: 48,
    otherNight: 67,
  },
  {
    id: "undertaker",
    name: "Undertaker",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "If a player was executed today, show their character token.",
    reminders: ["Died Today"],
    setup: false,
    ability: "Each night*, you learn which character died by execution today.",
    firstNight: 0,
    otherNight: 68,
  },
  {
    id: "monk",
    name: "Monk",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "The Monk chooses a player. :reminder:",
    reminders: ["Safe"],
    setup: false,
    ability:
      "Each night*, choose a player (not yourself): they are safe from the Demon tonight.",
    firstNight: 0,
    otherNight: 17,
  },
  {
    id: "ravenkeeper",
    name: "Ravenkeeper",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "If the Ravenkeeper died tonight, the Ravenkeeper chooses a player. Show that player's character token.",
    reminders: [],
    setup: false,
    ability:
      "If you die at night, you are woken to choose a player: you learn their character.",
    firstNight: 0,
    otherNight: 65,
  },
  {
    id: "virgin",
    name: "Virgin",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["No Ability"],
    setup: false,
    ability:
      "The 1st time you are nominated, if the nominator is a Townsfolk, they are executed immediately.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "slayer",
    name: "Slayer",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["No Ability"],
    setup: false,
    ability:
      "Once per game, during the day, publicly choose a player: if they are the Demon, they die.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "soldier",
    name: "Soldier",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "You are safe from the Demon.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "mayor",
    name: "Mayor",
    edition: "tb",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "If only 3 players live & no execution occurs, your team wins. If you die at night, another player might die instead.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "butler",
    name: "Butler",
    edition: "tb",
    team: "outsider",
    firstNightReminder: "The Butler chooses a player. :reminder:",
    otherNightReminder: "The Butler chooses a player. :reminder:",
    reminders: ["Master"],
    setup: false,
    ability:
      "Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.",
    firstNight: 49,
    otherNight: 81,
  },
  {
    id: "drunk",
    name: "Drunk",
    edition: "tb",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    remindersGlobal: ["Is The Drunk"],
    setup: true,
    ability:
      "You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.",
    special: [
      {
        type: "selection",
        name: "bag-disabled",
      },
      {
        type: "reveal",
        name: "replace-character",
      },
    ],
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "recluse",
    name: "Recluse",
    edition: "tb",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "You might register as evil & as a Minion or Demon, even if dead.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "saint",
    name: "Saint",
    edition: "tb",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "If you die by execution, your team loses.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "poisoner",
    name: "Poisoner",
    edition: "tb",
    team: "minion",
    firstNightReminder: "The Poisoner chooses a player. :reminder:",
    otherNightReminder: "The Poisoner chooses a player. :reminder:",
    reminders: ["Poisoned"],
    setup: false,
    ability:
      "Each night, choose a player: they are poisoned tonight and tomorrow day.",
    firstNight: 26,
    otherNight: 12,
  },
  {
    id: "spy",
    name: "Spy",
    edition: "tb",
    team: "minion",
    firstNightReminder: "Show the Grimoire for as long as the Spy needs.",
    otherNightReminder: "Show the Grimoire for as long as the Spy needs.",
    reminders: [],
    setup: false,
    special: [
      {
        type: "signal",
        name: "grimoire",
        time: "night",
      },
    ],
    ability:
      "Each night, you see the Grimoire. You might register as good & as a Townsfolk or Outsider, even if dead.",
    firstNight: 63,
    otherNight: 82,
    jinxes: [
      {
        id: "alchemist",
        reason: "The Alchemist can not have the Spy ability.",
      },
      {
        id: "magician",
        reason:
          "When the Spy sees the Grimoire, the Demon and Magician's character tokens are removed.",
      },
      {
        id: "poppygrower",
        reason:
          "If the Poppy Grower is in play, the Spy does not see the Grimoire until the Poppy Grower dies.",
      },
      {
        id: "plaguedoctor",
        reason:
          "If the Plague Doctor dies, a living Minion gains the Spy ability in addition to their own ability, and learns this.",
      },
      {
        id: "damsel",
        reason: "If the Spy is (or has been) in play, the Damsel is poisoned.",
      },
      {
        id: "heretic",
        reason: "Only 1 jinxed character can be in play.",
      },
      {
        id: "ogre",
        reason: "The Spy registers as evil to the Ogre.",
      },
    ],
  },
  {
    id: "scarletwoman",
    name: "Scarlet Woman",
    edition: "tb",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder:
      "If the Scarlet Woman became the Demon today, show them the *YOU ARE* token, then the Demon token.",
    reminders: ["Is The Demon"],
    setup: false,
    ability:
      "If there are 5 or more players alive & the Demon dies, you become the Demon. (Travellers don't count.)",
    firstNight: 0,
    otherNight: 25,
    jinxes: [
      {
        id: "plaguedoctor",
        reason:
          "If the Plague Doctor dies, a living Minion gains the Scarlet Woman ability in addition to their own ability, and learns this.",
      },
    ],
  },
  {
    id: "baron",
    name: "Baron",
    edition: "tb",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: true,
    ability: "There are extra Outsiders in play. [+2 Outsiders]",
    firstNight: 0,
    otherNight: 0,
    jinxes: [
      {
        id: "heretic",
        reason: "The Baron might only add 1 Outsider, not 2.",
      },
      {
        id: "plaguedoctor",
        reason:
          "If the Storyteller gains the Baron ability, up to two players become not-in-play Outsiders.",
      },
    ],
  },
  {
    id: "imp",
    name: "Imp",
    edition: "tb",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder:
      "The Imp chooses a player. :reminder: If the Imp chose themselves: Replace 1 alive Minion token with a spare Imp token. Put the old Imp to sleep. Wake the new Imp. Show the *YOU ARE* token, then show the Imp token.",
    reminders: ["Dead"],
    setup: false,
    ability:
      "Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.",
    firstNight: 0,
    otherNight: 31,
  },
  {
    id: "bureaucrat",
    name: "Bureaucrat",
    edition: "tb",
    team: "traveler",
    firstNightReminder: "The Bureaucrat chooses a player. :reminder:",
    otherNightReminder: "The Bureaucrat chooses a player. :reminder:",
    reminders: ["3 Votes"],
    setup: false,
    ability:
      "Each night, choose a player (not yourself): their vote counts as 3 votes tomorrow.",
    special: [
      {
        type: "vote",
        name: "multiplier",
        value: 3,
      },
    ],
    firstNight: 6,
    otherNight: 3,
  },
  {
    id: "thief",
    name: "Thief",
    edition: "tb",
    team: "traveler",
    firstNightReminder: "The Thief chooses a player. :reminder:",
    otherNightReminder: "The Thief chooses a player. :reminder:",
    reminders: ["Negative Vote"],
    setup: false,
    ability:
      "Each night, choose a player (not yourself): their vote counts negatively tomorrow.",
    special: [
      {
        type: "vote",
        name: "multiplier",
        value: -1,
      },
    ],
    firstNight: 7,
    otherNight: 4,
  },
  {
    id: "gunslinger",
    name: "Gunslinger",
    edition: "tb",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "Each day, after the 1st vote has been tallied, you may choose a player that voted: they die.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "scapegoat",
    name: "Scapegoat",
    edition: "tb",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "If a player of your alignment is executed, you might be executed instead.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "beggar",
    name: "Beggar",
    edition: "tb",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "You must use a vote token to vote. If a dead player gives you theirs, you learn their alignment. You are sober & healthy.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "grandmother",
    name: "Grandmother",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder:
      "Point to the grandchild player & show their character token.",
    otherNightReminder:
      "If the grandchild was killed by the Demon, the Grandmother dies too. :reminder:",
    reminders: ["Grandchild", "Dead"],
    setup: false,
    ability:
      "You start knowing a good player & their character. If the Demon kills them, you die too.",
    firstNight: 50,
    otherNight: 64,
  },
  {
    id: "sailor",
    name: "Sailor",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "The Sailor chooses a living player. :reminder:",
    otherNightReminder: "The Sailor chooses a living player. :reminder:",
    reminders: ["Drunk"],
    setup: false,
    ability:
      "Each night, choose an alive player: either you or they are drunk until dusk. You can't die.",
    firstNight: 20,
    otherNight: 9,
  },
  {
    id: "chambermaid",
    name: "Chambermaid",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder:
      "The Chambermaid chooses 2 living players. Give a finger signal.",
    otherNightReminder:
      "The Chambermaid chooses 2 living players. Give a finger signal.",
    reminders: [],
    setup: false,
    ability:
      "Each night, choose 2 alive players (not yourself): you learn how many woke tonight due to their ability.",
    firstNight: 67,
    otherNight: 85,
    jinxes: [
      {
        id: "mathematician",
        reason:
          "The Chambermaid learns if the Mathematician wakes tonight or not, even though the Chambermaid wakes first.",
      },
    ],
  },
  {
    id: "exorcist",
    name: "Exorcist",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "The Exorcist chooses a player. :reminder: Put the Exorcist to sleep. If the Exorcist chose the Demon: Wake the Demon. Show the *THIS CHARACTER SELECTED YOU* & Exorcist tokens. Point to the Exorcist.",
    reminders: ["Chosen"],
    setup: false,
    ability:
      "Each night*, choose a player (different to last night): the Demon, if chosen, learns who you are then doesn't wake tonight.",
    firstNight: 0,
    otherNight: 28,
  },
  {
    id: "innkeeper",
    name: "Innkeeper",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "The Innkeeper chooses 2 players. :reminder: :reminder: :reminder:",
    reminders: ["Safe", "Safe", "Drunk"],
    setup: false,
    ability:
      "Each night*, choose 2 players: they can't die tonight, but 1 is drunk until dusk.",
    firstNight: 0,
    otherNight: 14,
  },
  {
    id: "gambler",
    name: "Gambler",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "The Gambler chooses a player & a character. :reminder:",
    reminders: ["Dead"],
    setup: false,
    ability:
      "Each night*, choose a player & guess their character: if you guess wrong, you die.",
    firstNight: 0,
    otherNight: 15,
  },
  {
    id: "gossip",
    name: "Gossip",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "If the Gossip is due to kill a player, they die. :reminder:",
    reminders: ["Dead"],
    setup: false,
    ability:
      "Each day, you may make a public statement. Tonight, if it was true, a player dies.",
    firstNight: 0,
    otherNight: 49,
  },
  {
    id: "courtier",
    name: "Courtier",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder:
      "The Courtier might choose a character. :reminder: :reminder:",
    otherNightReminder:
      "The Courtier might choose a character. :reminder: :reminder:",
    reminders: ["Drunk 3", "Drunk 2", "Drunk 1", "No Ability"],
    setup: false,
    ability:
      "Once per game, at night, choose a character: they are drunk for 3 nights & 3 days.",
    firstNight: 28,
    otherNight: 13,
  },
  {
    id: "professor",
    name: "Professor",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "The Professor might choose a dead player. :reminder: :reminder:",
    reminders: ["Alive", "No Ability"],
    setup: false,
    ability:
      "Once per game, at night*, choose a dead player: if they are a Townsfolk, they are resurrected.",
    firstNight: 0,
    otherNight: 56,
  },
  {
    id: "minstrel",
    name: "Minstrel",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["Everyone Is Drunk"],
    setup: false,
    ability:
      "When a Minion dies by execution, all other players (except Travellers) are drunk until dusk tomorrow.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "tealady",
    name: "Tea Lady",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["Cannot Die", "Cannot Die"],
    setup: false,
    ability: "If both your alive neighbors are good, they can't die.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "pacifist",
    name: "Pacifist",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "Executed good players might not die.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "fool",
    name: "Fool",
    edition: "bmr",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["No Ability"],
    setup: false,
    ability: "The first time you die, you don't.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "tinker",
    name: "Tinker",
    edition: "bmr",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "The Tinker might die. :reminder:",
    reminders: ["Dead"],
    setup: false,
    ability: "You might die at any time.",
    firstNight: 0,
    otherNight: 62,
  },
  {
    id: "moonchild",
    name: "Moonchild",
    edition: "bmr",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder:
      "If the Moonchild is due to kill a good player, they die. :reminder:",
    reminders: ["Dead"],
    setup: false,
    ability:
      "When you learn that you died, publicly choose 1 alive player. Tonight, if it was a good player, they die.",
    firstNight: 0,
    otherNight: 63,
  },
  {
    id: "goon",
    name: "Goon",
    edition: "bmr",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["Drunk"],
    setup: false,
    ability:
      "Each night, the 1st player to choose you with their ability is drunk until dusk. You become their alignment.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "lunatic",
    name: "Lunatic",
    edition: "bmr",
    team: "outsider",
    firstNightReminder:
      "If there are 7 or more players, wake the Lunatic: Show the *THESE ARE YOUR MINIONS* token. Point to any players. Show the *THESE CHARACTERS ARE NOT IN PLAY* token. Show 3 good character tokens. Put the Lunatic to sleep. Wake the Demon. Show the *YOU ARE* info token and the Demon token. Show the *THIS PLAYER IS* info token and the Lunatic token, then point to the Lunatic.",
    otherNightReminder:
      "Do whatever needs to be done to simulate the Demon acting. Put the Lunatic to sleep. Wake the Demon. Show the Lunatic token & point to them, then their target(s).",
    reminders: ["Chosen", "Chosen", "Chosen"],
    setup: false,
    ability:
      "You think you are a Demon, but you are not. The Demon knows who you are & who you choose at night.",
    firstNight: 16,
    otherNight: 27,
    jinxes: [
      {
        id: "mathematician",
        reason:
          "The Mathematician learns if the Lunatic attacks a different player(s) than the real Demon attacked.",
      },
    ],
  },
  {
    id: "godfather",
    name: "Godfather",
    edition: "bmr",
    team: "minion",
    firstNightReminder: "Show the character tokens of all in-play Outsiders.",
    otherNightReminder:
      "If an Outsider died today, the Godfather chooses a player. :reminder:",
    reminders: ["Died Today", "Dead"],
    setup: true,
    ability:
      "You start knowing which Outsiders are in play. If 1 died today, choose a player tonight: they die. [-1 or +1 Outsider]",
    firstNight: 30,
    otherNight: 48,
    jinxes: [
      {
        id: "heretic",
        reason: "Only 1 jinxed character can be in play.",
      },
    ],
  },
  {
    id: "devilsadvocate",
    name: "Devil's Advocate",
    edition: "bmr",
    team: "minion",
    firstNightReminder:
      "The Devil's Advocate chooses a living player. :reminder:",
    otherNightReminder:
      "The Devil's Advocate chooses a living player. :reminder:",
    reminders: ["Survives Execution"],
    setup: false,
    ability:
      "Each night, choose a living player (different to last night): if executed tomorrow, they don't die.",
    firstNight: 31,
    otherNight: 18,
  },
  {
    id: "assassin",
    name: "Assassin",
    edition: "bmr",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder:
      "The Assassin might choose a player. :reminder: :reminder:",
    reminders: ["Dead", "No Ability"],
    setup: false,
    ability:
      "Once per game, at night*, choose a player: they die, even if for some reason they could not.",
    firstNight: 0,
    otherNight: 47,
  },
  {
    id: "mastermind",
    name: "Mastermind",
    edition: "bmr",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "If the Demon dies by execution (ending the game), play for 1 more day. If a player is then executed, their team loses.",
    firstNight: 0,
    otherNight: 0,
    jinxes: [
      {
        id: "alhadikhia",
        reason:
          "If the Al-Hadikhia dies by execution, and the Mastermind is alive, the Al-Hadikhia chooses 3 good players tonight: if all 3 choose to live, evil wins. Otherwise, good wins.",
      },
    ],
  },
  {
    id: "zombuul",
    name: "Zombuul",
    edition: "bmr",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder:
      "If no one died today, the Zombuul chooses a player. :reminder:",
    reminders: ["Died Today", "Dead"],
    setup: false,
    ability:
      "Each night*, if no-one died today, choose a player: they die. The 1st time you die, you live but register as dead.",
    firstNight: 0,
    otherNight: 32,
  },
  {
    id: "pukka",
    name: "Pukka",
    edition: "bmr",
    team: "demon",
    firstNightReminder: "The Pukka chooses a player. :reminder:",
    otherNightReminder:
      "The Pukka chooses a player. :reminder: The previously poisoned player dies then becomes healthy. :reminder:",
    reminders: ["Poisoned", "Poisoned", "Dead"],
    setup: false,
    ability:
      "Each night, choose a player: they are poisoned. The previously poisoned player dies then becomes healthy.",
    firstNight: 38,
    otherNight: 33,
  },
  {
    id: "shabaloth",
    name: "Shabaloth",
    edition: "bmr",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder:
      "A previously chosen player might be resurrected. :reminder: The Shabaloth chooses 2 players. :reminder: :reminder:",
    reminders: ["Dead", "Dead", "Alive"],
    setup: false,
    ability:
      "Each night*, choose 2 players: they die. A dead player you chose last night might be regurgitated.",
    firstNight: 0,
    otherNight: 34,
  },
  {
    id: "po",
    name: "Po",
    edition: "bmr",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder:
      "The Po may choose a player OR chooses 3 players if they chose no-one last night. :reminder: or :reminder: :reminder: :reminder:",
    reminders: ["Dead", "Dead", "Dead", "3 attacks"],
    setup: false,
    ability:
      "Each night*, you may choose a player: they die. If your last choice was no-one, choose 3 players tonight.",
    firstNight: 0,
    otherNight: 35,
  },
  {
    id: "apprentice",
    name: "Apprentice",
    edition: "bmr",
    team: "traveler",
    firstNightReminder:
      "Show the Apprentice the 'You are' card, then a Townsfolk or Minion token. In the Grimoire, replace the Apprentice token with that character token, and put the Apprentice's 'Is the Apprentice' reminder by that character token.",
    otherNightReminder: "",
    reminders: ["Is The Apprentice"],
    setup: false,
    ability:
      "On your 1st night, you gain a Townsfolk ability (if good), or a Minion ability (if evil).",
    special: [
      {
        type: "signal",
        name: "grimoire",
        time: "night",
      },
    ],
    firstNight: 4,
    otherNight: 0,
  },
  {
    id: "matron",
    name: "Matron",
    edition: "bmr",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "Each day, you may choose up to 3 sets of 2 players to swap seats. Players may not leave their seats to talk in private.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "judge",
    name: "Judge",
    edition: "bmr",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["No Ability"],
    setup: false,
    ability:
      "Once per game, if another player nominated, you may choose to force the current execution to pass or fail.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "bishop",
    name: "Bishop",
    edition: "bmr",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["Nominate Good", "Nominate Evil"],
    setup: false,
    ability:
      "Only the Storyteller can nominate. At least 1 opposing player must be nominated each day.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "voudon",
    name: "Voudon",
    edition: "bmr",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "Only you and the dead can vote. They don't need a vote token to do so. A 50% majority is not required.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "clockmaker",
    name: "Clockmaker",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder: "Give a finger signal.",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "You start knowing how many steps from the Demon to its nearest Minion.",
    firstNight: 51,
    otherNight: 0,
  },
  {
    id: "dreamer",
    name: "Dreamer",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder:
      "The Dreamer points to a player. Show 1 good & 1 evil character token, 1 of which is their character.",
    otherNightReminder:
      "The Dreamer points to a player. Show 1 good & 1 evil character token, 1 of which is their character.",
    reminders: [],
    setup: false,
    ability:
      "Each night, choose a player (not yourself or Travellers): you learn 1 good and 1 evil character, 1 of which is correct.",
    firstNight: 52,
    otherNight: 69,
  },
  {
    id: "snakecharmer",
    name: "Snake Charmer",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder:
      "The Snake Charmer chooses a player. If they chose the Demon: Show the *YOU ARE* & Demon tokens. Give a thumbs down. Swap the Snake Charmer & Demon tokens. Put the old Snake Charmer to sleep. Wake the old Demon. Show the *YOU ARE* and Snake Charmer tokens & give a thumbs up. :reminder:",
    otherNightReminder:
      "The Snake Charmer chooses a player. If they chose the Demon: Show the *YOU ARE* & Demon tokens. Give a thumbs down. Swap the Snake Charmer & Demon tokens. Put the old Snake Charmer to sleep. Wake the old Demon. Show the *YOU ARE* and Snake Charmer tokens & give a thumbs up. :reminder:",
    reminders: ["Poisoned"],
    setup: false,
    ability:
      "Each night, choose an alive player: a chosen Demon swaps characters & alignments with you & is then poisoned.",
    firstNight: 29,
    otherNight: 16,
  },
  {
    id: "mathematician",
    name: "Mathematician",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder: "Give a finger signal.",
    otherNightReminder: "Give a finger signal.",
    reminders: ["Abnormal", "Abnormal", "Abnormal", "Abnormal", "Abnormal"],
    setup: false,
    ability:
      "Each night, you learn how many players’ abilities worked abnormally (since dawn) due to another character's ability.",
    firstNight: 68,
    otherNight: 86,
  },
  {
    id: "flowergirl",
    name: "Flowergirl",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "Either nod or shake your head.",
    reminders: ["Demon Voted", "Demon Not Voted"],
    setup: false,
    ability: "Each night*, you learn if a Demon voted today.",
    firstNight: 0,
    otherNight: 70,
  },
  {
    id: "towncrier",
    name: "Town Crier",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "Either nod or shake your head.",
    reminders: ["Minions Not Nominated", "Minion Nominated"],
    setup: false,
    ability: "Each night*, you learn if a Minion nominated today.",
    firstNight: 0,
    otherNight: 71,
  },
  {
    id: "oracle",
    name: "Oracle",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "Give a finger signal.",
    reminders: [],
    setup: false,
    ability: "Each night*, you learn how many dead players are evil.",
    firstNight: 0,
    otherNight: 72,
  },
  {
    id: "savant",
    name: "Savant",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "Each day, you may visit the Storyteller to learn 2 things in private: 1 is true & 1 is false.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "seamstress",
    name: "Seamstress",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder:
      "The Seamstress might choose 2 players. Nod or shake your head. :reminder:",
    otherNightReminder:
      "The Seamstress might choose 2 players. Nod or shake your head. :reminder:",
    reminders: ["No Ability"],
    setup: false,
    ability:
      "Once per game, at night, choose 2 players (not yourself): you learn if they are the same alignment.",
    firstNight: 53,
    otherNight: 73,
  },
  {
    id: "philosopher",
    name: "Philosopher",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder:
      "The Philosopher might choose a character. If necessary, swap their character token. :reminder:",
    otherNightReminder:
      "The Philosopher might choose a character. If necessary, swap their character token. :reminder:",
    reminders: ["Drunk"],
    remindersGlobal: ["Is The Philosopher"],
    setup: false,
    ability:
      "Once per game, at night, choose a good character: gain that ability. If this character is in play, they are drunk.",
    special: [
      {
        type: "reveal",
        name: "replace-character",
      },
    ],
    firstNight: 9,
    otherNight: 7,
    jinxes: [
      {
        id: "bountyhunter",
        reason:
          "If the Philosopher gains the Bounty Hunter ability, a Townsfolk might turn evil.",
      },
    ],
  },
  {
    id: "artist",
    name: "Artist",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["No Ability"],
    setup: false,
    ability:
      "Once per game, during the day, privately ask the Storyteller any yes/no question.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "juggler",
    name: "Juggler",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "Give a finger signal.",
    reminders: ["Correct", "Correct", "Correct", "Correct", "Correct"],
    setup: false,
    ability:
      "On your 1st day, publicly guess up to 5 players' characters. That night, you learn how many you got correct.",
    firstNight: 0,
    otherNight: 74,
  },
  {
    id: "sage",
    name: "Sage",
    edition: "snv",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "If the Demon killed the Sage, wake the Sage and point to 2 players, 1 of which is the Demon.",
    reminders: [],
    setup: false,
    ability: "If the Demon kills you, you learn that it is 1 of 2 players.",
    firstNight: 0,
    otherNight: 54,
  },
  {
    id: "mutant",
    name: "Mutant",
    edition: "snv",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "If you are “mad” about being an Outsider, you might be executed.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "sweetheart",
    name: "Sweetheart",
    edition: "snv",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder:
      "If the Sweetheart died, a player became drunk immediately. If you haven't done this yet, do so now. :reminder:",
    reminders: ["Drunk"],
    setup: false,
    ability: "When you die, 1 player is drunk from now on.",
    firstNight: 0,
    otherNight: 53,
  },
  {
    id: "barber",
    name: "Barber",
    edition: "snv",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder:
      "If the Barber died today or tonight, show the Demon the *THIS CHARACTER SELECTED YOU* & Barber tokens. If the Demon chose 2 players, wake one at a time. Show the *YOU ARE* token & their new character token.",
    reminders: ["Haircuts Tonight"],
    setup: false,
    ability:
      "If you died today or tonight, the Demon may choose 2 players (not another Demon) to swap characters.",
    firstNight: 0,
    otherNight: 52,
  },
  {
    id: "klutz",
    name: "Klutz",
    edition: "snv",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "When you learn that you died, publicly choose 1 alive player: if they are evil, your team loses.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "eviltwin",
    name: "Evil Twin",
    edition: "snv",
    team: "minion",
    firstNightReminder:
      "Wake both twins. Allow eye contact. Show the good twin's character token to the Evil Twin & vice versa.",
    otherNightReminder: "",
    reminders: ["Twin"],
    setup: false,
    ability:
      "You & an opposing player know each other. If the good player is executed, evil wins. Good can't win if you both live.",
    firstNight: 32,
    otherNight: 0,
    jinxes: [
      {
        id: "plaguedoctor",
        reason:
          "The Storyteller cannot gain the Evil Twin ability if the Plague Doctor dies.",
      },
    ],
  },
  {
    id: "witch",
    name: "Witch",
    edition: "snv",
    team: "minion",
    firstNightReminder: "The Witch chooses a player. :reminder:",
    otherNightReminder: "The Witch chooses a player. :reminder:",
    reminders: ["Cursed"],
    setup: false,
    ability:
      "Each night, choose a player: if they nominate tomorrow, they die. If just 3 players live, you lose this ability.",
    firstNight: 33,
    otherNight: 19,
  },
  {
    id: "cerenovus",
    name: "Cerenovus",
    edition: "snv",
    team: "minion",
    firstNightReminder:
      "The Cerenovus chooses a player & a character. :reminder: Put the Cerenovus to sleep. Wake the target. Show the *THIS CHARACTER SELECTED YOU* token, the Cerenovus token, then the madness-character token.",
    otherNightReminder:
      "The Cerenovus chooses a player & a character. :reminder: Put the Cerenovus to sleep. Wake the target. Show the *THIS CHARACTER SELECTED YOU* token, the Cerenovus token, then the madness-character token.",
    reminders: ["Mad"],
    setup: false,
    ability:
      "Each night, choose a player & a good character: they are “mad” they are this character tomorrow, or might be executed.",
    firstNight: 34,
    otherNight: 20,
    jinxes: [
      {
        id: "goblin",
        reason:
          "The Cerenovus may choose to make a player mad that they are the Goblin.",
      },
    ],
  },
  {
    id: "pithag",
    name: "Pit-Hag",
    edition: "snv",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder:
      "The Pit-Hag chooses a player & a character. If they chose a character that is not in play: Put the Pit-Hag to sleep. Wake the target. Show the *YOU ARE* token & their new character token.",
    reminders: [],
    setup: false,
    ability:
      "Each night*, choose a player & a character they become (if not-in-play). If a Demon is made, deaths tonight are arbitrary.",
    firstNight: 0,
    otherNight: 21,
    jinxes: [
      {
        id: "heretic",
        reason: "A Pit-Hag can not create a Heretic.",
      },
      {
        id: "damsel",
        reason:
          "If a Pit-Hag creates a Damsel, the Storyteller chooses which player it is.",
      },
      {
        id: "politician",
        reason:
          "If the Pit-Hag turns an evil player into the Politician, they can't turn good due to their own ability.",
      },
      {
        id: "villageidiot",
        reason:
          "If there is a spare token, the Pit-Hag can create an extra Village Idiot. If so, the drunk Village Idiot might change.",
      },
      {
        id: "cultleader",
        reason:
          "If the Pit-Hag turns an evil player into the Cult Leader, they can't turn good due to their own ability.",
      },
      {
        id: "goon",
        reason:
          "If the Pit-Hag turns an evil player into the Goon, they can't turn good due to their own ability.",
      },
      {
        id: "ogre",
        reason:
          "If the Pit-Hag turns an evil player into the Ogre, they can't turn good due to their own ability.",
      },
    ],
  },
  {
    id: "fanggu",
    name: "Fang Gu",
    edition: "snv",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder:
      "The Fang Gu chooses a player. :reminder: If they chose an Outsider (once only): Replace the Outsider token with the spare Fang Gu token. Put the Fang Gu to sleep. Wake the target. Show the *YOU ARE* and Fang Gu tokens & give a thumbs-down. :reminder:",
    reminders: ["Dead", "Once"],
    setup: true,
    ability:
      "Each night*, choose a player: they die. The 1st Outsider this kills becomes an evil Fang Gu & you die instead. [+1 Outsider]",
    firstNight: 0,
    otherNight: 36,
    jinxes: [
      {
        id: "scarletwoman",
        reason:
          "If the Fang Gu chooses an Outsider and dies, the Scarlet Woman does not become the Fang Gu.",
      },
    ],
  },
  {
    id: "vigormortis",
    name: "Vigormortis",
    edition: "snv",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder:
      "The Vigormortis chooses a player. :reminder: If that player is a Minion, poison a neighboring Townsfolk. :reminder: :reminder:",
    reminders: [
      "Dead",
      "Has Ability",
      "Has Ability",
      "Has Ability",
      "Poisoned",
      "Poisoned",
      "Poisoned",
    ],
    setup: true,
    ability:
      "Each night*, choose a player: they die. Minions you kill keep their ability & poison 1 Townsfolk neighbor. [-1 Outsider]",
    firstNight: 0,
    otherNight: 40,
  },
  {
    id: "nodashii",
    name: "No Dashii",
    edition: "snv",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder: "The No Dashii chooses a player. :reminder:",
    reminders: ["Dead", "Poisoned", "Poisoned"],
    setup: false,
    ability:
      "Each night*, choose a player: they die. Your 2 Townsfolk neighbors are poisoned.",
    firstNight: 0,
    otherNight: 37,
  },
  {
    id: "vortox",
    name: "Vortox",
    edition: "snv",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder: "The Vortox chooses a player. :reminder:",
    reminders: ["Dead"],
    setup: false,
    ability:
      "Each night*, choose a player: they die. Townsfolk abilities yield false info. Each day, if no-one is executed, evil wins.",
    firstNight: 0,
    otherNight: 38,
    jinxes: [
      {
        id: "banshee",
        reason:
          "If the Vortox is in play and the Demon kills the Banshee, the players still learn that the Banshee has died.",
      },
    ],
  },
  {
    id: "barista",
    name: "Barista",
    edition: "snv",
    team: "traveler",
    firstNightReminder:
      "Choose a player, wake them and tell them which Barista power is affecting them. Treat them accordingly (sober/healthy/true info or activate their ability twice).",
    otherNightReminder:
      "Choose a player, wake them and tell them which Barista power is affecting them. Treat them accordingly (sober/healthy/true info or activate their ability twice).",
    reminders: ["Sober and Healthy", "Acts Twice", "?"],
    setup: false,
    ability:
      "Each night, until dusk, 1) a player becomes sober, healthy and gets true info, or 2) their ability works twice. They learn which.",
    firstNight: 5,
    otherNight: 2,
  },
  {
    id: "harlot",
    name: "Harlot",
    edition: "snv",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder:
      "The Harlot points at any living player. Then, put the Harlot to sleep. Wake the chosen player, show them the 'This character selected you' token, then the Harlot token. That player either nods their head yes or shakes their head no. If they nodded their head yes, wake the Harlot and show them the chosen player's character token. Then, you may decide that both players die.",
    reminders: ["Dead", "Dead"],
    setup: false,
    ability:
      "Each night*, choose a living player: if they agree, you learn their character, but you both might die.",
    firstNight: 0,
    otherNight: 5,
  },
  {
    id: "butcher",
    name: "Butcher",
    edition: "snv",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "Each day, after the 1st execution, you may nominate again.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "bonecollector",
    name: "Bone Collector",
    edition: "snv",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder:
      "The Bone Collector either shakes their head no or points at any dead player. If they pointed at any dead player, put the Bone Collector's 'Has Ability' reminder by the chosen player's character token. (They may need to be woken tonight to use it.)",
    reminders: ["No Ability", "Has Ability"],
    setup: false,
    ability:
      "Once per game, at night, choose a dead player: they regain their ability until dusk.",
    firstNight: 0,
    otherNight: 6,
  },
  {
    id: "deviant",
    name: "Deviant",
    edition: "snv",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "If you were funny today, you cannot die by exile.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "noble",
    name: "Noble",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "Point to all three players marked *KNOW*.",
    otherNightReminder: "",
    reminders: ["Know", "Know", "Know"],
    setup: false,
    ability: "You start knowing 3 players, 1 and only 1 of which is evil.",
    firstNight: 56,
    otherNight: 0,
  },
  {
    id: "bountyhunter",
    name: "Bounty Hunter",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "Point to the *KNOWN* player.",
    otherNightReminder:
      "If the *KNOWN* player died today or tonight, point to a new *KNOWN* player.",
    reminders: ["Known"],
    setup: false,
    ability:
      "You start knowing 1 evil player. If the player you know dies, you learn another evil player tonight. [1 Townsfolk is evil]",
    firstNight: 60,
    otherNight: 78,
  },
  {
    id: "pixie",
    name: "Pixie",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "Show the Townsfolk character token marked *MAD*.",
    otherNightReminder: "",
    reminders: ["Mad", "Has Ability"],
    setup: false,
    ability:
      "You start knowing 1 in-play Townsfolk. If you were mad that you were this character, you gain their ability when they die.",
    firstNight: 39,
    otherNight: 0,
  },
  {
    id: "general",
    name: "General",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "Give a thumb signal.",
    otherNightReminder: "Give a thumb signal.",
    reminders: [],
    setup: false,
    ability:
      "Each night, you learn which alignment the Storyteller believes is winning: good, evil, or neither.",
    firstNight: 66,
    otherNight: 84,
  },
  {
    id: "preacher",
    name: "Preacher",
    edition: "",
    team: "townsfolk",
    firstNightReminder:
      "The Preacher chooses a player. :reminder: If they chose a Minion: Put the Preacher to sleep. Wake the target. Show the *THIS CHARACTER SELECTED YOU* token and the Preacher token.",
    otherNightReminder:
      "The Preacher chooses a player. :reminder: If they chose a Minion: Put the Preacher to sleep. Wake the target. Show the *THIS CHARACTER SELECTED YOU* token and the Preacher token.",
    reminders: ["No Ability", "No Ability", "No Ability"],
    setup: false,
    ability:
      "Each night, choose a player: a Minion, if chosen, learns this. All chosen Minions have no ability.",
    firstNight: 23,
    otherNight: 11,
  },
  {
    id: "king",
    name: "King",
    edition: "",
    team: "townsfolk",
    firstNightReminder:
      "Wake the Demon. Show the *THIS PLAYER IS* token and the King token, then point to the King.",
    otherNightReminder:
      "If the dead equal or outnumber the living, show the character token of an alive player.",
    reminders: [],
    setup: false,
    ability:
      "Each night, if the dead equal or outnumber the living, you learn 1 alive character. The Demon knows who you are.",
    firstNight: 19,
    otherNight: 77,
  },
  {
    id: "balloonist",
    name: "Balloonist",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "Show any player. :reminder:",
    otherNightReminder:
      "Show a player with a different character type to previously. :reminder:",
    reminders: ["Know"],
    setup: true,
    ability:
      "Each night, you learn a player of a different character type than last night. [+0 or +1 Outsider]",
    firstNight: 57,
    otherNight: 75,
  },
  {
    id: "cultleader",
    name: "Cult Leader",
    edition: "",
    team: "townsfolk",
    firstNightReminder:
      "The Cult Leader might change alignment. If so, show the *YOU ARE* info token and a thumbs up or down for their new alignment.",
    otherNightReminder:
      "The Cult Leader might change alignment. If so, show the *YOU ARE* info token and a thumbs up or down for their new alignment.",
    reminders: [],
    setup: false,
    ability:
      "Each night, you become the alignment of an alive neighbor. If all good players choose to join your cult, your team wins.",
    firstNight: 62,
    otherNight: 80,
  },
  {
    id: "lycanthrope",
    name: "Lycanthrope",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "The Lycanthrope chooses a player :reminder:",
    reminders: ["Dead"],
    setup: false,
    ability:
      "Each night*, choose a living player: if good, they die, but they are the only player that can die tonight.",
    firstNight: 0,
    otherNight: 29,
    jinxes: [
      {
        id: "gambler",
        reason:
          "If the Lycanthrope is alive and the Gambler kills themself at night, no other players can die tonight.",
      },
    ],
  },
  {
    id: "amnesiac",
    name: "Amnesiac",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["?", "?", "?"],
    setup: false,
    ability:
      "You do not know what your ability is. Each day, privately guess what it is: you learn how accurate you are.",
    firstNight: 42,
    otherNight: 60,
  },
  {
    id: "nightwatchman",
    name: "Nightwatchman",
    edition: "",
    team: "townsfolk",
    firstNightReminder:
      "The Nightwatchman might choose a player :reminder: Put the Nightwatchman to sleep. Wake the target and show the *THIS PLAYER IS* and Nightwatchman tokens and point to the Nightwatchman.",
    otherNightReminder:
      "The Nightwatchman might choose a player :reminder: Put the Nightwatchman to sleep. Wake the target and show the *THIS PLAYER IS* and Nightwatchman tokens and point to the Nightwatchman.",
    reminders: ["No Ability"],
    setup: false,
    ability:
      "Once per game, at night, choose a player: they learn who you are.",
    firstNight: 61,
    otherNight: 79,
  },
  {
    id: "engineer",
    name: "Engineer",
    edition: "",
    team: "townsfolk",
    firstNightReminder:
      "The Engineer might choose Minions or Demons. :reminder: If they do: Put the Engineer to sleep. Wake a target, show them the *YOU ARE* token and their new character token, then put that target to sleep. Repeat for all players that changed characters.",
    otherNightReminder:
      "The Engineer might choose Minions or Demons. :reminder: If they do: Put the Engineer to sleep. Wake a target, show them the *YOU ARE* token and their new character token, then put that target to sleep. Repeat for all players that changed characters.",
    reminders: ["No Ability"],
    setup: false,
    ability:
      "Once per game, at night, choose which Minions or which Demon is in play.",
    firstNight: 22,
    otherNight: 10,
  },
  {
    id: "fisherman",
    name: "Fisherman",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["No Ability"],
    setup: false,
    ability:
      "Once per game, during the day, visit the Storyteller for some advice to help your team win.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "huntsman",
    name: "Huntsman",
    edition: "",
    team: "townsfolk",
    firstNightReminder:
      "The Huntsman might choose a player. :reminder: If that player was the Damsel: Put the Huntsman to sleep. Wake the Damsel and show them the *YOU ARE* info token and their new character token.",
    otherNightReminder:
      "The Huntsman might choose a player. :reminder: If that player was the Damsel: Put the Huntsman to sleep. Wake the Damsel and show them the *YOU ARE* info token and their new character token.",
    reminders: ["No Ability"],
    setup: true,
    ability:
      "Once per game, at night, choose a living player: the Damsel, if chosen, becomes a not-in-play Townsfolk. [+the Damsel]",
    firstNight: 40,
    otherNight: 58,
  },
  {
    id: "alchemist",
    name: "Alchemist",
    edition: "",
    team: "townsfolk",
    firstNightReminder:
      "Show the *YOU ARE* token and the character token of a not in play Minion.",
    otherNightReminder: "",
    reminders: [],
    remindersGlobal: ["Is The Alchemist"],
    setup: false,
    ability: "You have a not-in-play Minion ability.",
    special: [
      {
        type: "reveal",
        name: "replace-character",
      },
    ],
    firstNight: 10,
    otherNight: 0,
  },
  {
    id: "farmer",
    name: "Farmer",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "If the Farmer died tonight, wake an alive good player. Show them the *YOU ARE* info token and a Farmer character token. Replace their previous token with the Farmer token.",
    reminders: [],
    setup: false,
    ability: "If you die at night, an alive good player becomes a Farmer.",
    firstNight: 0,
    otherNight: 61,
  },
  {
    id: "magician",
    name: "Magician",
    edition: "",
    team: "townsfolk",
    firstNightReminder:
      "Include the Magician in the Minion and Demon Info steps.",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "The Demon thinks you are a Minion. Minions think you are a Demon.",
    firstNight: 13,
    otherNight: 0,
  },
  {
    id: "choirboy",
    name: "Choirboy",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "If the Demon killed the King, point to the Demon player.",
    reminders: [],
    setup: true,
    ability:
      "If the Demon kills the King, you learn which player is the Demon. [+ the King]",
    firstNight: 0,
    otherNight: 57,
  },
  {
    id: "poppygrower",
    name: "Poppy Grower",
    edition: "",
    team: "townsfolk",
    firstNightReminder:
      "Do not do the Minion Info and Demon Info steps. Wake the Demon, show the *THESE CHARACTERS ARE NOT IN PLAY* info token and any three good character tokens that are not in play.",
    otherNightReminder:
      "If the Poppy Grower died today or tonight, wake the Minions, show the *THIS IS THE DEMON* info token and point to the Demon. Put them to sleep. Wake the Demon, show the *THESE ARE YOUR MINIONS* info token and point to the Minions. Put the Demon to sleep.",
    reminders: ["Evil Wakes"],
    setup: false,
    ability:
      "Minions & Demons do not know each other. If you die, they learn who each other are that night.",
    firstNight: 11,
    otherNight: 8,
  },
  {
    id: "atheist",
    name: "Atheist",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: true,
    ability:
      "The Storyteller can break the game rules & if executed, good wins, even if you are dead. [No evil characters]",
    special: [
      {
        type: "selection",
        name: "bag-duplicate",
      },
    ],
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "cannibal",
    name: "Cannibal",
    edition: "",
    team: "townsfolk",
    firstNightReminder: "",
    otherNightReminder:
      "Wake the Cannibal and treat them like they have the ability of the most recently killed executee.",
    reminders: ["Poisoned", "Died Today"],
    setup: false,
    ability:
      "You have the ability of the recently killed executee. If they are evil, you are poisoned until a good player dies by execution.",
    firstNight: 0,
    otherNight: 0,
    jinxes: [
      {
        id: "butler",
        reason:
          "If the Cannibal gains the Butler ability, the Cannibal learns this.",
      },
      {
        id: "juggler",
        reason:
          "If the Juggler guesses on their first day and dies by execution, tonight the living Cannibal learns how many guesses the Juggler got correct.",
      },
      {
        id: "zealot",
        reason:
          "If the Cannibal gains the Zealot ability, the Cannibal learns this.",
      },
    ],
  },
  {
    id: "snitch",
    name: "Snitch",
    edition: "",
    team: "outsider",
    firstNightReminder:
      "Wake each Minion. Show the *THESE CHARACTERS ARE NOT IN PLAY* token and three not-in-play character tokens. Put each Minion to sleep.",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "Minions start knowing 3 not-in-play characters.",
    firstNight: 15,
    otherNight: 0,
  },
  {
    id: "acrobat",
    name: "Acrobat",
    edition: "",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "The Acrobat might die",
    reminders: ["Dead"],
    setup: false,
    ability:
      "Each night*, if either good living neighbor is drunk or poisoned, you die.",
    firstNight: 0,
    otherNight: 50,
  },
  {
    id: "puzzlemaster",
    name: "Puzzlemaster",
    edition: "",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["Drunk", "Guess Used"],
    setup: false,
    ability:
      "1 player is drunk, even if you die. If you guess (once) who it is, learn the Demon player, but guess wrong & get false info.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "heretic",
    name: "Heretic",
    edition: "",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability: "Whoever wins, loses & whoever loses, wins, even if you are dead.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "damsel",
    name: "Damsel",
    edition: "",
    team: "outsider",
    firstNightReminder:
      "Wake each Minion. Show the Damsel token. Put each Minion to sleep.",
    otherNightReminder:
      "If the Damsel was chosen by the Huntsman, show them the *YOU ARE* info token and their new character token.",
    reminders: ["Guess Used"],
    setup: false,
    ability:
      "All Minions know you are in play. If a Minion publicly guesses you (once), your team loses.",
    firstNight: 41,
    otherNight: 59,
  },
  {
    id: "golem",
    name: "Golem",
    edition: "",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["May Not Nominate"],
    setup: false,
    ability:
      "You may only nominate once per game. When you do, if the nominee is not the Demon, they die.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "politician",
    name: "Politician",
    edition: "",
    team: "outsider",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "If you were the player most responsible for your team losing, you change alignment & win, even if dead.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "widow",
    name: "Widow",
    edition: "",
    team: "minion",
    firstNightReminder:
      "Show the Grimoire for as long as the Widow needs. The Widow chooses a player. :reminder:",
    otherNightReminder: "",
    reminders: ["Poisoned"],
    remindersGlobal: ["Knows"],
    setup: false,
    special: [
      {
        name: "grimoire",
        type: "signal",
        time: "night",
      },
    ],
    ability:
      "On your 1st night, look at the Grimoire and choose a player: they are poisoned. 1 good player knows a Widow is in play.",
    firstNight: 27,
    otherNight: 0,
    jinxes: [
      {
        id: "alchemist",
        reason: "The Alchemist can not have the Widow ability.",
      },
      {
        id: "magician",
        reason:
          "When the Widow sees the Grimoire, the Demon and Magician's character tokens are removed.",
      },
      {
        id: "poppygrower",
        reason:
          "If the Poppy Grower is in play, the Widow does not see the Grimoire until the Poppy Grower dies.",
      },
      {
        id: "damsel",
        reason:
          "If the Widow is (or has been) in play, the Damsel is poisoned.",
      },
      {
        id: "heretic",
        reason: "Only 1 jinxed character can be in play.",
      },
    ],
  },
  {
    id: "fearmonger",
    name: "Fearmonger",
    edition: "",
    team: "minion",
    firstNightReminder:
      'The Fearmonger chooses a player. :reminder: Declare that "the Fearmonger has chosen a player."',
    otherNightReminder:
      'The Fearmonger chooses a player. :reminder: If the player wasn\'t already marked with the *FEAR* reminder, declare that "the Fearmonger has chosen a player."',
    reminders: ["Fear"],
    setup: false,
    ability:
      "Each night, choose a player. If you nominate & execute them, their team loses. All players know if you choose a new player.",
    firstNight: 35,
    otherNight: 22,
    jinxes: [
      {
        id: "plaguedoctor",
        reason:
          "If the Plague Doctor dies, a living Minion gains the Fearmonger ability in addition to their own ability, and learns this.",
      },
    ],
  },
  {
    id: "psychopath",
    name: "Psychopath",
    edition: "",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "Each day, before nominations, you may publicly choose a player: they die. If executed, you only die if you lose roshambo.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "goblin",
    name: "Goblin",
    edition: "",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["Claimed"],
    setup: false,
    ability:
      "If you publicly claim to be the Goblin when nominated & are executed that day, your team wins.",
    firstNight: 0,
    otherNight: 0,
    jinxes: [
      {
        id: "plaguedoctor",
        reason:
          "If the Plague Doctor dies, a living Minion gains the Goblin ability in addition to their own ability, and learns this.",
      },
    ],
  },
  {
    id: "mezepheles",
    name: "Mezepheles",
    edition: "",
    team: "minion",
    firstNightReminder: "Show the written word.",
    otherNightReminder:
      "If a player is marked with the *TURNS EVIL* reminder, wake them. Show the *YOU ARE* info token and a thumbs down. The Mezepheles loses their ability :reminder:",
    reminders: ["Turns Evil", "No Ability"],
    setup: false,
    ability:
      "You start knowing a secret word. The 1st good player to say this word becomes evil that night.",
    firstNight: 37,
    otherNight: 24,
  },
  {
    id: "marionette",
    name: "Marionette",
    edition: "",
    team: "minion",
    firstNightReminder:
      "Wake the Demon. Point to the player marked *IS THE MARIONETTE* and show the *THIS PLAYER IS* token and the Marionette character token.",
    otherNightReminder: "",
    reminders: [],
    remindersGlobal: ["Is The Marionette"],
    setup: true,
    ability:
      "You think you are a good character but you are not. The Demon knows who you are. [You neighbor the Demon]",
    special: [
      {
        type: "selection",
        name: "bag-disabled",
      },
      {
        type: "reveal",
        name: "replace-character",
      },
    ],
    firstNight: 21,
    otherNight: 0,
    jinxes: [
      {
        id: "lilmonsta",
        reason:
          "The Marionette neighbors a Minion, not the Demon. The Marionette is not woken to choose who takes the Lil' Monsta token, and does not learn they are the Marionette if they have the Lil' Monsta token.",
      },
      {
        id: "poppygrower",
        reason:
          "When the Poppy Grower dies, the Demon learns the Marionette but the Marionette learns nothing.",
      },
      {
        id: "snitch",
        reason:
          "The Marionette does not learn 3 not in-play characters. The Demon learns an extra 3 instead.",
      },
      {
        id: "balloonist",
        reason:
          "If the Marionette thinks that they are the Balloonist, +1 Outsider might have been added.",
      },
      {
        id: "damsel",
        reason: "The Marionette does not learn that a Damsel is in play.",
      },
      {
        id: "plaguedoctor",
        reason:
          "If the Demon has a neighbor who is alive and a Townsfolk or Outsider when the Plague Doctor dies, that player becomes an evil Marionette. If there is already an extra evil player, this does not happen.",
      },
      {
        id: "huntsman",
        reason:
          "If the Marionette thinks that they are the Huntsman, the Damsel was added.",
      },
    ],
  },
  {
    id: "boomdandy",
    name: "Boomdandy",
    edition: "",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "If you are executed, all but 3 players die. 1 minute later, the player with the most players pointing at them dies.",
    special: [
      {
        type: "ability",
        name: "pointing",
        time: "day",
      },
    ],
    firstNight: 0,
    otherNight: 0,
    jinxes: [
      {
        id: "plaguedoctor",
        reason:
          "If the Plague Doctor is executed and the Storyteller would gain the Boomdandy ability, the Boomdandy ability triggers immediately.",
      },
    ],
  },
  {
    id: "lilmonsta",
    name: "Lil' Monsta",
    edition: "",
    team: "demon",
    firstNightReminder:
      "Wake all Minions, allow them to choose a babysitter :reminder:",
    otherNightReminder:
      "Wake all Minions, allow them to choose a babysitter :reminder: A player might die :reminder:",
    reminders: [],
    remindersGlobal: ["Is The Demon", "Dead"],
    setup: true,
    ability:
      'Each night, Minions choose who babysits Lil\' Monsta & "is the Demon". Each night*, a player might die. [+1 Minion]',
    special: [
      {
        type: "ability",
        name: "pointing",
        time: "night",
        global: "minion",
      },
      {
        type: "selection",
        name: "bag-disabled",
      },
    ],
    firstNight: 24,
    otherNight: 44,
    jinxes: [
      {
        id: "poppygrower",
        reason:
          "If the Poppy Grower is in play, Minions don't wake together. They are woken one by one, until one of them chooses to take the Lil' Monsta token.",
      },
      {
        id: "magician",
        reason:
          "Each night, the Magician chooses a Minion: if that Minion & Lil' Monsta are alive, that Minion babysits Lil’ Monsta.",
      },
      {
        id: "scarletwoman",
        reason:
          "If there are 5 or more players alive and the player holding the Lil' Monsta token dies, the Scarlet Woman is given the Lil' Monsta token tonight.",
      },
      {
        id: "organgrinder",
        reason:
          "Votes for the Organ Grinder count if the Organ Grinder is babysitting Lil' Monsta.",
      },
      {
        id: "vizier",
        reason:
          "The Vizier can die by execution if they are babysitting Lil' Monsta.",
      },
      {
        id: "hatter",
        reason:
          "If a Demon chooses Lil' Monsta, they also choose a Minion to become and babysit Lil' Monsta tonight.",
      },
    ],
  },
  {
    id: "lleech",
    name: "Lleech",
    edition: "",
    team: "demon",
    firstNightReminder: "The Lleech chooses a player. :reminder:",
    otherNightReminder: "The Lleech chooses a player. :reminder:",
    reminders: ["Dead", "Poisoned"],
    setup: false,
    ability:
      "Each night*, choose a player: they die. You start by choosing a player: they are poisoned. You die if & only if they are dead.",
    firstNight: 25,
    otherNight: 43,
    jinxes: [
      {
        id: "mastermind",
        reason:
          "If the Mastermind is alive and the Lleech's host dies by execution, the Lleech lives but loses their ability.",
      },
      {
        id: "slayer",
        reason: "If the Slayer slays the Lleech's host, the host dies.",
      },
      {
        id: "heretic",
        reason:
          "If the Lleech has poisoned the Heretic then the Lleech dies, the Heretic remains poisoned.",
      },
    ],
  },
  {
    id: "alhadikhia",
    name: "Al-Hadikhia",
    edition: "",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder:
      'The Al-Hadikhia chooses three players. :reminder: :reminder: :reminder: Wake the player marked *1* and say "the Al-Hadikhia has chosen", then the player\'s name, then "Do you choose to live?" They either nod or shake their head. Put them to sleep and add or remove shrouds accordingly. Repeat for players marked *2* and *3*. If all three players are now alive, add a shroud to all three.',
    reminders: ["1", "2", "3"],
    setup: false,
    ability:
      "Each night*, choose 3 players (all players learn who): each silently chooses to live or die, but if all live, all die.",
    firstNight: 0,
    otherNight: 42,
    jinxes: [
      {
        id: "scarletwoman",
        reason:
          "If there are two living Al-Hadikhias, the Scarlet Woman Al-Hadikhia becomes the Scarlet Woman again.",
      },
    ],
  },
  {
    id: "legion",
    name: "Legion",
    edition: "",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder: "A player might die. :reminder:",
    reminders: ["Dead", "About To Die"],
    setup: true,
    ability:
      "Each night*, a player might die. Executions fail if only evil voted. You register as a Minion too. [Most players are Legion]",
    special: [
      {
        type: "selection",
        name: "bag-duplicate",
      },
    ],
    firstNight: 0,
    otherNight: 30,
    jinxes: [
      {
        id: "engineer",
        reason:
          "Legion and the Engineer can not both be in play at the start of the game. If the Engineer creates Legion, most players (including all evil players) become evil Legion.",
      },
      {
        id: "preacher",
        reason:
          "If the Preacher chooses Legion, Legion keeps their ability, but the Preacher might learn they are Legion.",
      },
      {
        id: "minstrel",
        reason:
          "If Legion died by execution today, Legion keeps their ability, but the Minstrel might learn they are Legion.",
      },
      {
        id: "hatter",
        reason:
          "If the Hatter dies and Legion is in play, nothing happens. If the Hatter dies and an evil player chooses Legion, all current evil players become Legion.",
      },
      {
        id: "zealot",
        reason: "The Zealot might register as evil to Legion's ability.",
      },
    ],
  },
  {
    id: "leviathan",
    name: "Leviathan",
    edition: "",
    team: "demon",
    firstNightReminder:
      'Declare that "The Leviathan is in play." Mark the Leviathan with the *DAY 1* reminder. :reminder:',
    otherNightReminder:
      'Optionally, declare that "The Leviathan is in play." Replace the reminder token. :reminder:',
    reminders: [
      "Day 1",
      "Day 2",
      "Day 3",
      "Day 4",
      "Day 5",
      "Good Player Executed",
    ],
    setup: false,
    ability:
      "If more than 1 good player is executed, evil wins. All players know you are in play. After day 5, evil wins.",
    firstNight: 70,
    otherNight: 88,
    jinxes: [
      {
        id: "soldier",
        reason:
          "If Leviathan nominates and executes the Soldier, the Soldier does not die.",
      },
      {
        id: "monk",
        reason:
          "If Leviathan nominates and executes the player the Monk chose, that player does not die.",
      },
      {
        id: "innkeeper",
        reason:
          "If Leviathan nominates and executes a player the Innkeeper chose, that player does not die.",
      },
      {
        id: "ravenkeeper",
        reason:
          "If Leviathan is in play & the Ravenkeeper dies by execution, they wake that night to use their ability. They are drunk if their nominator was good.",
      },
      {
        id: "banshee",
        reason:
          "If Leviathan is in play, and the Banshee dies by execution, all players learn that the Banshee has died, and the Banshee gains their ability.",
      },
      {
        id: "sage",
        reason:
          "If Leviathan is in play & the Sage dies by execution, they wake that night to use their ability. They are drunk if their nominator was good.",
      },
      {
        id: "farmer",
        reason:
          "If Leviathan is in play & a Farmer dies by execution, a good player becomes a Farmer that night.",
      },
      {
        id: "mayor",
        reason:
          "If Leviathan is in play & no execution occurs on day 5, good wins.",
      },
      {
        id: "hatter",
        reason:
          "If the Hatter dies on or after day 5, the Demon cannot choose Leviathan.",
      },
      {
        id: "pithag",
        reason: "After day 5, the Pit-Hag cannot choose Leviathan.",
      },
    ],
  },
  {
    id: "riot",
    name: "Riot",
    edition: "",
    team: "demon",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: true,
    ability:
      "Nominees die, but may nominate again immediately (on day 3, they must). After day 3, evil wins. [All Minions are Riot]",
    special: [
      {
        type: "selection",
        name: "bag-duplicate",
      },
    ],
    firstNight: 0,
    otherNight: 0,
    jinxes: [
      {
        id: "engineer",
        reason:
          "Riot and the Engineer can not both be in play at the start of the game. If the Engineer creates Riot, the evil players become Riot.",
      },
      {
        id: "golem",
        reason: "If the Golem nominates Riot, the Riot player does not die.",
      },
      {
        id: "snitch",
        reason:
          "If the Snitch is in play, each Riot player gets an extra 3 bluffs.",
      },
      {
        id: "saint",
        reason:
          "If a good player nominates and kills the Saint, the Saint's team loses.",
      },
      {
        id: "butler",
        reason: "The Butler can not nominate their master.",
      },
      {
        id: "pithag",
        reason:
          "If the Pit-Hag creates Riot, all evil players become Riot. If the Pit-Hag creates Riot after day 3, the game continues for one more day.",
      },
      {
        id: "mayor",
        reason:
          "If the 3rd day begins with just three players alive, the players may choose (as a group) not to nominate at all. If so (and a Mayor is alive) then the Mayor's team wins.",
      },
      {
        id: "monk",
        reason:
          "If a Riot player nominates and kills the Monk-protected-player, the Monk-protected-player does not die.",
      },
      {
        id: "farmer",
        reason:
          "If a Riot player nominates and kills a Farmer, the Farmer uses their ability tonight.",
      },
      {
        id: "innkeeper",
        reason:
          "If a Riot player nominates an Innkeeper-protected-player, the Innkeeper-protected-player does not die.",
      },
      {
        id: "sage",
        reason:
          "If a Riot player nominates and kills a Sage, the Sage uses their ability tonight.",
      },
      {
        id: "banshee",
        reason:
          "If Riot nominates and kills the Banshee, all players learn that the Banshee has died, and the Banshee may nominate two players immediately.",
      },
      {
        id: "ravenkeeper",
        reason:
          "If a Riot player nominates and kills the Ravenkeeper, the Ravenkeeper uses their ability tonight.",
      },
      {
        id: "soldier",
        reason:
          "If a Riot player nominates the Soldier, the Soldier does not die.",
      },
      {
        id: "grandmother",
        reason:
          "If a Riot player nominates and kills the Grandchild, the Grandmother dies too.",
      },
      {
        id: "king",
        reason:
          "If a Riot player nominates and kills the King and the Choirboy is alive, the Choirboy uses their ability tonight.",
      },
      {
        id: "exorcist",
        reason: "Only 1 jinxed character can be in play.",
      },
      {
        id: "minstrel",
        reason: "Only 1 jinxed character can be in play.",
      },
      {
        id: "flowergirl",
        reason: "Only 1 jinxed character can be in play.",
      },
      {
        id: "undertaker",
        reason:
          "Players that die by nomination register as being executed to the Undertaker.",
      },
      {
        id: "cannibal",
        reason:
          "Players that die by nomination register as being executed to the Cannibal.",
      },
      {
        id: "pacifist",
        reason:
          "Players that die by nomination register as being executed to the Pacifist.",
      },
      {
        id: "devilsadvocate",
        reason:
          "Players that die by nomination register as being executed to the Devil's Advocate.",
      },
      {
        id: "investigator",
        reason: "Riot registers as a Minion to the Investigator.",
      },
      {
        id: "clockmaker",
        reason: "Riot registers as a Minion to the Clockmaker.",
      },
      {
        id: "towncrier",
        reason: "Riot registers as a Minion to the Town Crier.",
      },
      {
        id: "damsel",
        reason: "Riot registers as a Minion to the Damsel.",
      },
      {
        id: "preacher",
        reason: "Riot registers as a Minion to the Preacher.",
      },
      {
        id: "hatter",
        reason:
          "If the Hatter dies, Riot is in play and a Riot chooses a different Demon, a normal evil team is created from the Riot players. If the Hatter dies and the Demon chooses Riot, Minions become Riot too.",
      },
      {
        id: "zealot",
        reason: "If you are nominated, you must nominate again, even if dead.",
      },
    ],
  },
  {
    id: "gangster",
    name: "Gangster",
    edition: "",
    team: "traveler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "Once per day, you may choose to kill an alive neighbor, if your other alive neighbor agrees.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "organgrinder",
    name: "Organ Grinder",
    edition: "",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["About To Die"],
    setup: false,
    ability:
      "All players keep their eyes closed when voting & the vote tally is secret. Votes for you only count if you vote.",
    special: [
      {
        type: "vote",
        name: "hidden",
      },
    ],
    firstNight: 0,
    otherNight: 0,
    jinxes: [
      {
        id: "butler",
        reason:
          "If the Organ Grinder is causing eyes closed voting, the Butler may raise their hand to vote but their vote is only counted if their master voted too.",
      },
      {
        id: "minstrel",
        reason:
          "If the Minstrel makes everyone drunk, the Organ Grinder keeps their ability but the Minstrel keeps their eyes open when voting.",
      },
      {
        id: "preacher",
        reason:
          "If the Preacher removes the Organ Grinder ability, the Organ Grinder keeps their ability but the Preacher keeps their eyes open when voting.",
      },
    ],
  },
  {
    id: "vizier",
    name: "Vizier",
    team: "minion",
    edition: "",
    firstNightReminder: "Announce the Vizier player to the group.",
    reminders: [],
    setup: false,
    ability:
      "All players know who you are. You can not die during the day. If good voted, you may choose to execute immediately.",
    firstNight: 71,
    otherNight: 0,
    jinxes: [
      {
        id: "investigator",
        reason:
          "If the Investigator learns that the Vizier is in play, the existence of the Vizier is not announced by the Storyteller.",
      },
      {
        id: "preacher",
        reason:
          "If the Vizier loses their ability, they learn this. If the Vizier is executed while they have their ability, their team wins.",
      },
      {
        id: "courtier",
        reason:
          "If the Vizier loses their ability, they learn this. If the Vizier is executed while they have their ability, their team wins.",
      },
      {
        id: "alchemist",
        reason:
          "If the Alchemist has the Vizier ability, they may only choose to execute immediately if three or more players voted, regardless of those players' alignment.",
      },
      {
        id: "magician",
        reason:
          "If the Vizier and Magician are both in play, the Demon does not learn the Minions.",
      },
      {
        id: "fearmonger",
        reason:
          "The Vizier wakes with the Fearmonger, learns who they choose and cannot choose to immediately execute that player.",
      },
      {
        id: "politician",
        reason: "The Politician might register as evil to the Vizier.",
      },
      {
        id: "alsaahir",
        reason:
          "If the Vizier is in play, the Alsaahir must also guess which Demon(s) are in play.",
      },
      {
        id: "zealot",
        reason: "The Zealot might register as evil to the Vizier.",
      },
    ],
  },
  {
    id: "knight",
    name: "Knight",
    team: "townsfolk",
    edition: "",
    firstNightReminder: "Point to the two non-Demon players marked *KNOW*.",
    reminders: ["Know", "Know"],
    setup: false,
    ability: "You start knowing 2 players that are not the Demon.",
    firstNight: 55,
    otherNight: 0,
  },
  {
    id: "steward",
    name: "Steward",
    team: "townsfolk",
    edition: "",
    firstNightReminder: "Point to the good player marked *KNOW*.",
    reminders: ["Know"],
    setup: false,
    ability: "You start knowing 1 good player.",
    firstNight: 54,
    otherNight: 0,
  },
  {
    id: "highpriestess",
    name: "High Priestess",
    team: "townsfolk",
    edition: "",
    firstNightReminder: "Point to a player.",
    otherNightReminder: "Point to a player.",
    reminders: [],
    setup: false,
    ability:
      "Each night, learn which player the Storyteller believes you should talk to most.",
    firstNight: 65,
    otherNight: 83,
  },
  {
    id: "harpy",
    name: "Harpy",
    team: "minion",
    edition: "",
    firstNightReminder:
      "The Harpy chooses two players. :reminder: :reminder: Put the Harpy to sleep. Wake the 1st target. Show the *THIS CHARACTER SELECTED YOU* token, the Harpy token, then point to the 2nd target.",
    otherNightReminder:
      "The Harpy chooses two players. :reminder: :reminder: Put the Harpy to sleep. Wake the 1st target. Show the *THIS CHARACTER SELECTED YOU* token, the Harpy token, then point to the 2nd target.",
    reminders: ["Mad", "2nd"],
    setup: false,
    ability:
      "Each night, choose 2 players: tomorrow, the 1st player is mad that the 2nd is evil, or one or both might die.",
    firstNight: 36,
    otherNight: 23,
  },
  {
    id: "plaguedoctor",
    name: "Plague Doctor",
    team: "outsider",
    edition: "",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["Storyteller Ability"],
    setup: false,
    ability: "If you die, the Storyteller gains a Minion ability.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "shugenja",
    name: "Shugenja",
    team: "townsfolk",
    edition: "",
    firstNightReminder: "Point clockwise or anticlockwise around the circle.",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    ability:
      "You start knowing if your closest evil player is clockwise or anti-clockwise. If equidistant, this info is arbitrary.",
    firstNight: 58,
    otherNight: 0,
  },
  {
    id: "ojo",
    name: "Ojo",
    team: "demon",
    edition: "",
    firstNightReminder: "",
    otherNightReminder: "The Ojo chooses a character. :reminder: ",
    reminders: ["Dead"],
    setup: false,
    ability:
      "Each night*, choose a character: they die. If they are not in play, the Storyteller chooses who dies.",
    firstNight: 0,
    otherNight: 41,
  },
  {
    id: "hatter",
    name: "Hatter",
    team: "outsider",
    edition: "",
    firstNightReminder: "",
    otherNightReminder:
      "If the Hatter died today or tonight, wake Minions and Demons, allow them to choose new characters.",
    reminders: ["Tea Party Tonight"],
    setup: false,
    ability:
      "If you died today or tonight, the Minion & Demon players may choose new Minion & Demon characters to be.",
    firstNight: 0,
    otherNight: 51,
  },
  {
    id: "kazali",
    name: "Kazali",
    team: "demon",
    edition: "",
    firstNightReminder: "Wake the Kazali, allow them to choose Minions.",
    otherNightReminder: "The Kazali chooses a player. :reminder: ",
    reminders: ["Dead"],
    setup: true,
    ability:
      "Each night*, choose a player: they die. [You choose which players are which Minions. -? to +? Outsiders]",
    firstNight: 3,
    otherNight: 46,
    jinxes: [
      {
        id: "bountyhunter",
        reason:
          "An evil Townsfolk is only created if the Bounty Hunter is still in play after the Kazali acts.",
      },
      {
        id: "goon",
        reason:
          "If the Kazali chooses the Goon to become a Minion, remaining Minion choices are decided by the Storyteller.",
      },
      {
        id: "marionette",
        reason:
          "If the Kazali chooses to create a Marionette, they must choose one of their neighbors.",
      },
      {
        id: "huntsman",
        reason:
          "If the Kazali chooses the Damsel to become a Minion, and a Huntsman is in play, a good player becomes the Damsel.",
      },
      {
        id: "choirboy",
        reason:
          "The Kazali can not choose the King to become a Minion if a Choirboy is in play.",
      },
      {
        id: "soldier",
        reason:
          "If the Kazali turns the Soldier into a Minion, the Soldier chooses which not-in-play Minion to become.",
      },
    ],
  },
  {
    id: "villageidiot",
    name: "Village Idiot",
    team: "townsfolk",
    edition: "",
    firstNightReminder:
      "Choose a Village Idiot to be drunk. Wake the Village Idiots one at a time, they choose a player, show either good or evil thumbs according to the alignment of that player.",
    otherNightReminder:
      "Wake the Village Idiots one at a time, they choose a player, show either good or evil thumbs according to the alignment of that player.",
    reminders: ["Drunk"],
    setup: true,
    ability:
      "Each night, choose a player: you learn their alignment. [+0 to +2 Village Idiots. 1 of the extras is drunk]",
    special: [
      {
        type: "selection",
        name: "bag-duplicate",
      },
    ],
    firstNight: 59,
    otherNight: 76,
  },
  {
    id: "yaggababble",
    name: "Yaggababble",
    team: "demon",
    edition: "",
    firstNightReminder:
      "Choose a secret phrase. Wake the Yaggababble and let them know their secret phrase.",
    otherNightReminder:
      "For each time the Yaggababble said the phrase today, you may choose a player. They die. :reminder:",
    reminders: ["Dead", "Dead", "Dead"],
    setup: false,
    ability:
      "You start knowing a secret phrase. For each time you said it publicly today, a player might die.",
    firstNight: 12,
    otherNight: 45,
    jinxes: [
      {
        id: "exorcist",
        reason:
          "If the Exorcist chooses the Yaggababble, the Yaggababble ability does not kill tonight.",
      },
    ],
  },
  {
    id: "summoner",
    name: "Summoner",
    team: "minion",
    edition: "",
    firstNightReminder:
      "Show the *THESE CHARACTERS ARE NOT IN PLAY* token. Show 3 not-in-play good character tokens.",
    otherNightReminder:
      "Change the Summoner reminder token to the relevant night. If it is night 3, the Summoner chooses a player and a Demon. Put the Summoner to sleep. Wake the chosen player. Show the *YOU ARE* token, a thumbs down and the chosen Demon token.",
    reminders: ["Night 1", "Night 2", "Night 3"],
    setup: true,
    ability:
      "You get 3 bluffs. On the 3rd night, choose a player: they become an evil Demon of your choice. [No Demon]",
    firstNight: 17,
    otherNight: 26,
    jinxes: [
      {
        id: "clockmaker",
        reason:
          "If the Summoner is in play, the Clockmaker does not receive their information until a Demon is created.",
      },
      {
        id: "alchemist",
        reason:
          "If there is an Alchemist-Summoner in play, the game starts with a Demon in play, as normal. If the Alchemist-Summoner chooses a player, they make that player a Demon but do not change their alignment.",
      },
      {
        id: "poppygrower",
        reason:
          "If the Poppy Grower is alive when the Summoner acts, the Summoner chooses which Demon, but the Storyteller chooses which player.",
      },
      {
        id: "marionette",
        reason:
          "The Marionette neighbors the Summoner. The Summoner knows who the Marionette is.",
      },
      {
        id: "pithag",
        reason:
          "The Summoner cannot create an in-play Demon. If the Summoner creates a not-in-play Demon, deaths tonight are arbitrary.",
      },
      {
        id: "hatter",
        reason:
          "The Summoner cannot create an in-play Demon. If the Summoner creates a not-in-play Demon, deaths tonight are arbitrary.",
      },
      {
        id: "courtier",
        reason:
          "If the Summoner is drunk on the 3rd night, the Summoner chooses which Demon, but the Storyteller chooses which player.",
      },
      {
        id: "engineer",
        reason:
          "If the Engineer removes a Summoner from play before that Summoner uses their ability, the Summoner uses their ability immediately.",
      },
      {
        id: "zombuul",
        reason:
          "If the Summoner turns a dead player into the Zombuul, the Storyteller treats that player as a Zombuul that has died once.",
      },
      {
        id: "pukka",
        reason:
          "The Summoner may choose a player to become the Pukka on the 2nd night.",
      },
      {
        id: "riot",
        reason: "If the Summoner creates Riot, all Minions also become Riot.",
      },
      {
        id: "legion",
        reason:
          "If the Summoner creates Legion, most players (including all evil players) become evil Legion.",
      },
      {
        id: "kazali",
        reason:
          "The Summoner cannot create an in-play Demon. If the Summoner creates a not-in-play Demon, deaths tonight are arbitrary.",
      },
      {
        id: "preacher",
        reason:
          "If the Preacher chose the Summoner on or before the 3rd night, the Summoner chooses which Demon, but the Storyteller chooses which player.",
      },
      {
        id: "lordoftyphon",
        reason:
          "If the Summoner creates a Lord of Typhon, the Lord of Typhon must neighbor a Minion. The other neighbor becomes a not-in-play evil Minion.",
      },
    ],
  },
  {
    id: "banshee",
    name: "Banshee",
    team: "townsfolk",
    edition: "",
    firstNightReminder: "",
    otherNightReminder:
      "If the Banshee was killed by the Demon tonight, announce to all players that the Banshee has died. :reminder:",
    reminders: ["Has Ability"],
    setup: false,
    ability:
      "If the Demon kills you, all players learn this. From now on, you may nominate twice per day and vote twice per nomination.",
    firstNight: 0,
    otherNight: 55,
  },
  {
    id: "ogre",
    name: "Ogre",
    team: "outsider",
    edition: "",
    firstNightReminder: "The Ogre points to a player. :reminder:",
    reminders: ["Friend"],
    setup: false,
    ability:
      "On your 1st night, choose a player (not yourself): you become their alignment (you don't know which) even if drunk or poisoned.",
    firstNight: 64,
    otherNight: 0,
    jinxes: [
      {
        id: "recluse",
        reason:
          "If the Recluse registers as evil to the Ogre, the Ogre learns that they are evil.",
      },
    ],
  },
  {
    id: "alsaahir",
    name: "Alsaahir",
    team: "townsfolk",
    edition: "",
    reminders: [],
    setup: false,
    ability:
      "Once per day, if you publicly guess which players are Minion(s) and which are Demon(s), good wins.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "zealot",
    name: "Zealot",
    team: "outsider",
    edition: "",
    reminders: [],
    setup: false,
    ability:
      "If there are 5 or more players alive, you must vote for every nomination.",
    firstNight: 0,
    otherNight: 0,
  },
  {
    id: "lordoftyphon",
    name: "Lord of Typhon",
    team: "demon",
    edition: "",
    firstNightReminder:
      "Replace neighbors of the Lord of Typhon with Minions, wake them, tell them their new alignment and character, then do minion info.",
    otherNightReminder: "The Lord of Typhon chooses a player. :reminder:",
    reminders: ["Dead"],
    setup: true,
    ability:
      "Each night*, choose a player: they die. [Evil characters are in a line. You are in the middle. +1 Minion. -? to +? Outsiders]",
    firstNight: 2,
    otherNight: 39,
  },
  {
    id: "boffin",
    name: "Boffin",
    team: "minion",
    edition: "",
    firstNightReminder:
      "Wake the Boffin and the Demon. Show the not-in-play good character token. Put the Boffin and the Demon to sleep.",
    reminders: [],
    setup: false,
    ability:
      "The Demon (even if drunk or poisoned) has a not-in-play good character’s ability. You both know which.",
    firstNight: 8,
    otherNight: 0,
    jinxes: [
      {
        id: "heretic",
        reason: "The Demon cannot have the Heretic ability.",
      },
      {
        id: "cultleader",
        reason:
          "If the Demon has the Cult Leader ability, they can’t turn good due to this ability.",
      },
      {
        id: "goon",
        reason:
          "If the Demon has the Goon ability, they can’t turn good due to this ability.",
      },
      {
        id: "ogre",
        reason: "The Demon cannot have the Ogre ability.",
      },
      {
        id: "politician",
        reason: "The Demon cannot have the Politician ability.",
      },
      {
        id: "drunk",
        reason:
          "If the Demon would have the Drunk ability, the Boffin chooses a Townsfolk player to have this ability instead.",
      },
      {
        id: "alchemist",
        reason:
          "If the Alchemist has the Boffin ability, the Alchemist does not learn what ability the Demon has.",
      },
      {
        id: "villageidiot",
        reason:
          "If there is a spare token, the Boffin can give the Demon the Village Idiot ability.",
      },
    ],
  },
  {
    id: "doomsayer",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    name: "Doomsayer",
    team: "fabled",
    edition: "fabled",
    ability:
      "If 4 or more players live, each living player may publicly choose (once per game) that a player of their own alignment dies.",
  },
  {
    id: "angel",
    firstNight: 1,
    firstNightReminder:
      'Announce which players are protected by the Angel. Add the "Protected" token to the relevant players.',
    otherNightReminder: "",
    reminders: ["Protected", "Protected", "Something Bad"],
    setup: false,
    name: "Angel",
    team: "fabled",
    edition: "fabled",
    ability:
      "Something bad might happen to whoever is most responsible for the death of a new player.",
  },
  {
    id: "buddhist",
    firstNight: 1,
    firstNightReminder: "Declare which players are affected by the Buddhist.",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    name: "Buddhist",
    team: "fabled",
    edition: "fabled",
    ability:
      "For the first 2 minutes of each day, veteran players may not talk.",
  },
  {
    id: "hellslibrarian",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["Something Bad"],
    setup: false,
    name: "Hell's Librarian",
    team: "fabled",
    edition: "fabled",
    ability:
      "Something bad might happen to whoever talks when the Storyteller has asked for silence.",
  },
  {
    id: "revolutionary",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["Register Falsely?", "Aligned", "Aligned"],
    setup: false,
    name: "Revolutionary",
    team: "fabled",
    edition: "fabled",
    ability:
      "2 neighboring players are known to be the same alignment. Once per game, 1 of them registers falsely.",
  },
  {
    id: "fiddler",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    name: "Fiddler",
    team: "fabled",
    edition: "fabled",
    ability:
      "Once per game, the Demon secretly chooses an opposing player: all players choose which of these 2 players win.",
    special: [
      {
        name: "pointing",
        type: "ability",
        time: "day",
      },
    ],
  },
  {
    id: "toymaker",
    firstNight: 1,
    firstNightReminder:
      "Resolve the Minion Info and Demon Info steps even though there are fewer than 7 players.",
    otherNight: 1,
    otherNightReminder:
      "If it is a night when a Demon attack could end the game, and the Demon is marked “Final night: No Attack,” then the Demon does not act tonight. (Do not wake them.)",
    reminders: ["Final Night: No Attack"],
    setup: false,
    name: "Toymaker",
    team: "fabled",
    edition: "fabled",
    ability:
      "The Demon may choose not to attack & must do this at least once per game. Evil players get normal starting info.",
  },
  {
    id: "fibbin",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["No Ability"],
    setup: false,
    name: "Fibbin",
    team: "fabled",
    edition: "fabled",
    ability: "Once per game, 1 good player might get incorrect information.",
  },
  {
    id: "duchess",
    firstNightReminder: "",
    otherNight: 1,
    otherNightReminder:
      "Wake each player marked “Visitor” or “False Info” one at a time. Show them the Duchess token, then fingers (1, 2, 3) equaling the number of evil players marked “Visitor” or, if you are waking the player marked “False Info,” show them any number of fingers except the number of evil players marked “Visitor.”",
    reminders: ["Visitor", "Visitor", "False Info"],
    setup: false,
    name: "Duchess",
    team: "fabled",
    edition: "fabled",
    ability:
      "Each day, 3 players may choose to visit you. At night*, each visitor learns how many visitors are evil, but 1 gets false info.",
  },
  {
    id: "sentinel",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: true,
    name: "Sentinel",
    team: "fabled",
    edition: "fabled",
    ability: "There might be 1 extra or 1 fewer Outsider in play.",
  },
  {
    id: "spiritofivory",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: ["No More Evil"],
    setup: false,
    name: "Spirit of Ivory",
    team: "fabled",
    edition: "fabled",
    ability: "There can't be more than 1 extra evil player.",
  },
  {
    id: "djinn",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    name: "Djinn",
    team: "fabled",
    edition: "fabled",
    ability: "Use the Djinn's special rule. All players know what it is.",
  },
  {
    id: "stormcatcher",
    firstNight: 1,
    firstNightReminder:
      'At the start of the night, announce which character is favoured by the Storm Catcher. If that character is in play, mark that player as "Safe". Wake each evil player and show them the character token, then the marked player.\n If not in play, wake each evil player, show them the "These Characters Are Not In Play" info token and the relevant character token.',
    otherNightReminder: "",
    reminders: ["Safe"],
    setup: false,
    name: "Storm Catcher",
    team: "fabled",
    edition: "fabled",
    ability:
      "Name a good character. If in play, they can only die by execution, but evil players learn which player it is.",
  },
  {
    id: "gardener",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    name: "Gardener",
    team: "fabled",
    edition: "fabled",
    ability: "The Storyteller assigns 1 or more players' characters.",
    special: [
      {
        name: "distribute-roles",
        type: "ability",
        time: "pregame",
      },
    ],
  },
  {
    id: "bootlegger",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    name: "Bootlegger",
    team: "fabled",
    edition: "fabled",
    ability: "This script has homebrew characters or rules.",
  },
  {
    id: "ferryman",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    setup: false,
    name: "Ferryman",
    team: "fabled",
    edition: "fabled",
    ability: "On the final day, all dead players regain their vote token.",
    special: [
      {
        name: "ghost-votes",
        type: "ability",
        time: "day",
      },
    ],
  },
];

const fs = require("fs");

const reminders = [];
const abilities = [];

for (const role of roles) {
  const role_id = role.name.toLowerCase().replace(/ /g, "_").replace(/'/g, "");

  if (role.reminders) {
    for (reminder of role.reminders) {
      reminders.push({
        role_id,
        reminder,
      });
    }
  }

  if (role.ability) {
    abilities.push({
      role_id,
      ability: role.ability,
    });
  }
}

fs.writeFileSync("./reminders.json", JSON.stringify(reminders, null, 2));
fs.writeFileSync("./abilities.json", JSON.stringify(abilities, null, 2));
