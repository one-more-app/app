# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app/api

# Dépendances API
COPY api/package.json api/package-lock.json ./
RUN npm ci

# Sources API + shared (consommé par src via ../shared/*)
COPY api /app/api
COPY shared /app/api/src/shared

RUN npm run build \
  && npm prune --omit=dev

FROM node:22-bookworm-slim AS production
WORKDIR /app/api

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/api/package.json ./
COPY --from=build /app/api/node_modules ./node_modules
COPY --from=build /app/api/dist ./dist
COPY --from=build /app/api/data ./data

COPY api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && chown -R node:node /app/api

USER node
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
