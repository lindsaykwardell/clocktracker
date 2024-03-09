# Source: https://nuxtjs.org/deployments/koyeb#dockerize-your-application
FROM node:lts as builder

WORKDIR /app

COPY . .

RUN npm install

RUN --mount=type=secret,id=SUPABASE_URL \
    --mount=type=secret,id=SUPABASE_KEY \
    SUPABASE_URL="$(cat /run/secrets/SUPABASE_URL)" \
    SUPABASE_KEY="$(cat /run/secrets/SUPABASE_KEY)" \
    npm run build

FROM node:lts

WORKDIR /app

COPY --from=builder /app .

ENV HOST 0.0.0.0
ENV PORT 8080

# Source: https://nuxt.com/docs/getting-started/deployment#entry-point
CMD ["node", ".output/server/index.mjs"]
