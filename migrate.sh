#!/bin/bash

# Run Prisma migrate deploy
npx prisma migrate deploy

# Run the import-roles.js script
npx tsx ./prisma/import-roles.js