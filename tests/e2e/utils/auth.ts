import { expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Define an interface for your account data (consistent with global.setup.ts and welcome.spec.ts)
interface TestAccount {
  user_id: string;
  firstName: string;
  lastName: string;
  username: string;
  display_name: string;
  email: string;
  password: string;
  pronouns: string | null;
  bio: string;
  location: string;
}

const accountDataPath = path.resolve(__dirname, "../test-account.json"); // Path relative to this utils file
let account: TestAccount | null = null;

function getTestAccount(): TestAccount {
  if (!account) {
    if (fs.existsSync(accountDataPath)) {
      account = JSON.parse(fs.readFileSync(accountDataPath, "utf-8"));
    } else {
      throw new Error(
        `Global test account data not found at ${accountDataPath}. Ensure globalSetup ran successfully.`
      );
    }
  }
  if (!account) {
    // Should not happen if above logic is correct, but as a safeguard
    throw new Error("Failed to load test account data.");
  }
  return account;
}

/**
 * Logs in the globally created test user.
 * Assumes the user exists and their credentials are in test-account.json.
 * @param page The Playwright Page object.
 */
export async function loginAsGlobalTestUser(page: Page): Promise<void> {
  const testAccount = getTestAccount();

  await page.goto("/login");

  await expect(page.getByPlaceholder("Email")).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder("Email").fill(testAccount.email);

  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await page.getByPlaceholder("Password").fill(testAccount.password);

  await expect(page.getByPlaceholder("Email")).toHaveValue(testAccount.email);
  await expect(page.getByPlaceholder("Password")).toHaveValue(
    testAccount.password
  );

  await page.getByRole("button", { name: "Login", exact: true }).click();

  // Wait for successful login. This could be a URL change or an element appearing on the dashboard.
  // Example: Wait for the URL to change from /login.
  // If the user has completed the welcome step, they should go to '/'.
  // If they haven't, they might go to '/welcome'.
  // For a generic login, let's wait for not being on /login anymore.
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
    timeout: 10000,
  });

  // Add a more specific assertion for your app's logged-in state if possible
  // e.g., expect an avatar or a dashboard element to be visible.
  console.log(`Logged in as ${testAccount.email}`);
}
