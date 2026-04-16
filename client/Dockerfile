# syntax=docker/dockerfile:1
#
# Construire avec le dossier client comme contexte :
#   docker build -f client/Dockerfile -t one-more-client ./client

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=
ARG VITE_APPLE_APP_ID=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APPLE_APP_ID=${VITE_APPLE_APP_ID}

RUN npm run build

FROM nginx:1.27-alpine AS production
RUN apk add --no-cache jq
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
