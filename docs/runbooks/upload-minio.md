# Runbook – Upload MinIO via URL pré-signée

## 🎯 Résumé
- **Cause racine** : les URL pré-signées générées par l'API utilisaient l'hôte interne `minio:9000` et ajoutaient un paramètre `content-type` non signé ➝ erreurs `401/403` et `ERR_NAME_NOT_RESOLVED` côté navigateur.
- **Correctifs** :
  - Signature `PUT` réalisée avec `PresignHeader` en incluant l'en-tête `Content-Type` (plus d'altération de l'URL après signature).
  - Signature effectuée directement sur `MINIO_PUBLIC_ENDPOINT` (aucune réécriture post-signature).
  - Harmonisation des variables d'environnement (`MINIO_ROOT_USER`, `MINIO_PUBLIC_ENDPOINT`, etc.) et exposition des URLs publiques (`MINIO_SERVER_URL`).
  - Ajout d'une configuration CORS dédiée et de scripts pour l'appliquer/tester.
- **Statut** : ✅ Upload fonctionnel via navigateur et via `curl`.

## ⚙️ Configuration requise

### Variables d'environnement (fichier `.env`)
| Clé | Exemple | Description |
|-----|---------|-------------|
| `MINIO_ENDPOINT` | `http://minio:9000` | Endpoint interne utilisé par l'API/worker. |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | `admin` / `admin123` | Identifiants root MinIO. |
| `MINIO_BUCKET` | `lms-go` | Bucket utilisé pour les contenus. |
| `MINIO_PUBLIC_ENDPOINT` | `http://localhost:9000` | Hôte public utilisable depuis le navigateur. |
| `MINIO_PUBLIC_CONSOLE_ENDPOINT` | `http://localhost:9001` | URL publique de la console MinIO. |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Origines autorisées par l'API (CORS + cookies). |

> ⚠️ Adapter `MINIO_PUBLIC_ENDPOINT`/`MINIO_PUBLIC_CONSOLE_ENDPOINT` en production (`https://files.example.com`, etc.).

### Docker Compose
- Le service `api` et le worker reçoivent maintenant `MINIO_PUBLIC_ENDPOINT`.
- Le service `minio` expose également `MINIO_SERVER_URL` et `MINIO_BROWSER_REDIRECT_URL` pour refléter les URLs publiques.

### CORS MinIO
1. Vérifier/éditer `tools/minio/cors.json` (origines autorisées).
2. Appliquer via :
   ```bash
   MINIO_ROOT_USER=admin MINIO_ROOT_PASSWORD=admin123 \
   tools/minio/apply-cors.sh
   ```
   (s'adapte aux variables shell existantes).

## 🔄 Flux Upload
1. `POST /contents` → génère un contenu en statut `pending` + URL pré-signée.
2. Frontend `PUT` le fichier sur l'URL retournée en conservant le `Content-Type` original.
3. `POST /contents/{id}/finalize` → passage en statut `available`.

La signature inclut désormais l'en-tête `Content-Type`, évitant les `401/403`, et les URL sont générées directement avec l'hôte public pour supprimer les erreurs `ERR_NAME_NOT_RESOLVED`.

## 🧪 Tests & validation

### 1. Upload direct (CLI)
```bash
SIGNED_URL="https://localhost:9000/lms-go/..."
FILE="/tmp/demo.mp4"

tools/minio/test-presigned-put.sh "$SIGNED_URL" "$FILE" "video/mp4"
```
_Attendu : réponse HTTP 200/204._

### 2. Upload via front (Next.js)
1. Se connecter à l'admin.
2. Créer un module → importer un fichier.
3. Vérifier en console : plus d'erreurs `net::ERR_NAME_NOT_RESOLVED` ni `401`.
4. Le contenu apparaît disponible dans la liste.

### 3. Double upload (fiabilité)
- Reprendre le test 1 après 10 minutes ➝ l'URL expire correctement, générer une nouvelle URL via l'API.

## ✅ Checklist de déploiement
- [ ] `.env` renseigné avec les URLs publiques.
- [ ] `docker-compose` relancé (`make down && make up`).
- [ ] CORS appliqué via `tools/minio/apply-cors.sh`.
- [ ] Test `curl` concluant.
- [ ] Upload via interface admin OK.
- [ ] Bucket MinIO contient le fichier attendu (`mc ls` ou console).

## 📝 Notes d'exploitation
- En production, placer MinIO derrière un reverse proxy TLS (Traefik, Nginx) et pointer `MINIO_PUBLIC_ENDPOINT` vers l'URL HTTPS.
- Si un CDN est utilisé, signer les URL avec le domaine CDN (via la variable `MINIO_PUBLIC_ENDPOINT`).
- Garder l'horloge synchronisée (NTP) pour éviter les expirations immédiates.
- Ne jamais ajouter d'en-tête `Authorization` sur les requêtes PUT signées.
