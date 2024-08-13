-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "old_icon" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "old_image" TEXT;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "old_image_urls" TEXT[];

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "old_avatar" TEXT;

-- Set the values for the old_* columns to the current values
UPDATE "Community" SET "old_icon" = "icon";
UPDATE "Game" SET "old_image_urls" = "image_urls";
UPDATE "UserSettings" SET "old_avatar" = "avatar";
UPDATE "Event" SET "old_image" = "image";

-- Update the values in the current columns to point at the new URL
update "UserSettings" set avatar = replace(avatar, 'https://mpagoleesnkajmeumbpb.supabase.co/storage/v1/object/public', 'https://fly.storage.tigris.dev/clocktracker-storage') where avatar like '%https://mpagoleesnkajmeumbpb.supabase.co/storage/v1/object/public%';
update "Community" set icon = replace(icon, 'https://mpagoleesnkajmeumbpb.supabase.co/storage/v1/object/public', 'https://fly.storage.tigris.dev/clocktracker-storage') where icon like '%https://mpagoleesnkajmeumbpb.supabase.co/storage/v1/object/public%';
update "Event" set image = replace(image, 'https://mpagoleesnkajmeumbpb.supabase.co/storage/v1/object/public', 'https://fly.storage.tigris.dev/clocktracker-storage') where image like '%https://mpagoleesnkajmeumbpb.supabase.co/storage/v1/object/public%';
update "Game" set image_urls = array(select replace(url, 'https://mpagoleesnkajmeumbpb.supabase.co/storage/v1/object/public', 'https://fly.storage.tigris.dev/clocktracker-storage') from unnest(image_urls) as url) where array(select replace(url, 'https://mpagoleesnkajmeumbpb.supabase.co/storage/v1/object/public', 'https://fly.storage.tigris.dev/clocktracker-storage') from unnest(image_urls) as url) != image_urls;