# Stable staging on Fly with Hover DNS

This is the current staging setup: one persistent environment at **https://staging.clocktracker.app**. It uses production Supabase authentication and an isolated PostgreSQL snapshot restored from the existing Tigris backups. Only home and login are public pages; all data APIs and other pages require an admin in the copied database.

The original [temporary environments and Cloudflare migration runbook](staging.md) is retained for later. Cloudflare migration is not required for this setup. Leave the temporary workflow's repository variable `STAGING_ENABLED` unset/false unless existing temporary environments still need cleanup.

## Resources and behavior

The `Stable staging` workflow uses the fixed Fly names `ct-stg-clocktracker` (web app) and `ct-stg-clocktracker-db` (database). Fly app names are globally unique; provisioning refuses to adopt an existing unjournaled app. If either name is already taken, choose another fixed pair in the controller and update this runbook before provisioning.

This is one staging environment with one web machine and one database machine, not one machine hosting both services. The web machine has one shared CPU and 1 GB RAM. The native database restore inherits production source sizing. Both remain allocated and billed until explicitly destroyed; there is no hourly or seven-day expiration in stable mode.

The first `up` restores and sanitizes the backup, creates a new database login, removes archive access, runs migrations, deploys the app, and requests its TLS certificate. Subsequent `up` runs deploy to the same app and run migrations against the same staging database. They do **not** restore a new snapshot, erase test data, or create another environment. The backup selection only applies to the first launch. Deploying an older application ref does not undo database migrations.

Production Supabase login and Discord use the original account IDs. Admin authorization comes from the restored `UserSettings.is_admin`, not live production role changes. For this long-lived environment, promptly update staging admin membership through a trusted private database session after production administrator changes, or recreate from a newer backup.

Existing staging protections remain: no uploads, external posting, push delivery, account management, cron jobs, analytics, service workers, or production storage-write credentials. See the original runbook for the complete isolation limitations.

## Private GitHub setup

After merging the implementation, create the GitHub environment `staging-operations`, restricted to trusted default-branch workflows. Store these secrets there; never paste their values into public PRs or Actions output:

| Secret | Purpose |
| --- | --- |
| `STAGING_FLY_API_TOKEN` | Create/manage staging apps and restore the configured production backup |
| `STAGING_FLY_ORG` | Organization containing the source database |
| `STAGING_SOURCE_DATABASE_APP` | Production database app with existing Tigris/Barman backups |
| `STAGING_DATABASE_NAME` | Application database inside that backup |
| `STAGING_STATE_BUCKET` | Dedicated private lifecycle journal bucket |
| `STAGING_STATE_ACCESS_KEY_ID` | List/read/write/delete access to the journal bucket |
| `STAGING_STATE_SECRET_ACCESS_KEY` | Matching secret |
| `SUPABASE_URL` | Production Supabase URL |
| `SUPABASE_KEY` | Production public/anon key; never a service-role key |

Set environment variable `STAGING_DOMAIN=staging.clocktracker.app` (also the workflow default). Optionally set `STAGING_REGION`; the web app defaults to `sjc`. No Hover API token or Cloudflare credentials are needed.

The journal uses `staging/stable/v1/`, separate from temporary environments. Keep the bucket private and do not expire its journal. Loss of the journal causes provisioning to refuse to overwrite existing apps. Workflow operations share a concurrency group with temporary management. Do not run concurrent controller processes manually.

## First deployment and Hover DNS

1. Run **Stable staging → up** from the default branch. Select a trusted ref containing the current staging controls and `latest` or a Barman backup ID. The source ref is deployed; management code always comes from the default branch.
2. Wait for the workflow to verify the app's `.fly.dev/login` endpoint. This verifies application readiness, **not** the custom hostname's DNS/TLS.
3. In Hover, open DNS for `clocktracker.app` and add:

   | Type | Host | Target |
   | --- | --- | --- |
   | CNAME | `staging` | `ct-stg-clocktracker.fly.dev` |

   Use Hover's default TTL. Remove any conflicting A/AAAA/CNAME record for this exact host only. Leave production/apex, mail, and nameservers unchanged.
4. Run `flyctl certs show staging.clocktracker.app -a ct-stg-clocktracker` privately. If Fly requests an ownership TXT or ACME validation CNAME, add the exact host/value it reports in Hover. Do not invent validation tokens. The app has IPv6 allocated; the CNAME resolves through Fly.
5. Run `flyctl certs check staging.clocktracker.app -a ct-stg-clocktracker` and verify HTTPS at `https://staging.clocktracker.app/login`. Retain any required validation records for certificate renewal.

Fly documents [custom domains and certificate verification](https://fly.io/docs/networking/custom-domain/). No registrar transfer, nameserver migration, wildcard record, or automated DNS creation is needed.

## Supabase and Discord

In the **existing production Supabase project**, Authentication → URL Configuration → Redirect URLs, add:

- `https://staging.clocktracker.app`
- `https://staging.clocktracker.app/`

The current web Discord component passes the current origin as `redirectTo`; these are exact origins, not a wildcard. Keep the production Site URL and all existing production redirects unchanged. Do not add the Fly hostname unless deliberately enabling login there.

Discord continues redirecting to the same Supabase `/auth/v1/callback` endpoint configured in its developer portal. Staging does not need a new Discord application, client secret, or Discord callback URL because the Supabase project is unchanged. Supabase then redirects to the allowed staging origin. See [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) and [Discord provider configuration](https://supabase.com/docs/guides/auth/social-sign-in/auth-discord).

Verify password and Discord login with an existing admin. Verify a non-admin gets 403, anonymous API requests get 401, and anonymous protected pages redirect to login. Confirm staging logout leaves the production session usable.

## Redeploy, recovery, and removal

- **Redeploy:** run `up` with another trusted ref. DNS, hostname, and database remain stable. Run `list` to see the last successfully recorded ref and original backup.
- **Failed redeploy:** resources and database are retained. Fix the cause and rerun `up`. A failed migration can require private database repair; the script does not reverse migrations.
- **Failed/canceled first launch:** inspect the private Fly dashboard. Partially provisioned resources remain billed. Automatic retries refuse to overwrite an incomplete journal. Remove any staging DNS records, run `destroy` with `dns_removed=true`, then rerun `up`. Initial failure recovery is deliberately explicit because the journal may not reflect which provider operation completed.
- **Fresh snapshot:** remove staging DNS/validation records, run `destroy` with `dns_removed=true`, then `up` with the desired backup and re-add DNS/validation records. This deletes staging data and causes staging downtime. Supabase's fixed allowlist remains valid.
- **Permanent removal:** remove Hover staging DNS/validation records first, then run `destroy` with `dns_removed=true`. Destruction removes both apps, machines, volumes, and journal. Remove the staging redirects from Supabase afterward. Never leave a CNAME pointing at a released Fly name.
- **Future Cloudflare migration:** retain this stable hostname during the DNS transfer, copying all staging and validation records. The separate temporary workflow remains available for a future explicit switch; its sweeper cannot read/delete stable journals.

The controller suppresses provider command output that may contain credentials. Troubleshoot using private dashboards; do not publish raw restore output or snapshots. Live restore, DNS, TLS, and provider login acceptance must be completed after private configuration; unit tests and mocked lifecycle tests do not establish live readiness.
