import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { PrismaClient, PrivacySetting } from "@prisma/client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

interface TestUserDetails {
  email: string;
  password: string;
  username: string;
  displayName: string;
  userIdFromDb?: string; // Will be populated after DB query
}

test.describe("Welcome Page Full Flow", () => {
  test("should allow a new user to register, complete welcome, and not see it again", async ({
    page,
  }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fakeUser: TestUserDetails = {
      email: faker.internet
        .email({ firstName, lastName, provider: "test.local" })
        .toLowerCase(),
      password: faker.internet.password({
        length: 10,
        memorable: false,
        prefix: "P@55w0rd",
      }),
      username:
        faker.internet
          .username({ firstName, lastName })
          .replace(/[^a-zA-Z0-9_-]/g, "")
          .substring(0, 20) + faker.string.alphanumeric(5),
      displayName: `${firstName} ${lastName}`,
    };

    // 1. Register a new account
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(fakeUser.email);
    await page.waitForTimeout(100);
    await page.getByPlaceholder("Password").fill(fakeUser.password);
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: "Register" }).click();

    // 2. Land on Welcome Page
    await page.waitForURL("/welcome", { timeout: 10000 });
    expect(page.url()).toContain("/welcome");
    await expect(page.getByRole("heading", { name: `Welcome` })).toBeVisible();

    // 3. Fill out welcome form
    await page.getByLabel("Username").fill(fakeUser.username);
    await page.getByLabel("Display name").fill(fakeUser.displayName);
    await page.getByLabel("Pronouns").fill("they/them");
    await page.getByLabel("Location").fill(faker.location.city());
    await page.getByLabel("Privacy Setting").selectOption({ label: "Public" });
    await page.getByRole("button", { name: "Save Settings" }).click();

    // 4. Assert redirection to home page (or user dashboard)
    await page.waitForURL("/", { timeout: 10000 });
    expect(page.url()).not.toContain("/welcome");
    expect(page.url()).toBe(
      page
        .context()
        .browser()
        ?.contexts()[0]
        .pages()[0]
        .url()
        .split("/")
        .slice(0, 3)
        .join("/") + "/"
    ); // Check it is the base URL + /

    // 5. Database Check: finished_welcome should be true
    const userFromDb = await prisma.userSettings.findUnique({
      where: { email: fakeUser.email },
    });
    expect(userFromDb).toBeTruthy();
    expect(userFromDb?.finished_welcome).toBe(true);

    // 6. UI Check: Welcome page should not be shown again
    await page.goto("/welcome");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/welcome"); // Should have been redirected
    // Add an assertion for an element on the page you land on after welcome (e.g., a dashboard element)
    // For example, if the original index page for logged-in users shows UserDashboard:
    await expect(
      page.getByRole("heading", { name: `Welcome, ${fakeUser.displayName}` })
    ).not.toBeVisible();
  });
});
