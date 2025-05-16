import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should display login form elements", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Check for the heading
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    // Check for email input
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    // Check for password input
    await expect(page.getByPlaceholder("Password")).toBeVisible();

    // Check for Login button
    await expect(
      page.getByRole("button", { name: "Login", exact: true })
    ).toBeVisible();

    // Check for Register button
    await expect(page.getByRole("button", { name: "Register" })).toBeVisible();

    // Check for Forgot Password button
    await expect(
      page.getByRole("button", { name: "Forgot Password?" })
    ).toBeVisible();

    // Check for Login with Discord (assuming it's a component with this text or role)
    // If LoginWithDiscord is a custom component, you might need a more specific selector, e.g., a test ID.
    await expect(page.getByText(/Login with Discord/i)).toBeVisible();
  });
});
