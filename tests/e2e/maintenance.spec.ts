import { test, expect } from "@playwright/test";

// const prisma = new PrismaClient(); // No longer needed
// const MAINTENANCE_FLAG_NAME = "maintenance"; // No longer needed

test.describe("Maintenance Page", () => {
  test("should display maintenance information when flag is active via URL", async ({
    page,
  }) => {
    // Navigate to the maintenance page with the feature flag in the URL
    await page.goto("/maintenance?featureFlags=maintenance");
    await page.waitForLoadState("networkidle");

    // Check that we are indeed on the maintenance page and not redirected
    expect(page.url()).toContain("/maintenance"); // The query param might still be there or be stripped, so just check base path

    await expect(
      page.getByRole("heading", { name: "Maintenance in Progress" })
    ).toBeVisible();
    await expect(
      page.getByText("The site is currently down for maintenance.")
    ).toBeVisible();
    await expect(page.getByText("Please check back later.")).toBeVisible();

    // Verify the image is present by checking its alt text or src if more specific
    // For example, if the image always has this src:
    await expect(
      page.locator('img[src="/img/role/engineer.png"]')
    ).toBeVisible();
  });

  test("should redirect to /maintenance when feature flag is active", async ({
    page,
  }) => {
    await page.goto("/?featureFlags=maintenance");
    await expect(
      page.getByRole("heading", { name: "Maintenance in Progress" })
    ).toBeVisible();
  });

  test("should not redirect to /maintenance when feature flag is not active", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Maintenance in Progress" })
    ).not.toBeVisible();
  });

  test("should not display /maintenance when feature flag is not active", async ({
    page,
  }) => {
    await page.goto("/maintenance");
    await expect(
      page.getByRole("heading", { name: "Maintenance in Progress" })
    ).not.toBeVisible();

    await expect(page.url()).not.toContain("/maintenance");
  });
});
