const axios = require("axios");
const cheerio = require("cheerio");
const { PrismaClient } = require("@prisma/client");
const { Worker } = require("worker_threads");
const ProgressBar = require("progress");
const { roles, reminders } = require("./roles");

const url = "https://botcscripts.com";
const prisma = new PrismaClient();

async function main() {
  const scriptList = [];

  function fullUrl(href) {
    return url + href;
  }

  async function parsePage(page) {
    const response = await axios.get(url + "?page=" + page);
    const $ = cheerio.load(response.data);
    // Iterate over the table rows
    $("table tbody tr").each((index, element) => {
      // Get the columns.
      // Name, Version, Author, Type, Info, Tags, Json, Pdf
      const columns = $(element).find("td");
      const script_id = parseInt(
        $(columns[0]).find("a").attr("href")?.split("/")[2] ?? "",
        10
      );
      // Name and version are combined in column 1 like this: Blow My Skull (1.4.0)
      // We need to break them apart, and store the version separately without the parens.
      // Match with regex
      const name = $(columns[0])
        .text()
        .split(/\s\((\d+(\.\d+)*)\)$/)[0];
      const version = $(columns[0])
        .text()
        .split(/\s\((\d+(\.\d+)*)\)$/)[1]
        .replace("(", "")
        .replace(")", "");
      const author = $(columns[1]).text();
      const type = $(columns[2]).text();
      const json_url = fullUrl(`/script/${script_id}/${version}/download`);
      const pdf_url = fullUrl(`/script/${script_id}/${version}/download_pdf`);

      if (!isNaN(script_id)) {
        scriptList.push({
          script_id: script_id.toString(),
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
  const pageBar = new ProgressBar(":current / :total [:bar] :elapseds", {
    total: lastPage,
  });
  for (let i = 1; i <= lastPage; i++) {
    await parsePage(i);
    pageBar.tick();
  }

  // Upsert all the scripts
  console.log("Upserting scripts...");

  const upsertBar = new ProgressBar(":percent [:bar] :elapseds", {
    total: scriptList.length,
  });

  for (const script of scriptList) {
    await prisma.script.upsert({
      where: {
        script_id_version: {
          script_id: script.script_id,
          version: script.version,
        },
      },
      update: {
        ...script,
      },
      create: {
        ...script,
      },
    });

    upsertBar.tick();
  }

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

  // Upsert the reminders
  for (const reminder of reminders) {
    await prisma.roleReminder.upsert({
      where: {
        role_id_reminder: {
          role_id: reminder.role_id,
          reminder: reminder.reminder,
        },
      },
      update: reminder,
      create: reminder,
    });
  }

  console.log("Done!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
