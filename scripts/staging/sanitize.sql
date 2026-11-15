\set ON_ERROR_STOP on
BEGIN;
DELETE FROM public."PushSubscription";
DELETE FROM public."FcmToken";
UPDATE public."UserSettings" SET bgg_cookies = '{}', push_notifications_enabled = false;
DELETE FROM public."CronLock";
-- The restore includes cluster roles. Retire copied application logins; Fly
-- maintains its own freshly generated operator and replication credentials.
SELECT format('ALTER ROLE %I NOLOGIN PASSWORD NULL', rolname)
FROM pg_roles WHERE rolcanlogin AND rolname NOT IN ('postgres', 'repmgr', 'flypgadmin')
\gexec
COMMIT;
