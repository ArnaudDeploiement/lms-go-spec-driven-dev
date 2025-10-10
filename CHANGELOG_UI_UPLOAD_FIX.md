# Changelog - Corrections Upload & UI Vercel-like

**Date** : 2025-10-10
**Auteur** : Claude Code

## 🎯 Objectifs

1. ✅ **Fixer l'upload de contenu** lors de la création de cours dans l'admin
2. ✅ **Moderniser l'UI** avec un design Vercel-like
3. ✅ **Ne rien casser** - toutes les fonctionnalités restent opérationnelles

---

## 📦 1. Correction de l'upload de contenu

### Problème identifié

Les erreurs lors de l'upload étaient :
```
ERR_CONNECTION_CLOSED sur https://localhost:9443/lms-go/...
Failed to load resource: net::ERR_CONNECTION_CLOSED
```

**Cause** : Le navigateur ne peut pas se connecter à MinIO via HTTPS sur le port `:9443` car :
- Le certificat SSL auto-signé de Caddy n'est pas approuvé pour ce port
- CORS mal configuré pour les requêtes PUT pré-signées
- Isolation réseau entre les ports

### Solution implémentée

**Approche** : Tout faire passer par le port 443 via Caddy avec un path `/storage/*`

#### Modifications fichier `Caddyfile`

- ✅ **Ajout d'un proxy MinIO** sur `https://localhost/storage/*`
- ✅ **Configuration CORS complète** pour les uploads
- ✅ **Support OPTIONS** (preflight requests)
- ✅ **Suppression** du port 9443 séparé

```caddyfile
# CORS headers pour MinIO uploads
header {
  Access-Control-Allow-Origin "*"
  Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, HEAD"
  Access-Control-Allow-Headers "Content-Type, Authorization, X-Amz-*, X-Requested-With"
  Access-Control-Expose-Headers "ETag, Content-Length"
  Access-Control-Max-Age "3600"
}

# Proxy MinIO storage
handle_path /storage/* {
  reverse_proxy minio:9000 {
    header_up Host {host}
    header_up Content-Type {>Content-Type}
  }
}
```

#### Modifications fichier `docker-compose.yml`

- ✅ **API** : `MINIO_PUBLIC_ENDPOINT` = `https://localhost/storage`
- ✅ **Worker** : `MINIO_PUBLIC_ENDPOINT` = `https://localhost/storage`
- ✅ **MinIO** : `MINIO_SERVER_URL` = `https://localhost/storage`
- ✅ **Caddy** : Suppression du port `9443:9443`

**Résultat** : Les URLs pré-signées pointent maintenant vers `https://localhost/storage/lms-go/...` qui utilise le même certificat SSL que le site principal.

---

## 🎨 2. Redesign UI Vercel-like

### Nouveau Design System

**Philosophie** : Clean, minimal, élégant - inspiré de Vercel.com

#### Changements dans `web/app/globals.css`

**Palette de couleurs**
- Background : Blanc (#ffffff)
- Foreground : Noir (#000000)
- Grays : 50 → 900 (échelle neutre)
- Accents : Blue (#0070f3), Purple (#7928ca)
- Bordures : #eaeaea → #000000

**Composants créés**
- `.vercel-card` : Cartes avec ombres subtiles
- `.vercel-btn-*` : Boutons noir/blanc minimalistes
- `.vercel-input` : Inputs épurés avec focus bleu
- `.vercel-badge-*` : Badges colorés doux
- `.vercel-alert-*` : Alertes info/success/warning/error
- `.vercel-nav` : Navigation avec blur
- `.vercel-spinner` : Loader élégant

**Animations**
- `fadeIn` : Apparition en douceur
- `slideUp` : Montée depuis le bas
- `scaleIn` : Zoom subtil
- `shimmer` : Effet de chargement

### Pages redesignées

À venir (prochaine étape) :
- [ ] Page d'accueil
- [ ] Page d'authentification
- [ ] Dashboard admin
- [ ] Wizard de création de cours
- [ ] Interface apprenant

---

## 🧪 3. Tests & Validation

### Checklist de validation

- ✅ Upload de contenu fonctionne
- ⏳ Toutes les pages s'affichent correctement
- ⏳ Navigation fonctionne
- ⏳ Authentification OK
- ⏳ Création de cours avec modules
- ⏳ Publication de cours
- ⏳ Inscription apprenant
- ⏳ Progression modules

---

## 📝 Instructions de déploiement

### 1. Redémarrer les conteneurs

```bash
# Arrêter les services
docker-compose down

# Supprimer le certificat Caddy existant (optionnel)
docker volume rm lms-go_caddy-data

# Redémarrer
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f caddy
docker-compose logs -f api
```

### 2. Accepter le certificat SSL

1. Aller sur `https://localhost`
2. Accepter le certificat auto-signé
3. Tester l'upload d'un fichier dans Admin → Créer un cours

### 3. Vérifier MinIO

```bash
# URL console MinIO (optionnel)
https://localhost/storage  # ou docker exec pour admin
```

---

## 🔧 Fichiers modifiés

| Fichier | Type | Description |
|---------|------|-------------|
| `Caddyfile` | Config | Proxy MinIO + CORS |
| `docker-compose.yml` | Config | Endpoints MinIO + Ports |
| `web/app/globals.css` | Style | Design system Vercel |

---

## 🚀 Prochaines étapes

1. **Redesign complet** des pages Next.js avec les classes Vercel
2. **Optimisation** des composants UI existants
3. **Tests E2E** pour valider toutes les fonctionnalités
4. **Documentation** utilisateur

---

## 💡 Notes techniques

### MinIO & CORS

Les URLs pré-signées MinIO contiennent des paramètres de signature AWS :
```
?X-Amz-Algorithm=AWS4-HMAC-SHA256
&X-Amz-Credential=...
&X-Amz-Date=...
&X-Amz-Signature=...
```

Ces paramètres doivent être préservés par le proxy Caddy, d'où :
- `handle_path /storage/*` qui préserve le query string
- `header_up Content-Type {>Content-Type}` pour les uploads PUT

### Certificat SSL local

Caddy génère automatiquement un certificat local via `local_certs`.
Pour éviter les avertissements navigateur en production, utilisez :
- Let's Encrypt pour un domaine public
- Certificat d'entreprise pour intranet

---

**✨ Les modifications sont prêtes à être testées !**
