import { test, expect, type Page } from "@playwright/test";

import { loginAsGlobalTestUser } from "./utils/auth";

test.beforeEach(async ({ page }) => {
	await loginAsGlobalTestUser(page);
	await page.waitForLoadState("networkidle");
	await page.evaluate(() => localStorage.removeItem("draftGame"));
});

for (const source of ["new game", "saved draft", "manual selection"]) {
	test(`applies late account privacy appropriately for a ${source}`, async ({ page }) => {
		if (source === "saved draft") {
			await page.evaluate(() => localStorage.setItem("draftGame", JSON.stringify({
				privacy: "FRIENDS_ONLY", notes: "Saved draft",
			})));
		}
		const releaseSettings = await holdSettings(page);
		const settingsResponse = page.waitForResponse("**/api/settings");
		try {
			await page.locator('a[href="/add-game"]').first().click();
			await expect(page.getByLabel("Date", { exact: true })).toBeVisible();
			await expect(page.getByRole("combobox", { name: /^Privacy/ })).toBeEnabled();
			await expect(page.getByRole("combobox", { name: /^Privacy/ })).toHaveValue(source === "saved draft" ? "FRIENDS_ONLY" : "PUBLIC");
			await expect(page.locator("#save-game")).toBeEnabled();
			await expect(notes(page)).toHaveValue(source === "saved draft" ? "Saved draft" : "");
			await notes(page).fill("Written while settings load");
			if (source === "manual selection") {
				await page.getByRole("combobox", { name: /^Privacy/ }).selectOption("FRIENDS_ONLY");
			}
			releaseSettings();
			await (await settingsResponse).finished();
			await page.waitForLoadState("networkidle");
			await expect(page.getByRole("combobox", { name: /^Privacy/ })).toHaveValue(source === "new game" ? "PRIVATE" : "FRIENDS_ONLY");
			await expect(notes(page)).toHaveValue("Written while settings load");
			await page.getByRole("combobox", { name: /^Privacy/ }).selectOption("PUBLIC");
			await expect(page.getByRole("combobox", { name: /^Privacy/ })).toHaveValue("PUBLIC");
		} finally {
			releaseSettings();
		}
	});
}

test("allows manual privacy selection and saving after settings fail", async ({ page }) => {
	await page.route("**/api/settings", route => route.fulfill({ status: 403, json: {} }));
	await page.route("**/api/games", route => route.fulfill({ status: 500, json: {} }));
	const failedSettings = page.waitForResponse("**/api/settings");
	await page.locator('a[href="/add-game"]').first().click();
	await failedSettings;
	await expect(page.getByRole("combobox", { name: /^Privacy/ })).toBeEnabled();
	await page.getByRole("combobox", { name: /^Privacy/ }).selectOption("PRIVATE");
	await page.getByLabel("Date", { exact: true }).fill("2000-01-01");
	await page.getByLabel("Good wins", { exact: true }).check();
	const saved = page.waitForRequest(request => request.method() === "POST" && request.url().endsWith("/api/games"));
	await page.locator("#save-game").click();
	expect((await saved).postDataJSON().privacy).toBe("PRIVATE");
});


/** Hold the response until the test has checked the editable form. */
async function holdSettings(page: Page) {
	let release!: () => void;
	const pending = new Promise<void>(resolve => { release = resolve; });
	await page.route("**/api/settings", async route => {
		await pending;
		await route.fulfill({ json: { privacy: "PRIVATE" } });
	});
	return release;
}


function notes(page: Page) {
	return page.getByRole("group", { name: /^Notes\b/ }).getByRole("textbox");
}
