const { PrismaClient } = require("@prisma/client");
const data = require("./countries+states+cities.json");

const prisma = new PrismaClient();

async function main() {
  for (const country of data) {
    console.log(`Upserting country: ${country.name}`);
    await prisma.country.upsert({
      where: {
        id: country.id,
      },
      update: { id: country.id, name: country.name, code: country.iso3 },
      create: { id: country.id, name: country.name, code: country.iso3 },
    });

    for (const state of country.states) {
      console.log(`Upserting state: ${state.name}`);
      await prisma.state.upsert({
        where: {
          id: state.id,
        },
        update: {
          id: state.id,
          name: state.name,
          code: state.state_code,
          country_id: country.id,
        },
        create: {
          id: state.id,
          name: state.name,
          code: state.state_code,
          country_id: country.id,
        },
      });

      for (const city of state.cities) {
        console.log(`Upserting city: ${city.name}`);
        await prisma.city.upsert({
          where: {
            id: city.id,
          },
          update: {
            id: city.id,
            name: city.name,
            latitude: +city.latitude,
            longitude: +city.longitude,
            state_id: state.id,
            country_id: country.id,
          },
          create: {
            id: city.id,
            name: city.name,
            latitude: +city.latitude,
            longitude: +city.longitude,
            state_id: state.id,
            country_id: country.id,
          },
        });
      }
    }
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
