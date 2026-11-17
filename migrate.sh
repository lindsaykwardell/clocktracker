#!/bin/bash
set -euo pipefail

# Move embedded images before schema migrations that may index token URLs.
npx tsx ./prisma/migrate-embedded-images.ts

# Run Prisma migrate deploy
npx prisma migrate deploy

# Run the import-roles.js script
npx tsx ./prisma/import-roles.js
