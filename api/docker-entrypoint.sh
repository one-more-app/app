#!/bin/sh
set -e
cd /app/api
npm run typeorm:migrate:prod
exec "$@"
