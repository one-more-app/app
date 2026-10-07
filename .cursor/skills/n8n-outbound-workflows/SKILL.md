---
name: n8n-outbound-workflows
description: Crée, modifie et maintient à jour les workflows n8n Outbound de One More (campagnes marketing, sous-workflows Appel API / Envoi unitaire / Dispatch segment, catalogue) via le MCP n8n, avec n8n/outbound/*.workflow.ts comme source de vérité. Utiliser quand l'utilisateur parle de workflow n8n, campagne outbound, winback, relance, dispatch segment, ou quand le contrat /internal/outbound/* change côté API.
---

# Workflows n8n · Outbound One More

## Sources de vérité

| Quoi | Où |
|------|----|
| Code des workflows (Workflow SDK) | `n8n/outbound/subs/*.workflow.ts`, `n8n/outbound/campaigns/*.workflow.ts` |
| Registre (IDs n8n, statut publié, SQL templates) | `n8n/outbound/README.md` |
| Contrat API | `docs/outbound-n8n-reference.md` + `api/src/outbound/` |
| Templates et segments live | `GET /internal/outbound/catalog` (workflow « Catalogue (manuel) ») |

Le fichier du repo et le workflow n8n doivent rester identiques. On édite **d'abord le fichier**, puis on pousse sur n8n.

## Règles non négociables

1. **Clé API** : uniquement dans `[Sub] Appel API` → node `Config API One More` → `outboundApiKey`. Dans le repo la valeur reste `TO_CHANGE`. Ne jamais écrire la vraie clé dans un fichier, un commit ou un message.
2. **Pas de HTTP direct vers l'API** dans les autres workflows : toujours passer par `[Sub] Appel API` (ID `iQYqQdhUqtZuw4gA`), `[Sub] Envoi unitaire` ou `[Sub] Dispatch segment`.
3. **Ne pas recréer les crons lifecycle** déjà dans l'API (`weekly_recap`, `streak_at_risk`, `training_reminder`, `monthly_ranking_recap`, `new_user_d1_*`) : double envoi garanti.
4. **Dispatch = zéro variable** : un template utilisé via `dispatch` doit avoir `variables: []`, sinon chaque message échoue (« Variable manquante »). Les campagnes vérifient le template dans le catalogue avant de dispatcher.
5. **Idempotence** : `n8n:<campagne>:<période>`. La période (`yyyy-MM`, `kkkk-'W'WW`, `yyyy-MM-dd`) fixe la fréquence max par utilisateur. Ne jamais utiliser `$execution.id` ou `$now.toISO()` comme clé.
6. **Email marketing** : template `category: marketing` obligatoire (consentement + désinscription). Copy en tutoiement, sans `--` ni `—`.
7. **Nouvelles campagnes créées non publiées.** Publier seulement si l'utilisateur le demande explicitement.

## Conventions

- Nom n8n : `One More · Outbound · <Type> · <Nom>` ; types : `[Sub]`, `Campagne`, ou outil (`Catalogue (manuel)`).
- Fichier : `subs/0N-…` (briques) ou `campaigns/1N-…` (campagnes). Le MCP n8n de cette instance ne crée pas de dossiers : préfixe de nom + tags.
- `workflow('<id-stable>', '<nom n8n>')` avec id `one-more-outbound-<slug>`.
- Noms de nodes en français, explicites (« Paramètres campagne », « Lire le catalogue »).
- Tags : `one-more`, `outbound` (+ `campagne` pour les campagnes). Fuseau workflow `Europe/Paris` dès qu'il y a un schedule.
- Paramètres d'une campagne regroupés dans un Set `Paramètres campagne` en tête, référencés via `$("Paramètres campagne").first().json.*`.
- Sticky note par workflow : rôle, entrées, pièges. Grouper les nodes si plus de 7 blocs au top level.

## Procédure MCP (namespace `project-0-one-more-n8n-mcp`)

```
- [ ] 1. get_user_preferences
- [ ] 2. Lire n8n/outbound/README.md (IDs) et le fichier .workflow.ts concerné
- [ ] 3. get_workflow_details(id) : vérifier que n8n n'a pas divergé du repo (édition manuelle dans l'UI ?)
- [ ] 4. Éditer le fichier .workflow.ts
- [ ] 5. get_workflow_sdk_reference / get_node_types si nouveaux nodes ou paramètres
- [ ] 6. validate_workflow(code du fichier) jusqu'à valid: true
- [ ] 7. Pousser sur n8n (voir ci-dessous)
- [ ] 8. Mettre à jour le registre du README (ID, statut publié)
- [ ] 9. Lancer « Catalogue (manuel) » si un template ou la clé a changé
```

**Pousser une modification**

- Changement de paramètres sur un node existant → `update_workflow` avec `updateNodeParameters` / `setNodeParameter` (garde l'ID, l'historique et la clé déjà saisie).
- Changement de structure (nodes, connexions) → `update_workflow` avec `addNode` / `removeNode` / `addConnection` / `removeConnection` dans un seul batch.
- **Ne jamais** recréer `[Sub] Appel API` : la vraie clé saisie dans l'UI serait perdue et tous les appelants pointent sur son ID.
- Si n8n a divergé (étape 3) : reporter le changement de l'UI dans le fichier avant toute autre modification, sauf la valeur de `outboundApiKey`.

**Créer une campagne**

1. Copier `campaigns/10-campaign-winback-14d.workflow.ts` → `campaigns/1N-campaign-<slug>.workflow.ts`.
2. Adapter `Paramètres campagne` (segment, params, templateKey, channel, clés), le schedule et le garde-fou (catégorie/canal attendus).
3. `validate_workflow` → `create_workflow_from_code` (avec `description` et `versionName`) → `update_workflow` : `setWorkflowSettings { timezone: 'Europe/Paris' }` + `addTags`.
4. Ajouter la ligne au registre et le SQL du template au README si le template n'existe pas.

**Le contrat API change** (`api/src/outbound/dto`, `segments/segment-catalog.ts`, contrôleur)

- Mettre à jour les entrées des sous-workflows (`workflowInputs`) et le `body` construit dans `[Sub] Envoi unitaire` / `[Sub] Dispatch segment`.
- Mettre à jour les `schema` des nodes `Execute Sub-workflow` appelants (mêmes noms et types que le trigger appelé).
- Mettre à jour `docs/outbound-n8n-reference.md`.

## Pièges connus

- Les sous-workflows (trigger « Execute Workflow ») ne s'exécutent pas via le MCP : tester via « Catalogue (manuel) » ou un run manuel dans l'UI.
- `get_workflow_details` exige `detailLevel: 'full'` pour voir nodes et connexions.
- Groupes : un groupe a une seule entrée et une seule sortie ; le node de sortie ne doit pas avoir de successeur dans le groupe.
- Sondage du dispatch : `$runIndex` du Switch compte les tours (60 × 10 s). Augmenter si une audience dépasse ~5000.
