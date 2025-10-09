# Issues Tracker - LMS Go

## 🐛 Bugs Critiques

### ✅ BUG-001: Absence de navigation dans la page Admin
**Priorité**: Haute
**Statut**: ✅ Résolu
**Assigné**: Claude
**Date**: 2025-10-09

**Description**:
La page admin (`/admin`) n'affiche pas le composant `Navigation`, empêchant l'utilisateur de revenir facilement vers la partie learner (`/learn`).

**Impact**:
- UX dégradée: utilisateurs bloqués dans l'admin
- Nécessité de modifier manuellement l'URL
- Incohérence avec la page learner qui a la navigation

**Solution**:
Ajout du composant `<Navigation />` en haut de la page admin (ligne 530 de `/web/app/admin/page.tsx`).

**Fichiers modifiés**:
- `web/app/admin/page.tsx` (ajout import + composant Navigation)

---

### ✅ BUG-002: Persistance des volumes Docker après cleanup
**Priorité**: Moyenne
**Statut**: ✅ Résolu (documentation ajoutée)
**Assigné**: Claude
**Date**: 2025-10-09

**Description**:
Les utilisateurs rencontrent des erreurs "email déjà existant" après avoir fait `docker compose down` et `docker compose up`, car les volumes PostgreSQL persistent.

**Impact**:
- Confusion lors des tests
- Données fantômes entre les sessions de dev
- Messages d'erreur trompeurs

**Cause racine**:
Docker compose ne supprime pas les volumes nommés par défaut avec la commande `down`.

**Solution**:
1. Documentation: utiliser `docker compose down -v` pour supprimer les volumes
2. Ajout d'une commande `make clean` dans le Makefile pour cleanup complet

**Fichiers modifiés**:
- `Makefile` (ajout commande `clean`)

**Documentation**:
```bash
# Nettoyer complètement (containers + volumes)
make clean
# ou
docker compose down -v
```

---

## 🎨 Design / UX

### 🔄 DESIGN-001: Interface Admin trop "gaming/fintech", manque de sobriété corporate
**Priorité**: Moyenne
**Statut**: 📝 Spécifié (à implémenter)
**Assigné**: À assigner
**Date**: 2025-10-09

**Description**:
L'interface admin utilise un design inspiré de Revolut (gradients colorés, glassmorphism, fond sombre) qui n'est pas adapté à un contexte corporate professionnel.

**Problèmes identifiés**:
- ❌ Trop de gradients colorés (indigo/cyan/purple)
- ❌ Effets glassmorphism prononcés
- ❌ Fond très sombre (gray-950 → slate-900)
- ❌ Badges et boutons trop colorés
- ❌ Icônes décoratives (Sparkles) inappropriées
- ❌ Animations excessives

**Design attendu**:
- ✅ Fond clair (slate-50 ou white)
- ✅ Palette neutre: gris, bleu professionnel
- ✅ Bordures subtiles au lieu de glassmorphism
- ✅ Typographie sobre (sans emojis)
- ✅ Espaces blancs généreux
- ✅ Contrastes élevés (WCAG AA)

**Fichier de spec**:
`web/ADMIN_DESIGN_IMPROVEMENTS.md` contient les recommandations détaillées.

**Estimation**: 5-8 heures

**Tâches**:
- [ ] Phase 1: Remplacer les couleurs (fond, cartes, boutons)
- [ ] Phase 2: Simplifier les composants (retirer glassmorphism)
- [ ] Phase 3: Ajuster le layout (header, navigation)
- [ ] Phase 4: Polish (animations, accessibilité)

---

## ✅ Fonctionnalités Manquantes

### ℹ️ FEAT-001: Création de cours
**Priorité**: Haute
**Statut**: ✅ Fonctionne correctement
**Date**: 2025-10-09

**Vérification**:
Le code de création de cours est correct et fonctionnel:
- Backend: `internal/http/api/course_handler.go:82-100`
- Frontend: `web/app/admin/page.tsx:225-246`
- Formulaire: `web/app/admin/page.tsx:756-801`

**Note**:
Si des erreurs surviennent, vérifier:
1. Services Docker démarrés (`make up`)
2. Organisation créée et utilisateur admin
3. Token JWT valide
4. Logs du backend pour plus de détails

---

## 📊 Statut Global

| Catégorie | Total | Résolus | En cours | À faire |
|-----------|-------|---------|----------|---------|
| Bugs | 2 | 2 | 0 | 0 |
| Design/UX | 1 | 0 | 0 | 1 |
| Features | 1 | 1 | 0 | 0 |
| **Total** | **4** | **3** | **0** | **1** |

---

## 🎯 Prochaines Étapes

### Court terme (Sprint actuel)
1. **DESIGN-001**: Implémenter le redesign corporate de l'admin
2. Créer les issues Linear correspondantes
3. Tests de régression post-corrections

### Moyen terme (Next sprint)
1. Tests end-to-end pour valider les flux admin
2. Documentation utilisateur (guide admin)
3. Amélioration de la gestion d'erreurs (messages plus explicites)

### Long terme (Backlog)
1. Dashboard analytics pour les admins
2. Système de rôles granulaires (au-delà de admin/learner)
3. Audit logs pour toutes les actions admin
4. Export de données (CSV, Excel)

---

## 📝 Notes

### Environnement de Test
Pour tester avec un environnement propre:
```bash
# Nettoyer complètement
make clean

# Redémarrer
make up

# Créer un nouveau compte via /auth
```

### Commandes Utiles
```bash
# Voir les logs du backend
docker compose logs -f api

# Voir les volumes
docker volume ls

# Supprimer un volume spécifique
docker volume rm lms-go_postgres-data

# Vérifier l'état des services
docker compose ps
```
