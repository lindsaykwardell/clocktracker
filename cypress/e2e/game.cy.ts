import { faker } from "@faker-js/faker";

describe("games", () => {
  let email: string;
  let password: string;
  before(() => {
    email = faker.internet.email();
    password = faker.internet.password();

    // @ts-ignore
    cy.register(email, password);
    // @ts-ignore
    cy.logout();
  });

  it("can add a new game", () => {
    const storyteller = faker.person.firstName();

    // @ts-ignore
    cy.login(email, password);

    cy.findByText("Add Game").click();
    cy.findAllByText("Select Script").first().click();
    cy.findByAltText("Trouble Brewing").click();
    cy.findByLabelText("Storyteller").type(storyteller);
    cy.findByLabelText("Community").type("Cypress");
    cy.findByLabelText("Players").type(
      (Math.floor(Math.random() * 10) + 5).toString()
    );
    cy.get(".token").first().click();
    cy.get(".token[data-role-id='chef']").first().click();
    cy.get("textarea").type(faker.lorem.paragraph());
    cy.findByText("Save Game").click();
    // Verify that the game was added by URL
    cy.url().should("include", "/game/");
    // Check that the token is displayed
    cy.get(".token[data-role-id='chef']").should("exist");
  });

  it("can add a new game with a related role", () => {
    const storyteller = faker.person.firstName();

    // @ts-ignore
    cy.login(email, password);

    cy.findByText("Add Game").click();
    cy.findAllByText("Select Script").first().click();
    cy.findByAltText("Trouble Brewing").click();
    cy.findByLabelText("Storyteller").type(storyteller);
    cy.findByLabelText("Community").type("Cypress");
    cy.findByLabelText("Players").type(
      (Math.floor(Math.random() * 10) + 5).toString()
    );
    cy.get(".token").first().click();
    cy.get(".token[data-role-id='drunk']").first().click();
    cy.get(".token.related").first().click();
    cy.get(".token[data-role-id='empath']").first().click();
    cy.get("textarea").type(faker.lorem.paragraph());
    cy.findByText("Save Game").click();
    // Verify that the game was added by URL
    cy.url().should("include", "/game/");
    // Check that the related role is displayed (text)
    // cy.findByText("Drunk").should("exist");
    // cy.findByText("Empath").should("exist");
    // Check that the related role is displayed as a token
    cy.get(".token[data-role-id='drunk']").should("exist");
    cy.get(".token[data-role-id='empath']").should("exist");
  });

  it("can add a new game with multiple roles", () => {
    const storyteller = faker.person.firstName();

    // @ts-ignore
    cy.login(email, password);

    cy.findByText("Add Game").click();
    cy.findAllByText("Select Script").first().click();
    cy.findByAltText("Trouble Brewing").click();
    cy.findByLabelText("Storyteller").type(storyteller);
    cy.findByLabelText("Community").type("Cypress");
    cy.findByLabelText("Players").type(
      (Math.floor(Math.random() * 10) + 5).toString()
    );
    cy.get(".token").first().click();
    cy.get(".token[data-role-id='spy']").first().click();
    cy.findByText("Add Character").click();
    cy.get(".token[data-role-id='imp']").first().click();
    cy.get("textarea").type(faker.lorem.paragraph());
    cy.findByText("Save Game").click();

    // Verify that the game was added by URL
    cy.url().should("include", "/game/");
    // Check that both Spy and Imp are displayed (text)
    // cy.findByText("Spy").should("exist");
    // cy.findByText("Imp").should("exist");
    // Check that the Imp token is displayed
    cy.get(".token[data-role-id='imp']").should("exist");
    // Check that the Spy token is not displayed
    cy.get(".token[data-role-id='spy']").should("not.exist");
  });
});
