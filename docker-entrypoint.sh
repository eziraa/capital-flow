#!/bin/sh
set -e

echo "==> Applying database migrations..."
npx prisma migrate deploy

echo "==> Checking whether the database needs seeding..."
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then((count) => { console.log(count); return prisma.\$disconnect(); })
  .catch(() => { console.log('0'); });
" 2>/dev/null | tail -n 1)

if [ "$USER_COUNT" = "0" ]; then
  echo "==> Database is empty — seeding demo data..."
  npx prisma db seed
else
  echo "==> Database already has data (users: $USER_COUNT) — skipping seed."
fi

echo "==> Starting Next.js on port ${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}"
