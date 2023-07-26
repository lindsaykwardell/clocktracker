import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { schedule } from "@netlify/functions";
import axios from "axios";
import cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";

const url = "https://botc-scripts.azurewebsites.net";

const myHandler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const scriptList: {
    id: number;
    name: string;
    version: string;
    author: string;
    type: string;
    json_url: string;
    pdf_url: string;
  }[] = [];

  function fullUrl(href: string) {
    return url + href;
  }

  async function parsePage(page: number) {
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

  const prisma = new PrismaClient();

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
  console.log("Done!")

  return {
    statusCode: 200,
  };
};

const handler = schedule("@daily", myHandler);

export { handler };
