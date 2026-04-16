#!/bin/sh
set -e
if [ -n "${VITE_API_URL}" ]; then
  escaped=$(printf '%s' "${VITE_API_URL}" | jq -Rs .)
  printf 'window.__ONE_MORE_API_URL__=%s;\n' "${escaped}" > /usr/share/nginx/html/runtime-env.js
else
  printf '%s\n' '/* VITE_API_URL non défini au runtime : utiliser la valeur du build ou localhost. */' > /usr/share/nginx/html/runtime-env.js
fi
exec nginx -g "daemon off;"
