const { Alignment, RoleType } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const raw_roles = require("./roles.json");

function nameToId(name) {
  return name
    .toLowerCase()
    .replace(/ /g, "_")
    .replace(/\(/g, "")
    .replace(/\)/g, "")
    .replace(/'/g, "");
}

const all_raw_roles = [
  ...raw_roles,
  {
    id: "acrobat",
    name: "Acrobat (Legacy)",
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
];
const reminders = [];
const abilities = [];
const townsfolk = [];
const outsiders = [];
const minions = [];
const demons = [];
const travelers = [];
const fabled = [];

for (const role of all_raw_roles) {
  const role_id = nameToId(role.name);

  if (["minioninfo", "demoninfo", "dawn", "dusk"].includes(role.id)) {
    continue;
  }

  if (role.team === "townsfolk") {
    townsfolk.push(role.name);
  } else if (role.team === "outsider") {
    outsiders.push(role.name);
  } else if (role.team === "minion") {
    minions.push(role.name);
  } else if (role.team === "demon") {
    demons.push(role.name);
  } else if (role.team === "traveller") {
    travelers.push(role.name);
  } else if (role.team === "fabled") {
    fabled.push(role.name);
  }

  if (role.reminders) {
    for (reminder of role.reminders) {
      reminders.push({
        role_id,
        reminder,
      });
    }

    if (role.remindersGlobal) {
      for (reminder of role.remindersGlobal) {
        reminders.push({
          role_id,
          reminder,
        });
      }
    }
  }

  if (role.ability) {
    abilities.push({
      role_id,
      ability: role.ability,
    });
  }
}

const roleNames = [
  ...townsfolk,
  ...outsiders,
  ...minions,
  ...demons,
  ...travelers,
];

fs.writeFileSync(
  path.join(__dirname, "../server/utils/role_names.json"),
  JSON.stringify(roleNames, null, 2)
);

function toRole(name, type, alignment) {
  const id = nameToId(name);

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
      .replace(/-/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "")}.png`,
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
