FROM node:22-bookworm AS builder
WORKDIR /app
COPY . .
RUN npm ci
ENV STAGING=true
RUN --mount=type=secret,id=SUPABASE_URL --mount=type=secret,id=SUPABASE_KEY \
    SUPABASE_URL="$(cat /run/secrets/SUPABASE_URL)" \
    SUPABASE_KEY="$(cat /run/secrets/SUPABASE_KEY)" npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production STAGING=true HOST=0.0.0.0 PORT=8080
COPY --from=builder /app /app
CMD ["node", "--max-old-space-size=512", ".output/server/index.mjs"]
