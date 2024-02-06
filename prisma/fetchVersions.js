const { workerData, parentPort } = require("worker_threads");

const axios = require("axios");
const cheerio = require("cheerio");

async function main() {
  const response = await axios.get(workerData);
  const $ = cheerio.load(response.data);
  // const description = $("div#notes").text();
  const versions = [];
  $("select[name=selected_version] option").each((index, element) => {
    const version = $(element).text().trim();
    versions.push(version);
  });

  parentPort.postMessage({ versions });
}

main().catch(() => {
  parentPort.postMessage({ versions: [] });
});
