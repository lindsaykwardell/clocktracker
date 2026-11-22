// Builds the character token images the app serves, from the official
// images in resources/characters (a copy of botc-release's
// resources/characters folder, with its edition subfolders).
//
//   npm run images:roles            only new or changed images
//   npm run images:roles -- --force every image
//
// Writes webp files in three sizes into public/img/role/{48x48,80x80,160x160}/,
// all flat (the subfolders are only for keeping the source tidy). It never
// deletes: images the source doesn't have (acrobatlegacy, stormcatcher_old,
// storyteller, ...) stay as they are.
//
// Names: the source has "imp_e" and "imp_g" (evil and good art) and a plain
// name only for some characters (Travellers, Fabled, Loric, the generic
// images). The app asks for the plain name for a character's own side and a
// suffix for the other side, so for a character without a plain image this
// also writes the plain name from its own side ("imp_e" -> "imp").
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const sourceDir = path.join(root, "resources/characters");
const outputDir = path.join(root, "public/img/role");
const SIZES = [48, 80, 160];
const force = process.argv.includes("--force");

// The suffix of a character's own side, by team. Travellers, Fabled and Loric
// have no own side (their plain image is in the source).
const OWN_SIDE = {
  townsfolk: "_g",
  outsider: "_g",
  minion: "_e",
  demon: "_e",
};

// Same image name as prisma/roles.js builds the token_url from.
function imageName(name) {
  return name.toLowerCase().replace(/[ '\-()]/g, "");
}

function teamsByImageName() {
  const roles = require(path.join(root, "prisma/roles.json"));
  const teams = new Map();
  for (const role of roles) teams.set(imageName(role.name), role.team);
  // The generic images ("townsfolk_e", "minion_g", ...) are named after a team.
  for (const team of ["townsfolk", "outsider", "minion", "demon"]) teams.set(team, team);
  return teams;
}

function findSources(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findSources(full));
    // Only the images: copies from Windows also bring ":Zone.Identifier" files.
    else if (entry.isFile() && /\.webp$/i.test(entry.name)) files.push(full);
  }
  return files;
}

function isUpToDate(source, output) {
  if (force || !fs.existsSync(output)) return false;
  return fs.statSync(output).mtimeMs >= fs.statSync(source).mtimeMs;
}

async function write(source, name) {
  let written = 0;
  for (const size of SIZES) {
    const output = path.join(outputDir, `${size}x${size}`, `${name}.webp`);
    if (isUpToDate(source, output)) continue;
    await sharp(source)
      // Some images aren't quite square (390x390 next to 400x400 is fine, but
      // keep any odd one centred on a transparent square, never stretched).
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90, alphaQuality: 100, effort: 6 })
      .toFile(output);
    written += 1;
  }
  return written;
}

async function main() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`No source images in ${path.relative(root, sourceDir)}.`);
    process.exit(1);
  }
  for (const size of SIZES) fs.mkdirSync(path.join(outputDir, `${size}x${size}`), { recursive: true });

  // name -> source file; the subfolders are flattened, so a name may only
  // appear once.
  const sources = new Map();
  for (const file of findSources(sourceDir)) {
    const name = path.basename(file, path.extname(file));
    if (sources.has(name)) {
      console.error(`"${name}" is in two folders:\n  ${sources.get(name)}\n  ${file}`);
      process.exit(1);
    }
    sources.set(name, file);
  }

  const teams = teamsByImageName();
  const plain = new Map();
  const unknownSide = [];
  for (const name of sources.keys()) {
    const match = /^(.*)_(e|g)$/.exec(name);
    if (!match || sources.has(match[1])) continue;
    const base = match[1];
    const own = OWN_SIDE[teams.get(base)];
    if (!own) {
      if (!unknownSide.includes(base)) unknownSide.push(base);
      continue;
    }
    const ownSource = sources.get(`${base}${own}`);
    if (ownSource) plain.set(base, ownSource);
  }

  // Homebrew characters imported without an image used to get "good" or
  // "evil" (stored in the database). Turned to the other side, the app asks
  // for "good_e" / "evil_g": show the other generic image.
  const aliases = new Map();
  if (sources.has("evil")) aliases.set("good_e", sources.get("evil"));
  if (sources.has("good")) aliases.set("evil_g", sources.get("good"));

  let written = 0;
  for (const [name, file] of sources) written += await write(file, name);
  for (const [name, file] of plain) written += await write(file, name);
  for (const [name, file] of aliases) written += await write(file, name);

  console.log(
    `${sources.size} source images, ${plain.size} plain names from their own side, ${written} files written.`
  );
  if (unknownSide.length) {
    console.log(
      `No plain name (team unknown, not in prisma/roles.json): ${unknownSide.sort().join(", ")}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
