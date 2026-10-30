# Temporary staging and Cloudflare migration

## Scope

The `Temporary staging` GitHub Actions workflow launches independent web environments from trusted branches. Each has a unique hostname, an application machine, and a restored PostgreSQL cluster. Multiple environments can remain active concurrently. Management operations are serialized to avoid cleanup/extension races.

The default lifetime is one hour after readiness. Choose 1–168 whole hours. The application rejects page and API requests after its deadline, even if infrastructure cleanup is delayed. A scheduled sweep runs every 15 minutes and destroys expired resources. **GitHub schedules are best effort: seven days is an access deadline, not a guarantee that billing stops at that exact instant.** Monitor failed/missing cleanup runs. A strict destruction deadline requires an independently operated scheduler calling the cleanup workflow/API.

No provisioning occurs simply by merging this PR. The Cloudflare migration and private GitHub configuration below must be completed first. This workflow has no pull-request trigger; never run arbitrary fork or unreviewed code with production data.

## Authentication and access

- Production Supabase authenticates existing accounts, including Discord. Application data comes from the isolated backup restore; application user IDs are preserved.
- Only `/` and `/login` are public pages. Static resources required to render them remain accessible. Every data API, including normally public game/community/forum APIs, requires an authenticated admin. Signed-out page requests redirect to login; API requests return 401; signed-in non-admin requests return 403.
- Admin membership is read from `UserSettings.is_admin` in the **restored snapshot** on every protected request. This is not a live production authorization mirror. Choose a recent backup; destroy/recreate environments if an administrator is removed in production. New administrators added after the snapshot will not have access until a newer snapshot is restored.
- Missing/invalid expiry and authorization lookup failures fail closed. Responses disable caching and indexing. Staging builds disable service workers, offline persistence, analytics, error-reporting releases, and scheduled application jobs.
- Staging logout signs out only the current session; it does not revoke production sessions.
- Password login and Discord login remain available. Registration/reset buttons and password/integration settings are unavailable in staging. Supabase is shared: direct provider requests still have normal production account effects, and Discord may create a production auth identity for a first-time user. The staging server rejects that user unless the copied database marks them as an admin. These UI restrictions do not alter Supabase's global policy.
- Staging is for trusted administrators and trusted code. An admin can export copied production data. Never publish database contents, account IDs, backup downloads, raw logs, or screenshots containing personal information in the public repository.

## Backup and data isolation

Existing backups are Fly PostgreSQL Flex/Barman physical base backups plus WAL stored in Tigris, using PostgreSQL 17. They are not `pg_dump` archives. The workflow calls `flyctl postgres backup restore` against the configured source app, selecting `latest` or a Barman backup ID. It does not create a fresh production backup or run migrations on production.

Fly restores one new database machine using the source image, region, machine sizing, and volume size. It generates new cluster operator credentials. The implementation intentionally retains that compatible sizing; budget using the source instance's resources, not a hypothetical 1 GB database. The backup bucket and its retention are unchanged.

Before the web application is deployed:

1. Delete copied web-push subscriptions, FCM tokens, and cron locks; clear BoardGameGeek cookies and notification preferences.
2. Disable copied application database logins and remove their passwords, preserving Fly's internal operator/replication roles.
3. Remove the temporary restore secret containing source archive access from the restored Fly app.
4. Attach a new non-superuser database role to the new web app, then transfer ownership of application tables, sequences, enum types, schema, and database so migrations can run.
5. Run `prisma migrate deploy` using only the new app's database secret.

Uploads are **disabled** in this initial version. Existing image URLs continue to refer to existing production assets; no production storage-write credentials are installed. BGG posting, GitHub issue creation, webhooks, push subscriptions, and account-management routes are blocked. Push delivery also has a server-side staging guard. No production push, GitHub, Ko-fi, Bluesky, or Redis secrets are copied to the app. General request throttling uses its existing local fallback.

Fly restores into the source database's organization. This uses the organization's existing private network, not a separate network security boundary. Keep Fly access limited to trusted maintainers. Production backup restore credentials are available only to the trusted management runner and temporary restore process, never to the web app.

## One-time Cloudflare migration

Perform this in the intended long-term owner's account. Keep authorization codes, account identifiers, provider exports, and credentials out of Git and PR comments.

### 1. Inventory and ownership

- Confirm who will own Cloudflare billing, domain renewal, and recovery access; enable MFA and invite maintainers individually.
- Record the current registrar, nameservers, DNSSEC status, expiration date, and any transfer lock in a private handover document.
- Export/copy the complete DNS zone privately. Verify apex and `www`, MX, SPF, DKIM, DMARC, verification TXT records, CAA, and every existing subdomain. Cloudflare's automatic scan is not a complete inventory.
- Confirm the registrar contact email can receive transfer confirmations. Check transfer eligibility before changing registrant contact details: a registrant change can introduce a transfer lock.

### 2. Move authoritative DNS first

1. Add the existing domain to Cloudflare using full DNS setup. Domain registration can stay at Hover during this step.
2. Import and compare every record against the private inventory. Initially use **DNS only** for web records to preserve current traffic/TLS behavior. Mail records remain DNS only.
3. If DNSSEC is enabled, follow Cloudflare's migration procedure: remove/disable the old registrar DS delegation and wait at least 24 hours and verify cached DS records have expired before changing nameservers. Do not leave an old DS record pointing at the previous provider's keys.
4. In Hover, replace the domain's nameservers with the exact pair assigned by Cloudflare. No registrar transfer is required for this change.
5. Wait for Cloudflare to report the zone active. Verify authoritative NS responses and DNS through independent resolvers. Check the live site, production HTTPS, Discord login, inbound/outbound mail, and password recovery using designated test accounts.
6. Preserve the previous zone until propagation and verification are complete. For rollback, restore the previous nameservers only while that provider still serves the complete zone; account for DNSSEC when doing so.
7. If transferring registration next, leave DNSSEC disabled until that transfer completes, then enable it through Cloudflare. If postponing the registrar transfer, enable Cloudflare DNSSEC and publish its new DS record through the current registrar; revisit the transfer instructions when ready.

### 3. Transfer registration from Hover

1. Confirm Cloudflare supports the domain's TLD, the domain is eligible, and the intended owner controls the Cloudflare zone. Resolve transfer locks/expiration issues first.
2. Unlock the domain at Hover and obtain its EPP/auth code privately.
3. Start the transfer in Cloudflare Registrar, provide that code privately, confirm contact and billing details, and complete registrar confirmation emails.
4. Follow the registrar's current DNSSEC transfer instructions. Keep authoritative Cloudflare nameservers unchanged throughout the registrar transfer.
5. Enable DNSSEC through Cloudflare after transfer completion. Verify expiration/renewal date, auto-renewal, contact details, transfer lock, and DNSSEC. Confirm DNS/mail/site behavior again. Do not cancel existing registration before the transfer completes.

DNS migration and registrar transfer are separate operations. Staging automation can start after DNS migration, without waiting for registrar transfer completion.

### 4. Configure staging DNS and HTTPS

Set `STAGING_DOMAIN` to `staging.<your-domain>`. Each environment gets one DNS-only CNAME:

| Type | Name | Target | Proxy | TTL |
| --- | --- | --- | --- | --- |
| CNAME | `<environment-id>.staging` | `ct-stg-<environment-id>.fly.dev` | Off | 60 seconds |

The workflow allocates Fly IPv6 plus shared IPv4 and registers the hostname with Fly. The CNAME resolves to Fly's app addresses; IPv6 provides domain validation for Fly-managed certificates. It waits for a successful HTTPS response before reporting readiness. If CAA records restrict certificate issuers, ensure Fly's current issuer is permitted. Do not enable Cloudflare proxying without revisiting certificate validation; Cloudflare's default edge certificate also does not automatically cover every deeper subdomain.

Each record has an ownership comment. Cleanup removes only exact environment records bearing that comment before deleting the app, avoiding dangling DNS. No wildcard DNS record or permanent routing gateway is required.

### 5. Configure Supabase and Discord

In production Supabase's additional redirect URL allowlist, add the staging root and path patterns, substituting the real owned domain:

```text
https://*.staging.example.com
https://*.staging.example.com/**
```

Keep the production Site URL unchanged. Discord's developer-console callback remains the existing production Supabase `/auth/v1/callback`; staging does not require a separate Discord application. Clocktracker already passes the current web origin as `redirectTo`.

Test existing Discord and password accounts on two simultaneous staging hosts. Confirm that callbacks return to the initiating host, sessions persist on refresh, and a non-admin cannot retrieve data. Verify missing/incorrect redirect configuration does not accidentally send testers to production. Avoid broad `*.fly.dev` allowlists.

## Private GitHub configuration

Create the GitHub Environment `staging-operations`. Restrict deployments to the default branch. The workflow checks out its automation from that branch and the application from the selected trusted ref. The selected ref must contain the current server access controls and Nuxt staging configuration.

Scheduled cleanup must run unattended: do not configure required human reviewers on this environment. Restrict repository write/Actions permissions to trusted operators instead. GitHub concurrency allows one running and one pending operation; newer queued requests may replace older pending requests. Existing deployed environments remain independent.

Create these environment variables:

| Variable | Value |
| --- | --- |
| `STAGING_DOMAIN` | Owned staging parent domain |
| `STAGING_REGION` | Optional app region; defaults to `sjc`; preferably match database region |

Create these environment secrets (names only; never place values in a PR):

| Secret | Purpose |
| --- | --- |
| `STAGING_FLY_API_TOKEN` | Token authorized to create/delete staging apps and restore from the source database in its organization |
| `STAGING_FLY_ORG` | Same Fly organization as the source database |
| `STAGING_SOURCE_DATABASE_APP` | Existing source database app with Tigris/Barman backups enabled |
| `STAGING_DATABASE_NAME` | Application database name inside the backup |
| `STAGING_CLOUDFLARE_API_TOKEN` | DNS Edit token scoped to the domain's zone |
| `STAGING_CLOUDFLARE_ZONE_ID` | Domain's zone ID |
| `STAGING_STATE_BUCKET` | Dedicated private Tigris bucket for lifecycle journals |
| `STAGING_STATE_ACCESS_KEY_ID` | Access key scoped to that state bucket |
| `STAGING_STATE_SECRET_ACCESS_KEY` | Matching secret access key |
| `SUPABASE_URL` | Existing production authentication project URL |
| `SUPABASE_KEY` | Existing public/anon authentication key, **not** a service-role key |

The state bucket is separate from production backups and uploads. Grant list/read/write/delete only for its journal objects. Keep it private and do not configure automatic expiration of active journals: cleanup relies on them. Journals contain resource IDs, selected refs/backups, and timestamps, not credentials or copied application data. The runner does not need a production Tigris backup key; Fly's native restore obtains the archive configuration through the authorized source app.

Cloudflare tokens can be zone-scoped, but this does not restrict a DNS Edit token to only staging records. Store it only in the trusted environment. The Fly token also needs broader rights than an app-only deployment token; follow least privilege supported by Fly and rotate it during handover.

The controller suppresses Fly command output because restore and attachment commands print generated database credentials. It never uploads raw command logs, restore files, or database dumps as public Actions artifacts. On failure, inspect private provider dashboards. Do not rerun the controller with shell tracing or publish provider logs.

## Operation

Run `Temporary staging` from the default branch:

- `up`: choose a trusted application ref, lifetime, and backup (`latest` or a specific Barman ID). The summary returns an environment ID, URL, and UTC expiration.
- `list`: list journaled environments and deadlines.
- `destroy`: supply the exact environment ID to remove it early.
- `extend`: supply the environment ID and requested hours **from now**. Extensions must increase the deadline, cannot revive expired environments, and cannot exceed seven days from original readiness.
- `cleanup`: retry expiration cleanup manually.

Do not deploy a branch containing unreviewed dependency scripts or code. It can access the copied database and production authentication sessions. This workflow is not safe for public fork previews.

Provisioning is journaled before resource creation, with a two-hour recovery deadline. Failed launches attempt immediate cleanup; canceled/timed-out jobs are caught by the scheduled sweep. A launch is not advertised until restore, sanitization, migration, deployment, DNS, and HTTPS readiness complete. Teardown removes DNS, machines, volumes, and apps, then deletes the journal. If any deletion fails, the journal remains for a retry. The permanent state bucket and existing backup retention remain.

If a sweep fails, rerun cleanup and inspect the private provider dashboards. If GitHub scheduling stops, run cleanup manually; public-repository scheduled workflows may be disabled after inactivity. Monitor this workflow during ownership handover. Do not delete the state bucket or revoke cleanup credentials until all staging resources are gone.

## Validation before enabling routine use

Automated checks:

```sh
npm run test:unit
node --test scripts/staging/*.test.mjs
STAGING=true npm run build
npm run build
```

Use disposable infrastructure for the first live validation after configuring secrets:

1. Launch two trusted branches using a recent backup. Confirm distinct app/database resources, URLs, credentials, and independent writes.
2. Verify admin password and Discord sign-in, non-admin denial, anonymous page redirects, and 401 responses from direct data APIs.
3. Confirm only home/login are public pages; check a direct game, user, forum, and community URL and an API URL with a file-like suffix.
4. Verify migrations change only the copied database, copied integration tokens are removed, no scheduled jobs run, and uploads/external writes are blocked.
5. Exercise manual destruction of one environment while the other remains available; verify DNS and volumes disappear.
6. Exercise expiration, extension bounds, a failed provisioning run, a canceled provisioning run, and cleanup retries. Confirm access stops at the deadline even with cleanup deliberately delayed.
7. Confirm production login and application behavior remain unchanged.

Live provisioning depends on the DNS migration and private secrets. Unit/build checks alone do not prove the live restore, provider permissions, or certificate issuance work.

## Ownership handover

Transfer or grant the intended owner access to the GitHub repository/Actions environment, Fly organization and billing, Supabase organization/project and auth settings, Tigris backup/state buckets and billing, Cloudflare account/registrar, Discord application/team, and operational notification channels. Verify backup recovery and cleanup under the new owner's credentials before removing the previous owner's access. Rotate automation credentials and recovery methods, and keep that handover record private.

## Provider references

- [Cloudflare full DNS setup and DNSSEC migration](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Cloudflare Registrar transfers](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/)
- [Transfer away from Hover](https://support.hover.com/support/solutions/articles/201000064729-transferring-your-domain-away-from-hover)
- [Cloudflare DNS API](https://developers.cloudflare.com/api/resources/dns/)
- [Fly custom domains and validation](https://fly.io/docs/networking/custom-domain/)
- [Fly PostgreSQL backup restore command](https://fly.io/docs/flyctl/postgres-backup-restore/)
- [Supabase redirect URL patterns](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Discord authentication](https://supabase.com/docs/guides/auth/social-sign-in/auth-discord)
- [GitHub schedule limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
