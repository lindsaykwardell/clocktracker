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
  {
    id: "wraith",
    name: "Wraith",
    edition: "",
    team: "minion",
    firstNightReminder: "",
    otherNightReminder: "",
    reminders: [],
    ability:
      "You may choose to open your eyes at night. You wake when other evil players do.",
    flavor:
      "Ra'āb ina pān ṣilli ša dāri. Rigim qallu ina šūri, šītu ša šunātīka iredde, u napšutka idlul ina pān maṣṣartī dāriti.”",
    setup: false,
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

  const image_name = name
    .toLowerCase()
    .replace(/ /g, "")
    .replace(/'/g, "")
    .replace(/-/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "");

  const token_url = `/img/role/${image_name}.png`;
  const alternate_token_urls = [];

  // Check the image folder to see if the alternate images exist
  const alternate_image_names = [`${image_name}_g`, `${image_name}_e`];
  for (const alternate_image_name of alternate_image_names) {
    const alternate_image_path = path.join(
      __dirname,
      `../public/img/role/${alternate_image_name}.webp`
    );
    if (fs.existsSync(alternate_image_path)) {
      alternate_token_urls.push(`/img/role/${alternate_image_name}.webp`);
    }
  }

  // Sort the alternate images to match the order of alternate_image_names

  alternate_token_urls.sort((a, b) => {
    const a_name = a.split("/").pop().split(".")[0];
    const b_name = b.split("/").pop().split(".")[0];
    return (
      alternate_image_names.indexOf(a_name) -
      alternate_image_names.indexOf(b_name)
    );
  });

  return {
    id,
    name,
    type,
    initial_alignment: alignment,
    ability: abilities.find((ability) => ability.role_id === id)?.ability || "",
    token_url,
    alternate_token_urls,
  };
}

const roles = [
  ...townsfolk.map((role) => toRole(role, RoleType.TOWNSFOLK, Alignment.GOOD)),
  ...outsiders.map((role) => toRole(role, RoleType.OUTSIDER, Alignment.GOOD)),
  ...minions.map((role) => toRole(role, RoleType.MINION, Alignment.EVIL)),
  ...demons.map((role) => toRole(role, RoleType.DEMON, Alignment.EVIL)),
  ...travelers.map((role) =>
    toRole(role, RoleType.TRAVELER, Alignment.NEUTRAL)
  ),
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
