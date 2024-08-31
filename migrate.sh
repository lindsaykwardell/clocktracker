#!/bin/bash

# Run Prisma migrate deploy
npx prisma migrate deploy

# Run the import-roles.js script
node ./prisma/import-roles.js