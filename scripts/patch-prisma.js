// Workaround for Prisma v7 + Playwright incompatibility
// Prisma sets globalThis['__dirname'] which tricks Playwright into CJS mode
// https://github.com/prisma/prisma/issues/28838
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "server", "generated", "prisma", "client.ts");
fs.writeFileSync(
  file,
  fs.readFileSync(file, "utf8").replace(/globalThis\['__dirname'\].*\n/, "")
);
console.log(`✔ Removed globalThis['__dirname'] from Prisma file at ${file}`);