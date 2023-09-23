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
  const user3 = {
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
    cy.createGame();

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

    // @ts-ignore
    cy.register(user3.email, user3.password);

    cy.get("h3").then(($h3) => {
      user3.displayName = $h3.text();
    });
    cy.get("h4").then(($h4) => {
      user3.username = $h4.text();
    });
    // @ts-ignore
    cy.logout();
  });

  afterEach(() => {
    cy.visit("/")
    // @ts-ignore
    cy.logout();
  })

  it("allows searching for a user", () => {
    // @ts-ignore
    cy.login(user2.email, user2.password);

    cy.findByRole("link", { name: "Search" }).click();
    cy.get("input[type='search']").type(user1.displayName);
    cy.findByRole("button", { name: "Search" }).click();
    cy.findByText(user1.displayName).should("exist");
    cy.findByText(user2.displayName).should("not.exist");
    cy.findByText(user3.displayName).should("not.exist");
  });

  describe("friend requests", () => {
    it("allows sending a friend request", () => {
      // @ts-ignore
      cy.login(user1.email, user1.password);

      cy.findByRole("link", { name: "Search" }).click();
      cy.get("input[type='search']").type(user2.displayName);
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
      cy.on("window:confirm", () => true);
      cy.findByText(user1.displayName).should("not.exist");
    });

    it("allows rejecting a friend request", () => {
      // @ts-ignore
      cy.login(user1.email, user1.password);

      cy.findByRole("link", { name: "Search" }).click();
      cy.get("input[type='search']").type(user2.displayName);
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

      cy.findByRole("link", { name: "Search" }).click();
      cy.get("input[type='search']").type(user2.displayName);
      cy.findByRole("button", { name: "Search" }).click();
      cy.findByText(user2.displayName).click();
      cy.findByRole("button", { name: "Add Friend" }).click();
      cy.findByRole("button", { name: "Cancel" }).click();
      cy.findByRole("button", { name: "Add Friend" }).should("exist");
    });
  });

  describe("privacy", () => {
    it("allows setting a user's privacy", () => {
      // @ts-ignore
      cy.login(user1.email, user1.password);

      cy.findByRole("link", { name: "Settings" }).click();
      // Click on a select dropdown labeled "Privacy" and select "Private"
      cy.findByLabelText("Privacy Setting").select("Private");
      cy.findByRole("button", { name: "Save Settings" }).click();
      cy.findByText("Profile updated successfully!").should("exist");
      cy.findByLabelText("Privacy Setting").should("have.value", "PRIVATE");
    });

    describe("private", () => {
      before(() => {
        // @ts-ignore
        cy.login(user1.email, user1.password);

        cy.findByRole("link", { name: "Settings" }).click();
        // Click on a select dropdown labeled "Privacy" and select "Private"
        cy.findByLabelText("Privacy Setting").select("Private");
        cy.findByRole("button", { name: "Save Settings" }).click();
        cy.findByText("Profile updated successfully!").should("exist");
        cy.findByLabelText("Privacy Setting").should("have.value", "PRIVATE");
        
        // @ts-ignore
        cy.logout();
      });

      it("displays a user's profile as private", () => {
        // @ts-ignore
        cy.login(user2.email, user2.password);

        cy.findByRole("link", { name: "Search" }).click();
        cy.get("input[type='search']").type(user1.displayName);
        cy.findByRole("button", { name: "Search" }).click();
        cy.findByText(user1.displayName).click();
        cy.findByText("This account is private").should("exist");
        cy.get(".token").should("not.exist");
      });

      it("shows a private user's games to friend users", () => {
        // @ts-ignore
        cy.login(user1.email, user1.password);

        cy.findByRole("link", { name: "Search" }).click();
        cy.get("input[type='search']").type(user2.displayName);
        cy.findByRole("button", { name: "Search" }).click();
        cy.findByText(user2.displayName).click();
        cy.findByRole("button", { name: "Add Friend" }).click();
        cy.findByRole("button", { name: "Cancel" }).should("exist");
        // @ts-ignore
        cy.logout();

        // @ts-ignore
        cy.login(user2.email, user2.password);
        cy.findByText("Friends").click();
        cy.findByRole("button", { name: "Accept" }).click();
        cy.findByRole("button", { name: "Friends" }).should("exist");
        cy.findByText(user1.displayName).click();
        cy.findByText("This account is private").should("not.exist");
        cy.findByAltText("Chef").should("exist");
      });

      after(() => {
        // @ts-ignore
        cy.login(user1.email, user1.password);

        cy.findByRole("link", { name: "Search" }).click();
        cy.get("input[type='search']").type(user2.displayName);
        cy.findByRole("button", { name: "Search" }).click();
        cy.findByText(user2.displayName).click();
        cy.findByRole("button", { name: "Friends" }).click();
        cy.on("window:confirm", () => true);
        cy.findByRole("button", { name: "Add Friend" }).should("exist");

        // @ts-ignore
        cy.logout();
      });
    });

    describe("friends only", () => {
      before(() => {
        // @ts-ignore
        cy.login(user1.email, user1.password);

        cy.findByRole("link", { name: "Settings" }).click();
        // Click on a select dropdown labeled "Privacy" and select "Private"
        cy.findByLabelText("Privacy Setting").select("Visible to friends only");
        cy.findByRole("button", { name: "Save Settings" }).click();
        cy.findByText("Profile updated successfully!").should("exist");
        cy.findByLabelText("Privacy Setting").should(
          "have.value",
          "FRIENDS_ONLY"
        );

        // @ts-ignore
        cy.logout();
      });

      it("hides a friend only user's profile from non-friend users", () => {
        // @ts-ignore
        cy.login(user2.email, user2.password);

        cy.findByRole("link", { name: "Search" }).click();
        cy.get("input[type='search']").type(user1.displayName);
        cy.findByRole("button", { name: "Search" }).click();
        cy.findByText(user1.displayName).should("not.exist");

        // Attempt to go to the user's profile directly
        cy.visit(`/@${user1.username}`);
        // Should receive a 404
        cy.findByText("404").should("exist");
      });

      it("shows a friend only user's profile to friend users", () => {
        // @ts-ignore
        cy.login(user1.email, user1.password);

        cy.findByRole("link", { name: "Search" }).click();
        cy.get("input[type='search']").type(user2.displayName);
        cy.findByRole("button", { name: "Search" }).click();
        cy.findByText(user2.displayName).click();
        cy.findByRole("button", { name: "Add Friend" }).click();
        cy.findByRole("button", { name: "Cancel" }).should("exist");
        // @ts-ignore
        cy.logout();

        // @ts-ignore
        cy.login(user2.email, user2.password);
        cy.findByText("Friends").click();
        cy.findByRole("button", { name: "Accept" }).click();
        cy.findByRole("button", { name: "Friends" }).should("exist");
        cy.findByText(user1.displayName).click();
        cy.findByAltText("Chef").should("exist");
      });

      after(() => {
        // @ts-ignore
        cy.login(user1.email, user1.password);

        cy.findByRole("link", { name: "Search" }).click();
        cy.get("input[type='search']").type(user2.displayName);
        cy.findByRole("button", { name: "Search" }).click();
        cy.findByText(user2.displayName).click();
        cy.findByRole("button", { name: "Friends" }).click();
        cy.on("window:confirm", () => true);
        cy.findByRole("button", { name: "Add Friend" }).should("exist");

        // @ts-ignore
        cy.logout();
      });
    });
  });
});
