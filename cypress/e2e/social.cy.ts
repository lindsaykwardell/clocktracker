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

  it("allows sending a friend request", () => {
    // @ts-ignore
    cy.login(user1.email, user1.password);

    cy.get("a[href='/search']").click();
    cy.get("input").type(user2.displayName);
    cy.findByRole("button", { name: "Search" }).click();
    cy.findByText(user2.displayName).click();
    cy.findByRole("button", { name: "Add Friend" }).click();
    cy.findByRole("button", { name: "Cancel" }).should("exist");
  });

  it("allows receiving a friend request", () => {
    // @ts-ignore
    cy.login(user2.email, user2.password);

    cy.findByText("Friends").click();
    cy.findByText(user1.displayName).should("exist");
    cy.findByRole("button", { name: "Accept" }).should("exist");
    // cy.findByText("Reject").should("exist");
  });

  it("allows accepting a friend request", () => {
    // @ts-ignore
    cy.login(user2.email, user2.password);

    cy.findByText("Friends").click();
    cy.findByText(user1.displayName).should("exist");
    cy.findByRole("button", { name: "Accept" }).click();
    cy.findByRole("button", { name: "Friends" }).should("exist");
  });

  it("allows unfriending a friend", () => {
    // @ts-ignore
    cy.login(user2.email, user2.password);

    cy.findByText("Friends").click();
    cy.findByRole("button", { name: "Friends" }).click();
    cy.on('window:confirm', () => true);
    cy.findByText(user1.displayName).should("not.exist");
  });

  it("allows rejecting a friend request", () => {
    // @ts-ignore
    cy.login(user1.email, user1.password);

    cy.get("a[href='/search']").click();
    cy.get("input").type(user2.displayName);
    cy.findByRole("button", { name: "Search" }).click();
    cy.findByText(user2.displayName).click();
    cy.findByRole("button", { name: "Add Friend" }).click();
    // @ts-ignore
    cy.logout();

    // @ts-ignore
    cy.login(user2.email, user2.password);

    cy.findByText("Friends").click();
    cy.findByText(user1.displayName).should("exist");
    cy.findByRole("button", { name: "Delete" }).click();
    cy.findByRole("button", { name: "Friends" }).should("not.exist");
    cy.findByText(user1.displayName).should("not.exist");
  });

  it("allows cancelling a sent friend request", () => {
    // @ts-ignore
    cy.login(user1.email, user1.password);

    cy.get("a[href='/search']").click();
    cy.get("input").type(user2.displayName);
    cy.findByRole("button", { name: "Search" }).click();
    cy.findByText(user2.displayName).click();
    cy.findByRole("button", { name: "Add Friend" }).click();
    cy.findByRole("button", { name: "Cancel" }).click();
    cy.findByRole("button", { name: "Add Friend" }).should("exist");
  })
});
