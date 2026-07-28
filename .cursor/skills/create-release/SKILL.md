---
name: create-release
description: Crée une GitHub Release One More (tag semver + notes FR) à partir des commits depuis la dernière release. Utiliser quand l'utilisateur demande une release, un tag, des release notes, un changelog de version, ou « ship » / « publier une version ».
---

# Créer une release GitHub (One More)

## Déclencheurs

- « crée une release »
- « release notes »
- « tague v0.x.y »
- « publie une version »
- « changelog depuis la dernière release »

## Prérequis

- Repo `one-more-app/app`, branche à jour avec `origin` (souvent `main`).
- `gh` auth OK. Si `gh` snap timeout : `sudo snap refresh gh` ou installer le binaire GitHub CLI hors snap.
- Ne **jamais** forcer-push ni supprimer un tag remote sans demande explicite.

## Workflow obligatoire

```
- [ ] 1. Identifier la dernière release / tag semver valide
- [ ] 2. Lister les commits depuis ce tag jusqu'à HEAD (ou tip demandé)
- [ ] 3. Proposer le prochain numéro de version + mode de notes
- [ ] 4. Rédiger les notes (calquées sur les releases existantes)
- [ ] 5. Faire valider le body par l'utilisateur
- [ ] 6. Créer le tag + GitHub Release (ou draft si demandé)
- [ ] 7. Renvoyer l'URL de la release
```

**Ne pas publier** (étape 6) sans validation explicite du numéro de version et du texte des notes.

## Étape 1 : dernière release

```bash
# Tags semver vX.Y.Z (ignorer les malformés v.0.0.x)
git fetch --tags origin
git tag -l 'v[0-9]*' --sort=-v:refname | head -20

# Releases GitHub (source de vérité préférée)
gh release list --limit 10
```

Prendre le **plus récent tag `vX.Y.Z`** qui a une GitHub Release. Si divergence tag/release, demander à l'utilisateur.

## Étape 2 : commits depuis la dernière release

```bash
LAST=v0.1.6   # remplacer
git log "$LAST"..HEAD --pretty=format:'%h %s' --no-merges
git log "$LAST"..HEAD --pretty=format:'%h%n%s%n%b%n---' --no-merges
```

Regrouper par type conventional commit :

| Préfixe | Section notes |
|---------|---------------|
| `feat` | Nouveautés |
| `fix` | Corrections |
| `perf`, `refactor` (impact user) | Nouveautés ou Corrections selon le fond |
| `chore`, `docs`, `test`, `ci`, `style` | Divers (ou omettre si purement interne) |
| `BREAKING CHANGE` / `!` | Mentionner en tête + bump majeur |

Ignorer les commits sans valeur produit (typos de message, sync binaires seuls) ou les fusionner en une ligne « Divers » courte.

## Étape 3 : version et mode

### Semver (défaut One More)

Historique récent : bumps **patch** même pour des `feat` (`v0.1.4` → `v0.1.5` → `v0.1.6`).

| Signal | Suggestion |
|--------|------------|
| `feat` / correctifs | patch (`0.1.6` → `0.1.7`) sauf demande contraire |
| breaking explicite | minor (`0.1.x` → `0.2.0`) |
| l'utilisateur impose `vX.Y.Z` | respecter tel quel |

Proposer : `Release vX.Y.Z` (titre GitHub) et tag `vX.Y.Z`.

### Modes de notes

Demander (défaut = **changelog**) :

1. **changelog** : structure technique FR type `v0.1.1` / `v0.1.2` (GitHub).
2. **store** : copy produit courte type `v0.1.4` (tutoiement, sans hashes).

Les releases `v0.1.5`/`v0.1.6` (lien Full Changelog seul) sont un **anti-pattern** : ne pas reproduire sauf demande « notes minimales ».

### Versions natives

`client/android/.../versionName` et `MARKETING_VERSION` iOS peuvent être **désynchronisées** des tags GitHub. Ne les bump **que** si l'utilisateur le demande explicitement dans la même requête.

## Étape 4 : rédaction des notes

### Règles copy (obligatoires)

Suivre `.cursor/rules/copywriting-french.mdc` :

- Interdit : `--` et `—` (cadratin) dans le body.
- Préférer `.` `,` `:` `·` `–`.
- Tutoiement, phrases courtes, pas de marketing creux.
- Titre : `# One More · Notes de version` (pas de cadratin).

### Mode changelog (défaut)

Calquer [examples.md](examples.md) (échantillons `v0.1.1` / `v0.1.2` nettoyés).

```markdown
# One More · Notes de version

**Période couverte :** JJ → JJ mois AAAA
**Contributeurs :** [login](https://github.com/one-more-app/app/commits?author=login), …

## Nouveautés

- **Titre court** : description orientée utilisateur/impact. ([abc1234](https://github.com/one-more-app/app/commit/abc1234…))

## Corrections

- **Titre court** : …

## Divers

- **Titre court** : …

**Full Changelog**: https://github.com/one-more-app/app/compare/vA.B.C...vX.Y.Z
```

Règles de formulation :

- Titre en gras = bénéfice ou objet produit, pas le subject git brut.
- Une puce par thème cohérent (plusieurs commits proches → une puce).
- Lien commit court (`7` chars) vers `https://github.com/one-more-app/app/commit/<fullsha>`.
- Omettre une section vide.
- Contributeurs : logins uniques des commits de la plage (ignorer bots si peu utiles).
- Dates : première → dernière date des commits de la plage (fuseau FR ok).

### Mode store

Calquer le ton `v0.1.4` :

```markdown
Titre feature

Une ou deux phrases tutoiement, concrètes.

Autre feature

…

Quelques retouches sous le capot que tu ne verras pas, mais que tu ressentiras.
```

Pas de hashes, pas de jargon API, pas de `--` / `—`.

## Étape 5 : validation

Montrer à l'utilisateur :

1. Tag cible (`vX.Y.Z`)
2. Base (`LAST` → `HEAD` ou SHA)
3. Body markdown complet
4. Draft ou publish

Attendre OK avant `gh release create`.

## Étape 6 : créer la release

Préférer créer **tag + release** en une commande (pas de tag annoté séparé sauf demande) :

```bash
# Publish
gh release create "vX.Y.Z" \
  --target main \
  --title "Release vX.Y.Z" \
  --notes-file /tmp/one-more-release-notes.md

# Draft (si l'utilisateur préfère relire sur GitHub)
gh release create "vX.Y.Z" \
  --target main \
  --title "Release vX.Y.Z" \
  --notes-file /tmp/one-more-release-notes.md \
  --draft
```

Écrire le body via HEREDOC dans un fichier temp (évite les soucis de quoting) :

```bash
cat > /tmp/one-more-release-notes.md <<'EOF'
…notes…
EOF
```

Si le tag existe déjà localement/remote sans release : `gh release create vX.Y.Z --notes-file …` sans recréer le tag.

Si `HEAD` n'est pas sur `main` : confirmer `--target` (branche ou SHA).

Push : `gh release create` pousse le tag si besoin. Ne pas `git push --force`.

## Étape 7 : vérifier

```bash
gh release view "vX.Y.Z"
```

Renvoyer l'URL `https://github.com/one-more-app/app/releases/tag/vX.Y.Z`.

## Pièges connus

| Symptôme | Action |
|----------|--------|
| `gh` snap timeout | Refresh snap ou CLI hors snap ; sinon API `gh` via binaire ok |
| Tags `v.0.0.x` | Ignorer (malformés) |
| Un seul gros commit feat | Notes = expansion du body du commit, ton produit |
| Que des `chore` | Patch + section Divers courte, ou reporter la release |
| Contenu sensible dans le diff | Ne pas citer secrets / mots de passe admin dans les notes |

## Références

- Exemples de body : [examples.md](examples.md)
- Copy FR : `.cursor/rules/copywriting-french.mdc`
