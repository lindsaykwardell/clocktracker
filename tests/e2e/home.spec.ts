import { test, expect } from "@playwright/test";

// If you saved account data in global setup and need it for login, you might import it like this:
// import fs from 'node:fs';
// import path from 'node:path';
// const accountDataPath = path.join(__dirname, 'test-account.json');
// const account = JSON.parse(fs.readFileSync(accountDataPath, 'utf-8'));

test.describe("Home Page", () => {
  test("should display landing page content for unauthenticated users", async ({
    page,
  }) => {
    // Navigate to the home page
    await page.goto("/");

    // Wait for the page to load and for potential client-side hydration
    await page.waitForLoadState("networkidle");

    // Replace this with actual text from your LandingPage.vue
    const expectedText = "Tell Your Clocktower Story";
    await expect(page.getByText(expectedText, { exact: false })).toBeVisible();

    // You could also check for the absence of UserDashboard specific text if that helps
    // const unexpectedText = 'UserDashboardSpecificText';
    // await expect(page.getByText(unexpectedText)).not.toBeVisible();
  });

  // TODO: Add another test here for authenticated users if needed.
  // This would involve logging in using the credentials from test-account.json
  // and then checking for UserDashboard content.
});
