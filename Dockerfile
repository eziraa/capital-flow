# syntax=docker/dockerfile:1

# Using slim (Debian) rather than alpine — Prisma's query engine binaries
# are notoriously fragile on musl libc (alpine) without extra OpenSSL
# wrangling, and this image is meant to just work for someone who has never
# touched the project.
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps: install once, cached as long as the lockfile doesn't change ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ---- builder: generate the Prisma client and build the Next.js app ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy build-time values — Next.js's build step never opens a real
# connection, but importing next-auth's config eagerly reads env vars.
# The real values are supplied at container runtime by docker-compose.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
ENV AUTH_SECRET="build-time-placeholder-not-used-at-runtime"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ---- runner: the actual image the hiring manager runs ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Full node_modules (not a pruned "standalone" bundle) so the entrypoint can
# also run `prisma migrate deploy` and the seed script, not just `next start`.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 \
  CMD node -e "fetch('http://localhost:3000/api/auth/providers').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
