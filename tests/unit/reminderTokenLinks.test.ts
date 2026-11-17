import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildReminderCatalogIndex,
  decideReminderLink,
  prepareReminderLinks,
} from "../../server/utils/reminderTokenLinks";

// Roles in preference order, as loadReminderCatalogIndex returns them:
// official roles first, then custom ones.
const catalog = buildReminderCatalogIndex([
  {
    token_url: "/img/role/poisoner.webp",
    reminders: [{ id: 10, reminder: "Poisoned" }],
  },
  {
    token_url: "/img/role/investigator.webp",
    reminders: [
      { id: 21, reminder: "Wrong" },
      { id: 20, reminder: "Minion" },
    ],
  },
  // A custom role reusing the poisoner icon: the official one must win.
  {
    token_url: "/img/role/poisoner.webp",
    reminders: [{ id: 99, reminder: "Poisoned" }],
  },
  { token_url: "", reminders: [{ id: 50, reminder: "Ignored" }] },
]);

const none = new Set<number>();

test("a valid catalog id is kept", () => {
  assert.deepEqual(
    decideReminderLink(
      { reminder: "Anything", token_url: "/x.webp", role_reminder_id: 7 },
      new Set([7]),
      catalog
    ),
    { role_reminder_id: 7, is_custom: false }
  );
});

test("an unknown catalog id falls back to matching on icon and text", () => {
  assert.deepEqual(
    decideReminderLink(
      { reminder: "Poisoned", token_url: "/img/role/poisoner.webp", role_reminder_id: 12345 },
      none,
      catalog
    ),
    { role_reminder_id: 10, is_custom: false }
  );
});

test("a reminder marked custom stays custom even if it matches the catalog", () => {
  for (const reminder of [
    { reminder: "Poisoned", token_url: "/img/role/poisoner.webp", is_custom: true },
    { reminder: "Poisoned", token_url: "/img/role/poisoner.webp", type: "CUSTOM" },
  ]) {
    assert.deepEqual(decideReminderLink(reminder, none, catalog), {
      role_reminder_id: null,
      is_custom: true,
    });
  }
});

test("older reminders match on the reminder's own icon, not the token it lies on", () => {
  assert.deepEqual(
    decideReminderLink({ reminder: "Wrong", token_url: "/img/role/investigator.webp" }, none, catalog),
    { role_reminder_id: 21, is_custom: false }
  );
  assert.deepEqual(
    decideReminderLink({ reminder: "Poisoned", token_url: "/img/role/poisoner.webp", type: "OFFICIAL" }, none, catalog),
    { role_reminder_id: 10, is_custom: false }
  );
});

test("no match means custom", () => {
  for (const reminder of [
    { reminder: "Poisoned", token_url: "/img/role/soldier.webp" },
    { reminder: "poisoned", token_url: "/img/role/poisoner.webp" },
    { reminder: "Ignored", token_url: "" },
    { reminder: "Another custom", token_url: "" },
  ]) {
    assert.deepEqual(decideReminderLink(reminder, none, catalog), {
      role_reminder_id: null,
      is_custom: true,
    });
  }
});

test("prepareReminderLinks checks ids and loads the catalog in two queries", async () => {
  const calls: string[] = [];
  const db = {
    roleReminder: {
      findMany: async (args: any) => {
        calls.push("roleReminder");
        assert.deepEqual(args.where.id.in.toSorted(), [1, 2]);
        return [{ id: 1 }];
      },
    },
    role: {
      findMany: async (args: any) => {
        calls.push("role");
        // Only the reminders that still need matching are looked up.
        assert.deepEqual(args.where.token_url.in, ["/img/role/poisoner.webp"]);
        return [
          { token_url: "/img/role/poisoner.webp", reminders: [{ id: 10, reminder: "Poisoned" }] },
        ];
      },
    },
  } as any;

  const reminders = [
    { reminder: "Minion", token_url: "/img/role/investigator.webp", role_reminder_id: 1 },
    { reminder: "Poisoned", token_url: "/img/role/poisoner.webp", role_reminder_id: 2 },
    { reminder: "Made up", token_url: "/img/role/chef.webp", type: "CUSTOM" },
  ];
  const linkFor = await prepareReminderLinks(db, reminders);
  assert.deepEqual(calls, ["roleReminder", "role"]);
  assert.deepEqual(reminders.map(linkFor), [
    { role_reminder_id: 1, is_custom: false },
    { role_reminder_id: 10, is_custom: false },
    { role_reminder_id: null, is_custom: true },
  ]);
});
