import { defineCronHandler } from "#nuxt/cron";
import axios from "axios";
import * as cheerio from "cheerio";
import { performLockedTask } from "../utils/cronLock";

const url = "https://botcscripts.com";

export default defineCronHandler(
  "daily",
  async () =>
    performLockedTask("script_import", async (prisma) => {
      // Wait for a random amount of time

      const scriptList: {
        script_id: string;
        name: string;
        version: string;
        author: string;
        type: string;
        json_url: string;
        pdf_url: string;
      }[] = [];

      async function parsePage(page: number) {
        console.log(`Parsing page ${page}...`);
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
          const pdf_url = fullUrl(
            `/script/${script_id}/${version}/download_pdf`
          );

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

      console.log("Starting script import...");
      const response = await axios.get(url + "?page=1");
      console.log("Getting count of pages...");
      const $ = cheerio.load(response.data);
      const lastPage = parseInt(
        $("ul.pagination li:nth-last-child(2) a").text()
      );
      console.log(`Found ${lastPage} pages.`);
      for (let i = 1; i <= lastPage; i++) {
        await parsePage(i);
      }

      // Upsert all the scripts
      console.log("Upserting scripts...");

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
      }

      console.log("Done!");
    }),
  {
    timeZone: "America/New_York",
    runOnInit: process.env.NODE_ENV !== "development",
  }
);

function fullUrl(href: string) {
  return url + href;
}
