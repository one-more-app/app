#!/bin/sh
set -e
cd /app
npm run typeorm:migrate:prod
exec "$@"
