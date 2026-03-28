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
    reminder: "Demon",
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
    reminder: "Alm",
    type: ReminderType.TRACKING,
  },
  {
    role_id: "butcher",
    reminder: "Butchered",
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
    role_id: "puzzlemaster",
    reminder: "Demon",
    type: ReminderType.TRACKING,
  },
];

module.exports = {
  trackingReminders,
};
