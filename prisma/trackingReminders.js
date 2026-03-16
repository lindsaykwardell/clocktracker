const { ReminderType } = require("@prisma/client");

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
    reminder: "Shown",
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
];

module.exports = {
  trackingReminders,
};
