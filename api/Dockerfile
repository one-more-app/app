# syntax=docker/dockerfile:1
#
# Construire depuis la racine du dépôt (workspaces npm) :
#   docker build -f api/Dockerfile -t one-more-api .

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY api/package.json ./api/
RUN npm ci

COPY api ./api
RUN npm run build -w api \
  && npm prune --omit=dev

FROM node:22-bookworm-slim AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/client/package.json ./client/package.json
COPY --from=build /app/api/package.json ./api/package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/api/dist ./api/dist

WORKDIR /app/api
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
