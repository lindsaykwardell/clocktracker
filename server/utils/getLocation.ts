import { City, PrismaClient } from "@prisma/client";
const URL = "https://photon.komoot.io/api/";

const prisma = new PrismaClient();

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

type Feature = {
  geometry: {
    coordinates: [number, number];
    type: "Point";
  };
  type: "Feature";
  properties: {
    osm_type: string;
    osm_id: number;
    extent: [number, number, number, number];
    country: string;
    osm_key: string;
    countrycode: string;
    osm_value: string;
    name: string;
    county: string;
    state: string;
    type: string;
  };
};

export default {
  byName: async (name: string): Promise<City[]> => {
    const response = await fetch(`${URL}?q=${name}&layer=city`);
    const data: FeatureCollection = await response.json();

    let result: City[] = [];

    for (const feature of data.features) {
      let name = feature.properties.name;
      if (feature.properties.state) {
        name += `, ${feature.properties.state}`;
      }
      if (feature.properties.country) {
        name += `, ${feature.properties.country}`;
      }

      const city = await prisma.city.upsert({
        where: {
          id: feature.properties.osm_id.toString(),
        },
        update: {
          name,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
        },
        create: {
          id: feature.properties.osm_id.toString(),
          name,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
        },
      });

      result.push(city);
    }

    return result;
  },
};
