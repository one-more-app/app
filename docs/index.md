---
layout: home
title: One More — Documentation
titleTemplate: Docs internes

hero:
  name: One More
  text: Documentation technique
  tagline: Guides ops, specs design et plans d’implémentation du monorepo.
  actions:
    - theme: brand
      text: Outbound & n8n
      link: /outbound-n8n-reference
    - theme: alt
      text: WebSocket / déploiement
      link: /WEBSOCKET

features:
  - title: Ops & intégrations
    details: Outbound marketing, push, WebSocket, AppsFlyer, Notion CRM.
  - title: Specs Superpowers
    details: Décisions produit et architecture avant implémentation.
  - title: Catalogue API live
    details: Segments et templates à jour via GET /internal/outbound/catalog (clé OUTBOUND_API_KEY).
  - title: Copier pour un prompt
    details: Sur chaque page, bouton « Copier le Markdown » — source brute incluant le frontmatter.
  - title: Règles Cursor
    details: Sidebar « Cursor rules » — miroir de .cursor/rules/ (sync au démarrage de la doc).
---

## Démarrer le site en local

```bash
task dev:docs
```

Par défaut [http://localhost:5199](http://localhost:5199) ; si le port est pris, Vite choisit le suivant (client `5173`, API `3000`).
