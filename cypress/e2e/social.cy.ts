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

  it("allows following a user", () => {
    // @ts-ignore
    cy.login(user2.email, user2.password);

    cy.get("a[href='/search']").click();
    cy.get("input").type(user1.displayName);
    cy.findByRole("button", { name: "Search" }).click();
    cy.findByText(user1.displayName).click();
    cy.findByRole("button", { name: "Follow" }).click();
    cy.findByRole("button", { name: "Following" }).should("exist");

    // Following count should be updated
    cy.findByRole("link", { name: "My Profile" }).click();
    cy.findByText("1 Following").click();
    cy.findByText(user1.displayName).should("exist");
  })

  it("allows seeing who follows you", () => {
    // @ts-ignore
    cy.login(user1.email, user1.password);

    cy.findByText("1 Follower").click();
    cy.findByText(user2.displayName).should("exist");
  })

  it("sends a notification when someone is following you", () => {
    // @ts-ignore
    cy.login(user1.email, user1.password);

    cy.wait(10000)
    cy.get("[aria-label='Unread notifications']").should("exist");
    cy.get("[aria-label='Unread notifications']").then(($el) => {
      const count = $el.text();
      expect(count).to.equal("1");
    });
    cy.findByText("Notifications").click();
    cy.findByText(`${user2.username} followed you!`).should("exist");
    cy.get("[aria-label='Unread notifications']").should("not.exist");
  })
});
