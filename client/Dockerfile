# syntax=docker/dockerfile:1
#
# Construire avec la racine du repo comme contexte (inclut /shared) :
#   docker build -f client/Dockerfile -t one-more-client .

FROM node:22-bookworm-slim AS build
WORKDIR /app/client

# Dépendances du client (postinstall = patches Capacitor mobile, inutiles pour le web)
COPY client/package.json client/package-lock.json ./
RUN npm ci --ignore-scripts

# Sources nécessaires au build Vite (client + shared)
COPY client /app/client
COPY shared /app/shared

ARG VITE_API_URL=
ARG VITE_APPLE_APP_ID=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APPLE_APP_ID=${VITE_APPLE_APP_ID}

RUN npm run build

FROM nginx:1.27-alpine AS production
RUN apk add --no-cache jq
COPY client/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
