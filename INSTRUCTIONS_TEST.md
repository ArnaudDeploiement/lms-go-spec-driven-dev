# Instructions de Test - LMS-Go

## 🎯 Modifications effectuées

### 1. ✅ Fix Upload de Contenu MinIO

**Problème** : Les uploads échouaient avec `ERR_CONNECTION_CLOSED` sur `:9443`

**Solution** : Tout faire passer par le port 443 via Caddy

| Fichier | Changements |
|---------|-------------|
| `Caddyfile` | Ajout proxy `/storage/*` + CORS complet |
| `docker-compose.yml` | `MINIO_PUBLIC_ENDPOINT` → `https://localhost/storage` |

### 2. ✅ UI Vercel-like

**Nouveau Design System** dans `web/app/globals.css`
- Palette : Blanc/Noir/Grays minimalistes
- Composants : `.vercel-card`, `.vercel-btn-*`, `.vercel-input`, etc.
- Animations douces et épurées

**Pages redesignées** :
- ✅ Page d'authentification (`/auth`)
- ⏳ Dashboard admin (`/admin`) - En cours
- ⏳ Wizard de cours (`/admin/courses/new`) - En cours
- ⏳ Catalogue apprenant (`/learn`) - En cours

---

## 🚀 Démarrage et Tests

### Étape 1 : Redémarrer les conteneurs

```bash
# Dans /home/arnaud/project/lms-go/

# Arrêter tous les services
docker-compose down

# (Optionnel) Supprimer les volumes Caddy pour forcer un nouveau certificat SSL
docker volume rm lms-go_caddy-data lms-go_caddy-config

# Rebuild et démarrer
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f  api
docker-compose logs -f caddy
```

### Étape 2 : Accepter le certificat SSL

1. Ouvrir le navigateur sur `https://localhost`
2. **Accepter le risque** du certificat auto-signé (c'est normal en local)
3. La page devrait rediriger vers `/auth`

### Étape 3 : Tester l'authentification

**Créer un compte** :
1. Sur `/auth`, remplir le formulaire d'inscription :
   - Nom organisation : Test LMS
   - Email : admin@test.com
   - Mot de passe : password123
2. Cliquer sur "Créer mon compte"
3. Vérifier la redirection vers `/learn`

**Se connecter** :
1. Cliquer sur "J'ai déjà un compte"
2. Entrer email/mot de passe
3. Vérifier la connexion

### Étape 4 : Tester l'upload de contenu

1. Naviguer vers **Admin** (via la navigation)
2. Aller sur **Créer un cours**
3. Remplir les informations du cours
4. **Ajouter un module**
5. Choisir **"Téléverser un fichier"**
6. Sélectionner un fichier (PDF, MP4, etc.)
7. **Vérifier qu'il n'y a pas d'erreur** `ERR_CONNECTION_CLOSED`
8. Le fichier doit s'uploader avec une barre de progression

**URLs à vérifier dans DevTools** :
- Les URLs pré-signées doivent être `https://localhost/storage/lms-go/...`
- Elles ne doivent PAS pointer vers `:9443`

### Étape 5 : Tests fonctionnels

**Création de cours complet** :
1. Créer un cours avec 2-3 modules
2. Publier le cours
3. Vérifier qu'il apparaît dans `/learn`

**Inscription apprenant** :
1. (En tant qu'admin) Créer un utilisateur avec rôle "learner"
2. L'inscrire au cours
3. Se reconnecter avec ce compte
4. Vérifier l'accès au cours

---

## 🐛 Debugging

### Problème : Upload toujours en erreur

**Vérifier Caddy** :
```bash
docker-compose logs caddy | grep -i minio
docker-compose logs caddy | grep -i cors
```

**Vérifier MinIO** :
```bash
docker-compose logs minio | grep -i error
```

**Tester l'endpoint storage** :
```bash
curl -I https://localhost/storage/
# Devrait retourner un header MinIO
```

### Problème : Certificat SSL invalide

1. Supprimer les volumes Caddy
2. Redémarrer : `docker-compose down && docker-compose up -d`
3. Réaccepter le certificat dans le navigateur

### Problème : Styles ne s'appliquent pas

1. Vérifier que `/web/app/globals.css` contient les classes `.vercel-*`
2. Rebuild le frontend :
```bash
docker-compose restart web
docker-compose logs web
```

### Problème : 401 Unauthorized

1. Vérifier que les cookies sont bien envoyés
2. Ouvrir DevTools > Application > Cookies
3. Vérifier la présence de `access_token` et `refresh_token`

---

## 📊 Checklist de Validation

### Fonctionnalités Upload
- [ ] Upload d'un PDF
- [ ] Upload d'une vidéo MP4
- [ ] Upload d'un fichier audio
- [ ] Pas d'erreur `ERR_CONNECTION_CLOSED`
- [ ] Barre de progression visible
- [ ] Finalisation du contenu OK

### Fonctionnalités UI
- [ ] Page `/auth` avec design Vercel
- [ ] Formulaire inscription fonctionnel
- [ ] Formulaire connexion fonctionnel
- [ ] Messages d'erreur/succès visibles
- [ ] Animations fluides
- [ ] Responsive mobile

### Fonctionnalités Cours
- [ ] Création de cours avec modules
- [ ] Publication de cours
- [ ] Modification de cours
- [ ] Suppression de cours
- [ ] Ajout/suppression de modules

### Fonctionnalités Apprenant
- [ ] Affichage catalogue
- [ ] Accès à un cours
- [ ] Progression des modules
- [ ] Marquer un module comme complété

---

## 🎨 Aperçu Design Vercel

**Palette de couleurs** :
- Background : `#ffffff` (blanc pur)
- Text : `#000000` → `#171717` (noir → gris foncé)
- Borders : `#eaeaea` → `#000000` (gris clair → noir au hover)
- Accents : `#0070f3` (bleu Vercel)

**Composants clés** :
- Boutons : Noir/blanc, bordures fines, hover subtil
- Inputs : Bordure grise, focus bleu
- Cards : Ombre douce, bordure fine
- Alerts : Couleurs pastel avec bordures

**Typographie** :
- Titres : Bold, noir
- Corps : Regular, gris
- Labels : Medium, gris moyen

---

## 📝 Notes

- Le certificat SSL local est généré automatiquement par Caddy
- En production, utilisez Let's Encrypt pour un domaine public
- Les URLs pré-signées MinIO expirent après 15 minutes (900s)
- Le design system est extensible via les classes `.vercel-*`

---

**✨ Bon test !**

En cas de problème, vérifier les logs :
```bash
docker-compose logs -f
```
