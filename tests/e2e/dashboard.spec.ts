import { expect, test, type Page } from "@playwright/test";

import { loginAsGlobalTestUser } from "./utils/auth";

const role = {
	id: "e2e-role-of-the-day",
	name: "E2E Role of the Day",
	initial_alignment: "GOOD",
	token_url: "/img/default.png",
	alternate_token_urls: [],
	type: "TOWNSFOLK",
	custom_role: false,
};


const scripts = [{
	script_id: "e2e-script-id",
	script: "E2E Script of the Week",
	version: "1",
	author: "E2E",
	games: 1,
}];


test("renders the dashboard while optional cards load independently", async ({ page }) => {
	await navigateAwayFromInitialHome(page);
	const roleResponse = await holdJsonResponse(page, "/api/role_of_the_day", role);
	const scriptsResponse = await holdJsonResponse(page, "/api/scripts_of_the_week", scripts);

	try {
		await page.locator("#dashboard").click();
		await expect(page.getByRole("heading", { name: "Stats at a glance" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Activity Feed" })).toBeVisible();
		await Promise.all([roleResponse.started, scriptsResponse.started]);
		await expect(page.getByRole("heading", { name: "Role of the Day" })).toHaveCount(0);
		await expect(page.getByRole("heading", { name: "Popular Scripts" })).toHaveCount(0);

		roleResponse.release();
		await expect(page.getByRole("heading", { name: "Role of the Day" })).toBeVisible();
		await expect(page.getByRole("link", { name: role.name, exact: true }).last()).toBeVisible();
		await expect(page.getByRole("heading", { name: "Popular Scripts" })).toHaveCount(0);

		scriptsResponse.release();
		await expect(page.getByRole("heading", { name: "Popular Scripts" })).toBeVisible();
		await expect(page.getByRole("link", { name: scripts[0].script, exact: true })).toBeVisible();
	} finally {
		roleResponse.release();
		scriptsResponse.release();
	}
});


test("keeps the core dashboard usable when optional endpoints fail", async ({ page }) => {
	await navigateAwayFromInitialHome(page);
	await page.route("**/api/role_of_the_day", route => route.fulfill({ status: 500, json: {} }));
	await page.route("**/api/scripts_of_the_week", route => route.fulfill({ status: 500, json: {} }));
	const roleFailure = page.waitForResponse(response => response.url().endsWith("/api/role_of_the_day"));
	const scriptsFailure = page.waitForResponse(response => response.url().endsWith("/api/scripts_of_the_week"));

	await page.locator("#dashboard").click();
	expect((await roleFailure).status()).toBe(500);
	expect((await scriptsFailure).status()).toBe(500);
	await expect(page.getByRole("heading", { name: "Stats at a glance" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Activity Feed" })).toBeVisible();
	await page.locator("#add-game").click();
	await expect(page).toHaveURL(/\/add-game$/);
});


async function navigateAwayFromInitialHome(page: Page) {
	await loginAsGlobalTestUser(page);
	const activityFeed = page.getByRole("heading", { name: "Activity Feed" });
	const saveWelcome = page.getByRole("button", { name: "Save Settings" });
	await page.goto("/welcome");
	await expect(activityFeed.or(saveWelcome)).toBeVisible();
	if (await saveWelcome.isVisible()) await saveWelcome.click();
	await expect(activityFeed).toBeVisible();
	await page.goto("/add-game");
	await expect(page).toHaveURL(/\/add-game$/);
	await expect(page.locator("#dashboard")).toBeVisible();
	await page.route("**/api/dashboard/recent", route => route.fulfill({ json: { updates: [], nextCursor: null } }));
	await page.route("**/api/events", route => route.fulfill({ json: [] }));
}


async function holdJsonResponse(page: Page, endpoint: string, body: unknown) {
	const started = deferred();
	const released = deferred();
	await page.route(`**${endpoint}`, async route => {
		started.resolve();
		await released.promise;
		await route.fulfill({ json: body });
	});
	return { started: started.promise, release: released.resolve };
}


function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>(resolvePromise => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
}
