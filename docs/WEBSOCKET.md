# WebSocket (Socket.IO) — déploiement API

L'app mobile et web se connecte au namespace Socket.IO `/realtime` sur la même origine que l'API REST (`VITE_API_URL` → `wss://api.one-more.app/realtime`).

Socket.IO expose le transport sur le chemin **`/socket.io/`** (le namespace applicatif reste `/realtime`).

## Fichiers de config (dépôt)

| Fichier | Usage |
|---------|--------|
| [`deploy/nginx/api.conf`](../deploy/nginx/api.conf) | VPS nginx (prod / staging) avec HTTPS |
| [`deploy/nginx/api.docker.conf`](../deploy/nginx/api.docker.conf) | Proxy Docker vers le service `api` |
| [`deploy/nginx/snippets/websocket.conf`](../deploy/nginx/snippets/websocket.conf) | En-têtes Upgrade / timeouts |
| [`deploy/traefik/docker-compose.labels.example.yml`](../deploy/traefik/docker-compose.labels.example.yml) | Labels Traefik / Dokploy |

## Déploiement nginx (VPS)

```bash
sudo mkdir -p /etc/nginx/snippets
sudo cp deploy/nginx/snippets/websocket.conf /etc/nginx/snippets/onemore-websocket.conf
sudo cp deploy/nginx/api.conf /etc/nginx/sites-available/onemore-api.conf
# Éditer ssl_certificate* si le certificat staging est sur un autre chemin
sudo ln -sf /etc/nginx/sites-available/onemore-api.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Points importants :

- `location /socket.io/` **et** `location /` doivent inclure le snippet WebSocket (`Upgrade`, `Connection`, timeouts longs).
- L'upstream pointe vers Nest sur le port **3000** (ou le port exposé par Docker).

## Docker Compose (test local)

```bash
docker compose --profile stack up -d --build
curl -i "http://localhost:3080/socket.io/?EIO=4&transport=polling"
```

Réponse attendue : HTTP 200 avec un corps contenant `sid=` (session Socket.IO), pas 404.

## Dokploy / Traefik

Traefik gère en général les WebSockets automatiquement : le routeur doit cibler le **port HTTP de l'API** (3000), sans chemin spécial. Voir l'exemple de labels dans `deploy/traefik/`.

Si les connexions échouent derrière Traefik :

1. Vérifier que le healthcheck n'interrompt pas les connexions longues.
2. Vérifier qu'aucun middleware ne bufferise le corps des requêtes upgrade.
3. Tester en polling : `curl` ci-dessous sur l'URL publique.

## Vérification (staging / prod)

```bash
curl -i "https://api.staging.one-more.app/socket.io/?EIO=4&transport=polling"
curl -i "https://api.one-more.app/socket.io/?EIO=4&transport=polling"
```

## Auth

Le client envoie le JWT access token dans `auth.token` au handshake. Pas de cookie requis.

## Multi-instances (plus tard)

Si plusieurs replicas API : ajouter `@socket.io/redis-adapter` pour synchroniser les rooms entre pods.
