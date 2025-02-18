const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Fetch custom scripts
  // For each script, check if it has a homebrew character with the criteria of:
  // 1. The character is a homebrew character
  // 2. The character has more than one token url
  // If it does, update the character to use the correct tokens

  const scripts = await prisma.script.findMany({
    where: {
      is_custom_script: true,
    },
  });

  for (const script of scripts) {
    if (!script.json) continue;

    const json = JSON.parse(script.json);
    const characters = json.filter((item) => item.id !== "_meta");

    for (const character of characters) {
      // The character is a custom character with multiple images
      if (typeof character !== "string" && Array.isArray(character.image)) {
        const savedRole = await prisma.role.findFirst({
          where: {
            id: character.id,
          },
        });

        if (!savedRole) continue;

        await prisma.role.update({
          where: {
            id: character.id,
          },
          data: {
            token_url: character.image[0],
            alternate_token_urls: character.image.slice(1),
          },
        });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
