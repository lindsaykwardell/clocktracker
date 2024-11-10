import { faker } from "@faker-js/faker";
import roleNames from "./role_names.json";

const roles = roleNames.filter(
  (role) => !role.toLowerCase().includes("legacy")
);

export function generateName() {
  console.log(roles);
  const randomRole =
    roles[Math.floor(Math.random() * roles.length)] || "Traveler";
  const adjective = faker.word.adjective();

  const username = faker.internet.username({
    firstName: adjective,
    lastName: randomRole,
  });
  const display_name =
    adjective.charAt(0).toUpperCase() + adjective.slice(1) + " " + randomRole;

  return {
    username,
    display_name,
    randomRole,
  };
}

export function generateUsers(count: number) {
  const fakeMembers = [];

  for (let i = 0; i < count; i++) {
    const randomName = generateName();

    fakeMembers.push({
      username: "anonymous",
      display_name: randomName.display_name,
      avatar: `/img/role/${randomName.randomRole
        .toLowerCase()
        .replace(/ /g, "")
        .replace(/'/g, "")
        .replace(/-/g, "")}.png`,
      pronouns: "they/them",
      bio: "This user is anonymous.",
      location: "Unknown",
      privacy: "PUBLIC",
      charts: [],
    });
  }

  return fakeMembers;
}
