import { faker } from "@faker-js/faker";

describe("user settings", () => {
  let email: string;
  let password: string;
  before(() => {
    email = faker.internet.email();
    password = faker.internet.password();
  });

  it("registers a new user", () => {
    // @ts-ignore
    cy.register(email, password);
    cy.url().should("include", "/@");
  });
  it("logs in as the new user", () => {
    // @ts-ignore
    cy.login(email, password);
    cy.url().should("include", "/@");
  });
  it("allows updating user settings", () => {
    const pronounOptions = ["he/him", "she/her", "they/them"];
    const pronouns =
      pronounOptions[Math.floor(Math.random() * pronounOptions.length)];
    const location = faker.location.city();
    const about = faker.lorem.paragraph();

    // @ts-ignore
    cy.login(email, password);
    cy.findByText("Settings").click();
    cy.findByLabelText("Pronouns").clear().type(pronouns);
    cy.findByLabelText("Location").clear().type(location);
    cy.findByLabelText("Bio").clear().type(about);
    cy.findByRole("button", { name: "Save Settings" }).click();
    cy.findByText(pronouns).should("exist");
    cy.findByText(location).should("exist");
    cy.findByText(about).should("exist");
  });
});
