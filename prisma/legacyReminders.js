const { ReminderType } = require("../server/generated/prisma/client");

// Reminders that older versions of the catalog had, but that are no longer the
// official wording (a typo, different capitals, or an older version of the
// role). Old grimoires can still contain them, so they stay in the database,
// but as LEGACY they are hidden from the reminder dialog unless "show legacy
// reminders" is on.
//
// These are merged after the official reminders, so a legacy entry wins if a
// newer roles.json brings the old wording back.
const legacyReminders = [
  // Typos and capitalisation
  { role_id: "barista", reminder: "Sober and Healthy" },
  { role_id: "bounty_hunter", reminder: "Known" },
  { role_id: "widow", reminder: "Knows" },
  { role_id: "po", reminder: "3 attacks" },
  { role_id: "cacklejack", reminder: "NOT ME" },
  { role_id: "cacklejack", reminder: "Not me" },
  { role_id: "deus_ex_fiasco", reminder: "WHOOPSIE" },
  { role_id: "plague_doctor", reminder: "Storyteller ability" },
  // Unknown origin (not in any version of roles.json), but present in production.
  { role_id: "plague_doctor", reminder: "Duplicate" },
  { role_id: "storm_catcher", reminder: "Stormcaught" },
  // Older versions of the role
  { role_id: "cannibal", reminder: "Died Today" },
  { role_id: "lycanthrope", reminder: "Appears Evil" },
  { role_id: "balloonist", reminder: "Seen Townsfolk" },
  { role_id: "balloonist", reminder: "Seen Outsider" },
  { role_id: "balloonist", reminder: "Seen Minion" },
  { role_id: "balloonist", reminder: "Seen Demon" },
].map((reminder) => ({ ...reminder, type: ReminderType.LEGACY }));

module.exports = {
  legacyReminders,
};
