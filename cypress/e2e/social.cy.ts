import { faker } from "@faker-js/faker";

describe("social features", () => {
  const user1 = {
    email: faker.internet.email(),
    password: faker.internet.password(),
    username: "",
    displayName: "",
  };
  const user2 = {
    email: faker.internet.email(),
    password: faker.internet.password(),
    username: "",
    displayName: "",
  };

  before(() => {
    // @ts-ignore
    cy.register(user1.email, user1.password);

    cy.get("h3").then(($h3) => {
      user1.displayName = $h3.text();
    });
    cy.get("h4").then(($h4) => {
      user1.username = $h4.text();
    });
    // @ts-ignore
    cy.logout();
    // @ts-ignore
    cy.register(user2.email, user2.password);

    cy.get("h3").then(($h3) => {
      user2.displayName = $h3.text();
    });
    cy.get("h4").then(($h4) => {
      user2.username = $h4.text();
    });
    // @ts-ignore
    cy.logout();
  });

  it("allows searching for a user", () => {
    // @ts-ignore
    cy.login(user2.email, user2.password);

    cy.get("a[href='/search']").click();
    cy.get("input").type(user1.displayName);
    cy.findByRole("button", { name: "Search" }).click();
    cy.findByText(user1.displayName).should("exist");
  });
});
