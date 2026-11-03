# Temporary staging with a fixed Fly URL

The current setup runs one temporary staging environment at **https://clocktracker-staging.fly.dev**. Only its URL is permanent. Each run restores a fresh sanitized snapshot from the existing Tigris backups and expires after 1–168 hours (default one hour).

Production Supabase authentication, existing account IDs, Discord login, and admin-only access remain unchanged. Only home and login are public pages, with their required static assets. All data APIs and other pages require an admin from the copied database.

The [multiple temporary environments and Cloudflare migration runbook](staging.md) remains available for future use. No Hover DNS or Cloudflare setup is needed for the fixed Fly hostname.

## Lifecycle

- **up:** restore the selected backup, sanitize copied data and database logins, deploy the trusted ref, and start the requested lifetime after HTTPS readiness.
- **list:** show the active run or idle reservation.
- **extend:** increase an active run's deadline, up to seven days total from readiness.
- **destroy:** end the run early and remove its web/database machines and volumes.
- **cleanup:** remove expired or interrupted runs; scheduled every 15 minutes.

Only one run can exist at a time. A second up refuses to overwrite an active run; extend it, or destroy it before starting a new run. Every new run restores a fresh snapshot, so staging changes are discarded between runs.

The controller retains the empty Fly web app named clocktracker-staging, its default hostname/IP assignments, and its private lifecycle journal. It removes every web machine and volume, deletes the restored database app and its machines/volumes, and clears runtime secrets without redeploying. Retaining the app name prevents another Fly user from claiming the Supabase-allowlisted hostname. The URL serves no application between runs.

The database app is ct-stg-clocktracker-db. App names are globally unique; first launch refuses to adopt an existing unjournaled app. If the desired name is unavailable, choose a different fixed name in the controller and update the hostname and Supabase allowlist before launch. Do not delete the reserved app while its URL remains authorized in Supabase.

## Private setup

Create the GitHub environment staging-operations, restricted to trusted default-branch workflows. Configure these secrets privately:

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

Set the **repository-level** Actions variable STAGING_STABLE_ENABLED=true to enable this workflow's scheduled cleanup. Launch refuses to proceed without it. Keep it enabled until every active or partially provisioned run has been cleaned up. The separate STAGING_ENABLED variable controls the original multi-environment workflow; leave it off unless that workflow is in use.

Optionally set the staging-operations environment variable STAGING_REGION; the web app defaults to sjc. No STAGING_DOMAIN, Hover token, or Cloudflare credentials are needed.

Keep the state bucket private, and do not automatically expire its journals. The fixed slot uses staging/stable/v1/, separate from random environments. An idle journal records ownership of the reserved app. Losing it requires private manual recovery; the controller refuses to adopt an unjournaled app. Both workflows share a concurrency group. Do not run parallel controller processes manually.

## Supabase and Discord

In the existing production Supabase project, Authentication → URL Configuration → Redirect URLs, add exactly:

- https://clocktracker-staging.fly.dev
- https://clocktracker-staging.fly.dev/

The Discord web component passes the current origin as redirectTo. Keep the production Site URL and existing redirects unchanged. If the unused staging.clocktracker.app entries were added earlier, remove those unused entries.

Discord's configured callback remains the existing Supabase /auth/v1/callback endpoint. No new Discord application or secret is required. Supabase redirects back to the fixed Fly URL after authentication. See [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) and [Discord configuration](https://supabase.com/docs/guides/auth/social-sign-in/auth-discord).

Fly provides the default fly.dev hostname and HTTPS; no custom certificate command or DNS record is created. See [Fly public network services](https://fly.io/docs/networking/services/).

## Running and verifying

After merge and private configuration, run **Fixed URL staging → up** from the default branch. Select a trusted ref containing the current staging controls, a backup (latest or Barman ID), and 1–168 hours. The workflow reports the fixed URL and UTC expiry.

Verify password and Discord login with an existing admin, non-admin 403 responses, anonymous API 401 responses, and anonymous protected-page redirects. Confirm staging logout leaves production sessions usable. After destroy or scheduled cleanup, verify the web app has zero machines/volumes and the staging database app is gone. Launch again and confirm a fresh backup is restored at the same URL.

The application rejects all page/API requests after the deadline, including home/login. Cleanup is scheduled every 15 minutes, but GitHub schedules are best effort: access expires at the deadline; actual resource deletion and billing can lag. Monitor cleanup failures and use manual cleanup when needed. A strict destruction deadline requires an independent scheduler.

Failed launches attempt cleanup immediately. Cancellation leaves a two-hour provisional deadline for the sweeper. Failed teardown keeps a retryable journal; rerun cleanup or destroy. Never remove the journal to bypass an incomplete run.

For permanent retirement, first remove the Fly URL from the Supabase allowlist, destroy the run, then manually remove the empty Fly app and its idle journal. Routine teardown must retain that app reservation.

## Cost and isolation

During a run there is one web machine (one shared CPU, 1 GB RAM) plus a restored database machine and volume. Native restore inherits the source database sizing. Teardown removes these billable compute/volume resources rather than merely stopping them. The app reservation uses shared IPv4 and IPv6, with no dedicated IPv4 allocation. The private state bucket, backup storage, and any account-level or retained-image charges remain subject to provider billing. See [Fly pricing](https://fly.io/docs/about/pricing/).

Admin membership comes from the restored UserSettings.is_admin snapshot. Destroy/recreate after production admin changes, choosing a current backup. Existing guards block uploads, external posting, notifications, cron jobs, account management, service workers, and analytics. The [original runbook](staging.md) details backup isolation and shared Supabase limitations.

No live resources, DNS records, or provider settings are changed by merging alone. Live restore and login acceptance require private configuration. Tests use mocked infrastructure and cannot establish live readiness.
