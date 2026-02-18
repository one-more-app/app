# Analyse du mapping exercices → types de standards (ligues)

## Sources des noms d'exercices

| Source | Langue | Exemple |
|--------|--------|---------|
| API ExerciseDB | Anglais | `barbell bench press`, `lat pulldown` |
| Exercices personnalisés | FR ou EN | `Développé couché`, `Tirage corde triceps` |
| Dictionnaire EXERCISE_NAMES | Clé EN → Val FR | 140+ exercices |

---

## Ordre actuel des conditions (priorité haute → basse)

1. **bench** : bench press, développé couché, chest press
2. **squat** : squat (exclut bulgarian, hack, leg press)
3. **deadlift** : deadlift, soulevé de terre, romanian, sumo
4. **overhead** : military press, overhead press, développé militaire/épaules, shoulder press, arnold press
5. **triceps** : tricep, triceps, extension triceps, pushdown
6. **row** : row, rowing, bent over, pulldown, tirage, lat pulldown
7. **null** : tout le reste

---

## Analyse exercice par exercice (EXERCISE_NAMES)

### ✅ PECTORAUX

| Nom API (EN) | Nom FR | Mapping actuel | Correct ? |
|--------------|--------|----------------|-----------|
| bench press | Développé couché | bench | ✅ |
| barbell bench press | Développé couché barre | bench | ✅ |
| dumbbell bench press | Développé couché haltères | bench | ✅ |
| incline bench press | Développé incliné | bench | ⚠️ Incliné = moins de charge, ratio différent ? |
| barbell incline bench press | Développé incliné barre | bench | ⚠️ idem |
| dumbbell incline press | Développé incliné haltères | bench | ⚠️ idem |
| chest press | Développé pectoraux | bench | ✅ |
| close grip bench press | Développé couché prise serrée | bench | ⚠️ **CONFLIT** : prise serrée = plus triceps, souvent mappé triceps ailleurs |
| push-up, wide push-up, diamond push-up, decline push-up | Pompes | null | ❌ Poids du corps, ratio différent |
| cable crossover, pec deck fly, dumbbell fly, etc. | Écartés | null | ⏸️ Isolation, pas de standard 1RM classique |
| dumbbell pullover | Pull-over haltère | null | ⏸️ Mouvement hybride pectoraux/dos, pas de standard row |

### ✅ ÉPAULES

| Nom API (EN) | Nom FR | Mapping actuel | Correct ? |
|--------------|--------|----------------|-----------|
| military press | Développé militaire | overhead | ✅ |
| overhead press | Développé épaules | overhead | ✅ |
| barbell military press | Développé militaire barre | overhead | ✅ |
| dumbbell shoulder press | Développé haltères | overhead | ✅ |
| arnold press | Développé Arnold | overhead | ✅ |
| upright row | Rowing menton | row | ⚠️ **DISCUTABLE** : rowing menton = épaules/trapèzes, pas tirage dos. Ratio très différent. |
| barbell upright row | Rowing menton barre | row | ⚠️ idem |
| front raise, lateral raise, rear delt fly, etc. | Élévations, Oiseau | null | ⏸️ Isolation, pas de standard |
| face pull | Face pull | row | ⚠️ Face pull = petite charge, isolation dos/épaules. Proche de row en mouvement mais charge très faible |

### ✅ DOS / ROW

| Nom API (EN) | Nom FR | Mapping actuel | Correct ? |
|--------------|--------|----------------|-----------|
| bent over row | Rowing buste penché | row | ✅ |
| barbell bent over row | Rowing barre buste penché | row | ✅ |
| dumbbell bent over row | Rowing haltères buste penché | row | ✅ |
| one arm row | Rowing un bras | row | ✅ |
| t-bar row | Rowing barre T | row | ✅ |
| seated row | Rowing assis | row | ✅ |
| cable seated row | Tirage horizontal | row | ✅ |
| cable low seated row | Tirage horizontal bas | row | ✅ |
| inverted row | Tirage inversé | row | ⚠️ Poids du corps, ratio différent (angle) |
| chin-up, pull-up | Tractions | row | ⚠️ Poids du corps, ratio = répétitions ou +poids. Standards différents |
| lat pulldown | Tirage vertical | row | ✅ |
| cable pulldown | Tirage vertical poulie | row | ✅ |
| close grip lat pulldown | Tirage vertical prise serrée | row | ✅ |
| straight arm pulldown | Tirage bras tendus | row | ⚠️ Isolation, mouvement différent |

### ✅ JAMBES

| Nom API (EN) | Nom FR | Mapping actuel | Correct ? |
|--------------|--------|----------------|-----------|
| squat | Squat | squat | ✅ |
| barbell squat | Squat barre | squat | ✅ |
| front squat | Squat avant | squat | ✅ (ratio légèrement plus bas en général) |
| barbell front squat | Squat avant barre | squat | ✅ |
| goblet squat | Squat goblet | squat | ⚠️ Charge limitée par le goblet, ratio plus bas |
| bodyweight squat | Squat au poids du corps | squat | ❌ **FAUX** : pas de charge externe, null ou type spécial |
| leg press | Presse à cuisses | null | ⚠️ Exercice lourd, pourrait avoir type "leg-press" |
| hack squat | Hack squat | null (exclu) | ⚠️ Proche du squat, ratio similaire |
| bulgarian split squat | Squat bulgare | null (exclu) | ⚠️ Unilateral, ratio différent |
| lunge, walking lunge | Fente | null | ⏸️ Unilateral |
| leg extension | Extension de jambes | null | ⏸️ Isolation |
| leg curl | Leg curl | null | ⏸️ Isolation ischio |
| calf raise | Mollets | null | ⏸️ Isolation |
| hip thrust | Hip thrust | null | ⚠️ Gros mouvement fessiers, pourrait avoir type |
| glute bridge | Pont fessier | null | ⏸️ Souvent poids du corps |

### ✅ BICEPS

| Nom API (EN) | Nom FR | Mapping actuel | Correct ? |
|--------------|--------|----------------|-----------|
| bicep curl, barbell curl, dumbbell curl, etc. | Curl biceps | null | ❌ **MANQUANT** : type "biceps" avec standards |
| hammer curl | Marteau | null | ❌ idem |

### ✅ TRICEPS

| Nom API (EN) | Nom FR | Mapping actuel | Correct ? |
|--------------|--------|----------------|-----------|
| tricep extension | Extension triceps | triceps | ✅ |
| cable tricep pushdown | Extension triceps poulie | triceps | ✅ |
| skull crusher | Skull crusher | null | ❌ **BUG** : pas de "tricep" dans "skull crusher" ! |
| lying triceps extension | Extension triceps allongé | triceps | ✅ |
| overhead tricep extension | Extension triceps au-dessus de la tête | triceps | ✅ |
| dumbbell tricep extension | Extension triceps haltère | triceps | ✅ |
| tricep pushdown | Extension triceps poulie | triceps | ✅ |
| close grip bench press | Développé couché prise serrée | bench | ⚠️ Composante triceps forte, débat bench vs triceps |
| dips, bench dip, tricep dip | Dips | null | ❌ **MANQUANT** : Dips = poids du corps + additionnel, ratio différent |

---

## Cas complexes identifiés

### 1. **Ambiguïtés "tirage"**
- **Tirage vertical** → row ✅ (dos)
- **Tirage corde triceps** → triceps ✅ (vérifié avant "tirage")
- **Tirage horizontal** → row ✅
- **Tirage bras tendus** → row (isolation, peut-être à part)
- **Face pull** → row (charge faible, à considérer)

### 2. **"Pushdown" seul**
- `pushdown` sans "tricep" → triceps (actuellement)
- **Straight arm pulldown** contient "pulldown" → row. Pas "pushdown". OK.
- **Cable crossover** : pas pushdown. OK.

### 3. **"Extension" ambigu**
- Extension triceps → triceps ✅
- **Extension de jambes** (leg extension) : contient "extension" mais pas "tricep". Actuellement null. ✅
- **Overhead tricep extension** → triceps ✅

### 4. **"Row" ambigu**
- Bent over row → row ✅
- **Upright row** → row actuellement, mais mouvement épaules/trapèzes. Ratio ≠ row dos.
- **Face pull** → row, charge très faible

### 5. **Poids du corps**
- Push-up, chin-up, pull-up, inverted row, bodyweight squat, dips, plank
- → Soit null, soit type dédié avec standards différents (réps ou +poids)
- Actuellement presque tous null

### 6. **Variantes inclinées / déclinées**
- Incline bench : on mappe bench. Ratio réaliste ~10-15% plus bas ?
- Decline : idem ?
- → Option : facteur de correction ou type séparé "bench-incline"

### 7. **Exercices personnalisés**
- L'utilisateur peut taper n'importe quoi : "Tirage corde triceps", "Dev couché", "Squat barre"
- Il faut supporter les variantes françaises ET les fautes de frappe potentielles
- "dev couché" sans accent → pas "développé" exact. Faut-il "developpe" ou "dev" ?

### 8. **Skull crusher**
- `skull crusher` ne contient ni "tricep" ni "triceps" ni "pushdown"
- → Actuellement **null**. À corriger : ajouter "skull crusher" ou "skull" ?

### 9. **Pullover**
- "pullover".includes("row") = false, "pulldown" = false, "tirage" = false
- La condition row ne matche pas "pullover"
- Donc pullover → null actuellement. OK (mouvement hybride, pas de standard adapté)

### 10. **Close grip bench press**
- Contient "bench press" → match bench en premier. OK.
- Certains considèrent que c'est plus "triceps" en termes de standards. Débat.

---

## Récapitulatif des corrections nécessaires

| Priorité | Problème | Action proposée |
|----------|----------|-----------------|
| Haute | skull crusher → null | Ajouter "skull crusher" ou "skull" dans condition triceps |
| Haute | bodyweight squat → squat | Exclure "bodyweight squat" du mapping squat |
| Moyenne | upright row → row | Créer type "upright-row" ou exclure (ratio très différent) |
| Moyenne | Dips non mappé | Type "dips" avec standards poids du corps + additionnel |
| Moyenne | Biceps non mappé | Type "biceps" avec standards |
| Basse | Incline bench ratio | Option : facteur correctif ou garder bench |
| Basse | Leg press, hack squat | Types optionnels si on étend |
| Basse | Pullover | Rester null (mouvement hybride) |
| Basse | Face pull | Rester row ou null (charge faible) |

---

## Noms français à supporter (exercices custom)

L'utilisateur peut créer : "Tirage corde triceps", "Extension triceps poulie", "Curl biceps", "Développé couché", "Squat", "Soulevé de terre", "Rowing barre", etc.

Vérifications :
- "extension triceps" → triceps ✅
- "curl" → null (biceps pas encore)
- "développé" → ? La condition bench cherche "développé couché", "bench press", "chest press". "Développé militaire" → overhead. "Développé couché" → bench. "Développé" seul → null.
- "rowing" → row ✅

---

## Recommandation d'architecture

1. **Mapping explicite par clé** (dictionnaire) pour les exercices API connus, plutôt que des includes
2. **Fallback** : patterns par mots-clés pour les exercices custom
3. **Exclusions** : liste d'exercices à ignorer (bodyweight squat, etc.)
4. **Types manquants** : biceps, dips (avec note "poids du corps")

---

## Corrections rapides (quick wins)

| Action | Impact |
|--------|--------|
| Ajouter `skull crusher` dans condition triceps | skull crusher aurait une ligue |
| Exclure `bodyweight` du squash (bodyweight squat → null) | éviter un ratio faux |
| Ajouter `dips` avec standards adaptés (poids du corps) | exercice très courant |
| Ajouter type `biceps` | curl biceps aurait une ligue |
| Gérer `upright row` à part (ou exclure) | éviter ratio trompeur |

---

## Synthèse (après refacto)

- **7 types** : bench, squat, deadlift, overhead, row, triceps, biceps
- **Mapping explicite** : ~50 exercices API dans EXPLICIT_MAP
- **Exclusions explicites** : ~50 exercices dans EXPLICIT_EXCLUSIONS (poids du corps, isolation, ratio inadapté)
- **Exercices custom** : aucun suivi ligue (vérification isCustom dans les callers)
- **Fallback** : mots-clés pour variantes API non listées
