const axios = require("axios");
const cheerio = require("cheerio");
const { PrismaClient, Alignment, RoleType } = require("@prisma/client");

const url = "https://botc-scripts.azurewebsites.net";
const prisma = new PrismaClient();

async function main() {
  const scriptList = [];

  function fullUrl(href) {
    return url + href;
  }

  async function parsePage(page) {
    console.log(`Parsing page ${page}...`);
    const response = await axios.get(url + "?page=" + page);
    const $ = cheerio.load(response.data);
    // Iterate over the table rows
    $("table tbody tr").each((index, element) => {
      // Get the columns.
      // Name, Version, Author, Type, Info, Tags, Json, Pdf
      const columns = $(element).find("td");
      const id = parseInt(
        $(columns[0]).find("a").attr("href")?.split("/")[2] ?? "",
        10
      );
      const name = $(columns[0]).text();
      const version = $(columns[1]).text();
      const author = $(columns[2]).text();
      const type = $(columns[3]).text();
      const info = $(columns[4]).text();
      const tags = $(columns[5]).text();
      const json_url = fullUrl($(columns[6]).find("a").attr("href") ?? "");
      const pdf_url = fullUrl($(columns[7]).find("a").attr("href") ?? "");

      if (!isNaN(id)) {
        scriptList.push({
          id,
          name,
          version,
          author,
          type,
          json_url,
          pdf_url,
        });
      }
    });
  }

  console.log("Starting...");
  const response = await axios.get(url + "?page=1");
  console.log("Getting count...");
  const $ = cheerio.load(response.data);
  const lastPage = parseInt($("ul.pagination li:nth-last-child(2) a").text());
  console.log(`Found ${lastPage} pages.`);
  for (let i = 1; i <= lastPage; i++) {
    await parsePage(i);
  }

  // Upsert all the scripts
  console.log("Upserting scripts...");
  for (const script of scriptList) {
    await prisma.script.upsert({
      where: {
        id: script.id,
      },
      update: script,
      create: script,
    });
  }

  const roles = [
    ...townsfolk.map((role) =>
      toRole(role, RoleType.TOWNSFOLK, Alignment.GOOD)
    ),
    ...outsiders.map((role) => toRole(role, RoleType.OUTSIDER, Alignment.GOOD)),
    ...minions.map((role) => toRole(role, RoleType.MINION, Alignment.EVIL)),
    ...demons.map((role) => toRole(role, RoleType.DEMON, Alignment.EVIL)),
    ...travelers.map((role) => toRole(role, RoleType.TRAVELER, Alignment.GOOD)),
    ...fabled.map((role) => toRole(role, RoleType.FABLED, Alignment.NEUTRAL)),
  ];

  // Upsert all the roles
  console.log("Upserting roles...");
  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        id: role.id,
      },
      update: role,
      create: role,
    });
  }

  console.log("Done!");
}

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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
