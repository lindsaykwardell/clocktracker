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
Cypress.Commands.add("register", (email: string, password: string) => {
  const pronounOptions = ["he/him", "she/her", "they/them"];
  const pronouns =
    pronounOptions[Math.floor(Math.random() * pronounOptions.length)];
  const location = faker.location.city();

  cy.visit("/");
  cy.wait(1000)
  cy.findAllByText("Login with Email").first().click();
  cy.findByLabelText("Email").type(email);
  cy.findByLabelText("Password").type(password);
  cy.findByRole("button", { name: "Register" }).click();
  cy.findByLabelText("Pronouns").type(pronouns);
  cy.findByLabelText("Location").type(location);
  cy.findByRole("button", { name: "Save Settings" }).click();
});

// @ts-ignore
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/");
  cy.wait(1000)
  cy.findAllByText("Login with Email").first().click();
  cy.findByLabelText("Email").type(email);
  cy.findByLabelText("Password").type(password);
  cy.findByRole("button", { name: "Login" }).click();
});
