import { defineCronHandler } from "#nuxt/cron";
import axios from "axios";
import { performLockedTask } from "../utils/cronLock";

const url = "https://botcscripts.com";

export default defineCronHandler(
  "daily",
  async () =>
    performLockedTask("script_import", async (prisma) => {
      async function parsePage(page: number) {
        const scriptList: {
          script_id: string;
          name: string;
          version: string;
          author: string;
          type: string;
          json_url: string;
          pdf_url: string;
        }[] = [];

        console.log(`Parsing page ${page}...`);
        const response = await axios.get<{
          count: number;
          next: string;
          previous: string;
          results: {
            pk: number;
            name: string;
            version: string;
            author: string;
          }[];
        }>(url + "/api/scripts?page=" + page);

        // Iterate over the table rows
        response.data.results.forEach((script) => {
          // Get the columns.
          // Name, Version, Author, Type, Info, Tags, Json, Pdf

          const script_id = script.pk;
          // Name and version are combined in column 1 like this: Blow My Skull (1.4.0)
          // We need to break them apart, and store the version separately without the parens.
          // Match with regex
          const name = script.name;
          const version = script.version;
          const author = script.author;
          const type = "";
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

        if (response.data.next) {
          await parsePage(page + 1);
        }
      }

      console.log("Starting script import...");
      await parsePage(1);

      console.log("Done!");
    }),
  {
    timeZone: "America/New_York",
    runOnInit: true, //process.env.NODE_ENV !== "development",
  }
);

function fullUrl(href: string) {
  return url + href;
}
