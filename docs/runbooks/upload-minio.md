# Runbook – Upload MinIO via URL pré-signée

## 🎯 Résumé
- **Causes racines** :
  - Les cookies d'auth (réponse `Set-Cookie`) étaient servis avec `SameSite=Strict` et sans prise en compte de `X-Forwarded-Host`, ce qui les rendait invisibles côté navigateur après passage par le proxy Next.js (`401 /api/auth/me`).
  - Les URL pré-signées étaient générées avec l'hôte interne `minio:9000` puis réécrites en `localhost:9000`, ce qui invalidait la signature (`403 SignatureDoesNotMatch`).
- **Correctifs** :
  - Cookies `access_token` / `refresh_token` générés en `SameSite=Lax`, déduisant automatiquement `Secure` & `Domain` via les en-têtes `X-Forwarded-*` (compatible proxy + HTTPS).
  - Client MinIO dédié pour la présignature : la signature est calculée directement avec `MINIO_PUBLIC_ENDPOINT` tout en dialant vers l'hôte interne (pas de réécriture post-signature).
  - Harmonisation des variables d'environnement (`MINIO_PUBLIC_ENDPOINT`, `ALLOWED_ORIGINS`) + configuration CORS MinIO documentée.
  - Scripts/tests (`tools/minio/apply-cors.sh`, `tools/minio/test-presigned-put.sh`) pour vérifier le flux.
- **Statut** : ✅ Upload fonctionnel via navigateur et via `curl`.

## ⚙️ Configuration requise

### Variables d'environnement (fichier `.env`)
| Clé | Exemple | Description |
|-----|---------|-------------|
| `MINIO_ENDPOINT` | `http://minio:9000` | Endpoint interne utilisé par l'API/worker. |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | `admin` / `admin123` | Identifiants root MinIO. |
| `MINIO_BUCKET` | `lms-go` | Bucket utilisé pour les contenus. |
| `MINIO_PUBLIC_ENDPOINT` | `http://localhost:9000` | Domaine public utilisé pour signer les URL (navigateur). |
| `MINIO_PUBLIC_CONSOLE_ENDPOINT` | `http://localhost:9001` | URL publique de la console MinIO. |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Origines autorisées par l'API (CORS + cookies). |

> ⚠️ Adapter `MINIO_PUBLIC_ENDPOINT`/`MINIO_PUBLIC_CONSOLE_ENDPOINT` en production (`https://files.example.com`, etc.).

### Docker Compose
- Le service `api` et le worker reçoivent maintenant `MINIO_PUBLIC_ENDPOINT`.
- Le service `minio` expose également `MINIO_SERVER_URL` et `MINIO_BROWSER_REDIRECT_URL` pour refléter les URLs publiques.

### CORS MinIO
1. Vérifier/éditer `tools/minio/cors.json` (origines autorisées, `PUT/GET/HEAD`, `AllowedHeader: "*"`).
2. Appliquer via :
   ```bash
   MINIO_ROOT_USER=admin MINIO_ROOT_PASSWORD=admin123 \
   tools/minio/apply-cors.sh
   ```
   (_Le script lit les variables shell/`.env` et redémarre MinIO après mise à jour_.)

## 🔄 Flux Upload
1. `POST /contents` → génère un contenu `pending` + URL pré-signée (`Content-Type` signé).
2. Frontend `PUT` le fichier sur l'URL retournée en conservant **exactement** le même `Content-Type`.
3. `POST /contents/{id}/finalize` → passage en statut `available`.

Le client de signature réécrit automatiquement l'hôte public avant signature, supprimant les `403` même lorsque MinIO n'est accessible que via `minio:9000` dans le réseau Docker.

### Exemple front-end (Next.js / fetch)
```ts
async function uploadWithPresignedUrl(file: File) {
  // 1️⃣ Récupère l'URL signée
  const { upload_url, content } = await fetch('/api/contents', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Org-ID': '<ORGANIZATION_UUID>',
    },
    body: JSON.stringify({
      name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    }),
  }).then((res) => res.json());

  // 2️⃣ Upload direct sur MinIO (même Content-Type que lors de la signature)
  const putResponse = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!putResponse.ok) {
    throw new Error(`Upload failed: ${putResponse.status}`);
  }

  // 3️⃣ Finalisation (optionnel selon UX)
  await fetch(`/api/contents/${content.id}/finalize`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Org-ID': '<ORGANIZATION_UUID>',
    },
    body: JSON.stringify({ size_bytes: file.size }),
  });

  return content.id;
}
```

## 🧪 Tests & validation

### 1. Upload direct (CLI)
```bash
# URL récupérée via POST /contents
SIGNED_URL="https://localhost:9000/lms-go/<object-key>?X-Amz-..."
FILE="/tmp/demo.mp4"

curl -X PUT \
  -H "Content-Type: video/mp4" \
  --data-binary "@${FILE}" \
  -v "${SIGNED_URL}" # doit retourner 200/204

# ou utiliser le script helper (gère Content-Type automatiquement)
tools/minio/test-presigned-put.sh "$SIGNED_URL" "$FILE"
```

### 2. Upload via front (Next.js)
1. Se connecter à l'admin.
2. Créer un module → importer un fichier.
3. Vérifier en console : plus d'erreurs `net::ERR_NAME_NOT_RESOLVED` ni `401`.
4. Le contenu apparaît disponible dans la liste.

### 3. Double upload (fiabilité)
- Reprendre le test 1 après 10 minutes ➝ l'URL expire correctement, générer une nouvelle URL via l'API.

## ✅ Checklist de déploiement
- [ ] `.env` renseigné avec les URLs publiques (`MINIO_PUBLIC_ENDPOINT`, `ALLOWED_ORIGINS`).
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

