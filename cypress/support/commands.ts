// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import "@testing-library/cypress/add-commands";
import { faker } from "@faker-js/faker";

// @ts-ignore
Cypress.Commands.add("register", (email: string, password: string, username?: string) => {
  const pronounOptions = ["he/him", "she/her", "they/them"];
  const pronouns =
    pronounOptions[Math.floor(Math.random() * pronounOptions.length)];
  const location = faker.location.city();

  cy.visit("/");
  cy.wait(1000);
  cy.findAllByText("Login").first().click();
  cy.findByLabelText("Email").type(email);
  cy.findByLabelText("Password").type(password);
  cy.findByRole("button", { name: "Register" }).click();
  if (username) {
    cy.findByLabelText("Username").clear().type(username);
  }
  cy.findByLabelText("Pronouns").type(pronouns);
  cy.findByLabelText("Location").type(location);
  cy.findByRole("button", { name: "Save Settings" }).click();
});

// @ts-ignore
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/");
  cy.wait(1000);
  cy.findAllByText("Login").first().click();
  cy.findByLabelText("Email").type(email);
  cy.findByLabelText("Password").type(password);
  cy.findByRole("button", { name: "Login" }).click();
});

// @ts-ignore
Cypress.Commands.add("logout", () => {
  cy.findByRole("link", { name: "Logout" }).click();
  cy.visit("/");
});

// @ts-ignore
Cypress.Commands.add("createGame", () => {
  cy.findByRole("link", { name: "Add Game" }).click();
  cy.url().should("include", "/add-game");
  cy.findAllByText("Select Script").first().click();
  cy.findByAltText("Trouble Brewing").click();
  cy.findByLabelText("Storyteller").type(faker.person.firstName());
  cy.findByLabelText("Community").type("Cypress");
  cy.findByLabelText("Players").type(
    (Math.floor(Math.random() * 10) + 5).toString()
  );
  cy.get(".token").first().click();
  cy.findByText("Chef").first().click();
  cy.get("textarea").type(faker.lorem.paragraph());
  cy.findByText("Save Game").click();
  cy.url().should("include", "/game/")
});
