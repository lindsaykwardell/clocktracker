const { ReminderType } = require("../server/generated/prisma/client");

const trackingReminders = [
  {
    role_id: "mayor",
    reminder: "Bounce",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "fortune_teller",
    reminder: "Yes",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "choirboy",
    reminder: "Know",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "amnesiac",
    reminder: "Bingo",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "ravenkeeper",
    reminder: "Chosen",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "dreamer",
    reminder: "Chosen",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "nightwatchman",
    reminder: "Chosen",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "high_priestess",
    reminder: "Visit",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "monk",
    reminder: "Saved",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "pacifist",
    reminder: "Saved",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "soldier",
    reminder: "Saved",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "sailor",
    reminder: "Saved",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "innkeeper",
    reminder: "Saved",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "tea_lady",
    reminder: "Saved",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "deviant",
    reminder: "Saved",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "devils_advocate",
    reminder: "Saved",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "lleech",
    reminder: "Saved",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "ojo",
    reminder: "Not in play",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "zombuul",
    reminder: "Registers as dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "gunslinger",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "beggar",
    reminder: "Vote Given",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "butcher",
    reminder: "Executed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "zenomancer",
    reminder: "Goal Completed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "big_wig",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "doomsayer",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "hells_librarian",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "puzzlemaster",
    reminder: "Know",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "fang_gu",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "fang_gu",
    reminder: "Has Jumped",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "summoner",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "pit-hag",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "politician",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "ogre",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "hatter",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "goon",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "barber",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "snake_charmer",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "huntsman",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "farmer",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "engineer",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "cult_leader",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "bounty_hunter",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "matron",
    reminder: "Swapped",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "imp",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "kazali",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "lord_of_typhon",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "riot",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "cacklejack",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "scarlet_woman",
    reminder: "Changed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "virgin",
    reminder: "Executed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "cerenovus",
    reminder: "Executed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "mutant",
    reminder: "Executed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "scapegoat",
    reminder: "Executed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "vizier",
    reminder: "Executed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "judge",
    reminder: "Executed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "judge",
    reminder: "Execution Failed",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "psychopath",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "harpy",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "godfather",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "golem",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "gangster",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "gnome",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "slayer",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "boomdandy",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "riot",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "al-hadikhia",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "angel",
    reminder: "Dead",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "al-hadikhia",
    reminder: "Alive",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "hindu",
    reminder: "Reincarnated",
    type: ReminderType.TRACKING,
  },
];

module.exports = {
  trackingReminders,
};
