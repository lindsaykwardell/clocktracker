# Adding a new character

What to do when a new official character comes out, in order. Most of it is
data; the stat card and the event rules take the actual thinking.

## 0. The role id

The app's role id is made from the character's **name**, not from the `id` in
`roles.json`: lowercase, spaces become `_`, and `(`, `)` and `'` are dropped
(`nameToId` in `prisma/roles.js`).

| Name | `roles.json` id | App role id |
| --- | --- | --- |
| God of Ug | `godofug` | `god_of_ug` |
| Big Wig | `bigwig` | `big_wig` |
| Hell's Librarian | `hellslibrarian` | `hells_librarian` |
| Pit-Hag | `pithag` | `pit-hag` (the `-` stays) |

Use the app role id everywhere in the code below. A wrong id doesn't throw: it
just never matches. `tests/unit/roleIds.test.ts` checks the rules, hints,
stat cards and the event and game end role lists for ids that don't exist.

The image name is different again: the name in lowercase with spaces, `'`,
`-` and brackets removed (`godofug`).

## 1. Character data: `prisma/roles.json`

Add the character's entry (or copy the new official `roles.json`):
`name`, `team`, `edition`, `ability`, `reminders`, `remindersGlobal`,
`firstNight` / `otherNight` and their reminders, `setup`.

- **Changed reminder wording** on an existing character: add the old wording to
  `prisma/legacyReminders.js`, so old grimoires keep working and the old
  wording is marked legacy in the reminder dialog.
- `prisma/roles.js` builds the roles and reminders from this file and also
  writes `server/utils/role_names.json` (used for generated names). Commit
  that file if it changes.

## 2. Images

1. Put the official art in `resources/characters/<edition>/` (a copy of
   botc-release's `resources/characters`): `<name>_g.webp` / `<name>_e.webp`,
   or a plain `<name>.webp` for Travellers, Fabled and Loric.
2. Run `npm run images:roles`. It writes the 48, 80 and 160 px webp files into
   `public/img/role/{48x48,80x80,160x160}/`, plus the plain name for the
   character's own side (`imp_e` → `imp`). It needs the character in
   `roles.json` to know its team; it prints the names it couldn't place.
3. Check the image name matches what `prisma/roles.js` builds as
   `token_url` (`/img/role/<image name>.webp`).

Earlier images were added by hand as `Icon_<name>.webp`; those aren't the
names the app asks for.

## 3. Import into the database

```bash
npm run roles:import
```

On deploy `migrate.sh` runs the same import. It only upserts: it never
deletes a role or a reminder.

## 4. Reminders: what each one records

For every reminder of the character, decide whether placing it should record
a grimoire event, and how long it stays when a new page is added. See
`docs/reminder-lifetimes.md` for the lifetimes and existing examples.

- **Event rule** in `shared/reminderRules.ts` (`EVENT_GROUPS`): the reminder,
  the event type (`DEATH`, `EXECUTION`, `REVIVE`, `DRUNK`, `POISONED`, `MAD`,
  `SEAT_CHANGE`, `OTHER`), and:
  - `sourceMode: "npc"` for Fabled and Loric (and anything that isn't a seat);
  - `targetScope` / `targetRoleIds` when it only counts on certain tokens.

  "Dead", "Executed", "Alive", "Changed", "Turns Evil" and "Reincarnated"
  already work for every role. A reminder that stays on the same player over
  several pages records one event, on the page it first appears.
- **Lifetime only** (no event, but removed with a phase): `LIFETIME_ONLY` in
  the same file. Anything in neither list `stays`.
- **Hint** in `composables/grimoireReminderHints.ts`, for every reminder that
  records an event: where to place it, then what it records.
- **Tracking reminder** in `prisma/trackingReminders.js` if something worth
  recording has no official reminder (like the Sage's "Know"). Then run the
  import again.
- **Event causes and game end causes**: if the character can kill, revive,
  change characters or end the game, add it to the lists in
  `composables/grimoireEventRoleConfig.ts`, `composables/gameEndTriggerConfig.ts`
  and, for a killing Demon or a character that gains other abilities,
  `composables/grimoireRoleGroups.ts`.
- **Special cases**: a character that moves seats goes in `SEAT_MOVING_ROLES`
  in `utils/grimoireChecks.ts`. Search the editor and event engine for a
  similar character (`git grep '"fang_gu"'`) when the ability is unusual.

Update `docs/reminder-lifetimes.md`, and take the reminder out of
`docs/untracked-reminders.md` while that list exists.

## 5. Stat card

In `composables/statCardConfig/` (`townsfolk.ts`, `outsiders.ts`,
`minions.ts`, `demons.ts`, `travellers.ts`, `fabledLoric.ts`), in the order
the characters are listed there. If there's nothing worth a card, leave a
comment like `// Pope: Nothing to track really.`

- `id`: `<role>_<what>`, with `_received` when it counts what happened to the
  player (`god_of_ug_hat_worn_received`).
- `roleIds`: the app role ids.
- `scope`: `as_role` (while playing the character), `affected_player` (what
  the character did to this player) or `triggering_player`.
- `script: "npc"` for Fabled and Loric.
- `source` and `globalDataNeeds`: `grimoire_event` / `["grimoire_events"]`
  when it counts events; `game` when it reads the game (end triggers).
- `label`: the title. Short and in the character's flavour ("Final Footnote",
  "Ug Wear Hat"); see `docs/stat-card-title-review.md`.
- `getCount`: usually `countMatchingEvents` with `by_role_id`, `event_type`
  and `status_source` (the reminder text).
- `getSentence` (you / this player / "do this" when 0) and
  `getGlobalSentence`.
- `hidden: true` if it shouldn't show yet.

## 6. Tests

- Add a scenario to `tests/unit/grimoireRoleScenarios.test.ts`: place the
  reminder on a page, check the event and the card count. If the reminder
  can stay or move between pages, test that too.
- Run `npm run test:unit`. `roleIds.test.ts` fails on a wrong role id.

## 7. Check in the browser

- The character shows in the character picker with its image (good and evil
  art if it has both).
- Its reminders show in the reminder dialog, with the hint.
- Placing a reminder adds the event in the events list, with the right
  source; adding a page keeps or removes it as its lifetime says.
- The card shows on the character page and on a player's stat cards page

## To check

- `prisma/roles.js` looks for the `_g` / `_e` images in `public/img/role/`
  itself, but the images are now only in the size folders, so
  `alternate_token_urls` may always be empty. Not verified; check what's in
  the database and whether the editor needs it.
