import { faker } from "@faker-js/faker";

describe("games", () => {
  let email: string;
  let password: string;
  let displayName: string;
  let username: string;
  before(() => {
    email = faker.internet.email();
    password = faker.internet.password();

    // @ts-ignore
    cy.register(email, password);
    cy.get("h3").then(($h3) => {
      displayName = $h3.text();
    });
    cy.get("h4").then(($h4) => {
      username = $h4.text();
    });
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
    cy.findByText("Chef").first().click();
    cy.get("textarea").type(faker.lorem.paragraph());
    cy.findByText("Save Game").click();
    // Verify that the game was added by URL
    cy.url().should("include", "/game/");
    // Check that the token is displayed
    cy.findByAltText("Chef").should("exist");
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
    cy.findByText("Drunk").first().click();
    cy.get(".token.related").first().click();
    cy.findByText("Empath").first().click();
    cy.get("textarea").type(faker.lorem.paragraph());
    cy.findByText("Save Game").click();
    // Verify that the game was added by URL
    cy.url().should("include", "/game/");
    // Check that the related role is displayed (text)
    // cy.findByText("Drunk").should("exist");
    // cy.findByText("Empath").should("exist");
    // Check that the related role is displayed as a token
    cy.findByAltText("Drunk").should("exist");
    cy.findByAltText("Empath").should("exist");
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
    cy.findByText("Spy").first().click();
    cy.findByText("Add Character").click();
    cy.findByText("Imp").first().click();
    cy.get("textarea").type(faker.lorem.paragraph());
    cy.findByText("Save Game").click();

    // Verify that the game was added by URL
    cy.url().should("include", "/game/");
    // Check that both Spy and Imp are displayed (text)
    // cy.findByText("Spy").should("exist");
    // cy.findByText("Imp").should("exist");
    // Check that the Imp token is displayed
    cy.findByAltText("Imp").should("exist");
    // Check that the Spy token is not displayed
    cy.findByAltText("Spy").should("not.exist");
  });

  it("filters the role selection dialog properly", () => {
    // @ts-ignore
    cy.login(email, password);

    cy.findByText("Add Game").click();
    cy.findAllByText("Select Script").first().click();
    cy.findByAltText("Trouble Brewing").click();
    cy.get(".token").first().click();
    cy.findByLabelText("Filter roles").type("spy");
    cy.findByText("Spy").should("exist");
    cy.findByText("Imp").should("not.exist");
    cy.findByText("Spy").click();

    // The filter should reset whenever the dialog is opened
    cy.findByText("Add Character").click();
    cy.findByLabelText("Filter roles").should("have.value", "");
    cy.findByText("Spy").should("exist");
    cy.findByText("Imp").should("exist");
  });

  describe("grimoire", () => {
    it("renders a grimoire based on the number of players", () => {
      // @ts-ignore
      cy.login(email, password);

      cy.findByText("Add Game").click();
      cy.findAllByText("Select Script").first().click();
      cy.findByAltText("Trouble Brewing").click();
      cy.findByLabelText("Players").type("5");
      cy.findByText("Edit Grimoire").click();
      cy.get("#grimoire .token").should("have.length", 5);

      cy.findByLabelText("Players").clear().type("7");
      cy.get("#grimoire .token").should("have.length", 7);
    });

    it("doesn't render the grimoire for a saved game if no data was entered", () => {
      // @ts-ignore
      cy.login(email, password);

      cy.findByText("Add Game").click();
      cy.findAllByText("Select Script").first().click();
      cy.findByAltText("Trouble Brewing").click();
      cy.findByLabelText("Players").type("5");
      cy.findByText("Save Game").click();

      cy.get("#grimoire").should("not.exist");
    });

    it("allows setting a role for a grimoire seat", () => {
      // @ts-ignore
      cy.login(email, password);

      cy.findByText("Add Game").click();
      cy.findAllByText("Select Script").first().click();
      cy.findByAltText("Trouble Brewing").click();
      cy.findByLabelText("Players").type("5");
      cy.findByText("Edit Grimoire").click();
      cy.get("#grimoire .token").first().click({ force: true });
      cy.findByText("Spy").click();
      cy.get("#grimoire .token .token-image")
        .first()
        .should("have.attr", "alt", "Spy");
      cy.findByText("Save Game").click();

      // Grimoire should render the circle with the Spy token
      cy.get("#grimoire .token .token-image")
        .first()
        .should("have.attr", "alt", "Spy");
    });

    it("saves a name for the grimoire seat", () => {
      const playerName = faker.person.firstName();

      // @ts-ignore
      cy.login(email, password);

      cy.findByText("Add Game").click();
      cy.findAllByText("Select Script").first().click();
      cy.findByAltText("Trouble Brewing").click();
      cy.findByLabelText("Players").type("5");
      cy.findByText("Edit Grimoire").click();
      cy.get("#grimoire .token").first().click({ force: true });
      cy.findByText("Spy").click();
      cy.get("#grimoire .token-seat input")
        .first()
        .type(playerName, { force: true });
      cy.findByText("Save Game").click();
      cy.get("#grimoire .token-seat input")
        .first()
        .should("have.value", playerName);
    });

    it("allows tagging a friend in a grimoire seat", () => {
      const user2 = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        username: faker.internet.userName(),
        displayName: "",
      };

      // @ts-ignore
      cy.register(user2.email, user2.password, user2.username);

      cy.findByRole("link", { name: "Search" }).click();
      cy.get("input[type='search']").type(displayName);
      cy.findByRole("button", { name: "Search" }).click();
      cy.findByText(displayName).click();
      cy.findByRole("button", { name: "Add Friend" }).click();
      cy.findByRole("button", { name: "Cancel" }).should("exist");
      // @ts-ignore
      cy.logout();

      // @ts-ignore
      cy.login(email, password);
      cy.findByText("Friends").click();
      cy.findByRole("button", { name: "Accept" }).click();
      cy.findByRole("button", { name: "Friends" }).should("exist");

      cy.findByText("Add Game").click();
      cy.findAllByText("Select Script").first().click();
      cy.findByAltText("Trouble Brewing").click();
      cy.findByLabelText("Players").type("5");
      cy.findByText("Edit Grimoire").click();
      cy.get("#grimoire .token").first().click({ force: true });
      cy.findByText("Spy").click();
      cy.get("#grimoire .token-seat input")
        .first()
        .type("@" + user2.username, { force: true });
      cy.findByText("Save Game").click();
      cy.url().should("include", "/game/");
      cy.findByRole("link", { name: "@" + user2.username }).should("exist");
    });
  });
});
