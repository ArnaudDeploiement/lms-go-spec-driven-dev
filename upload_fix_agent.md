# 🔧 Diagnostic et Correction d’un Échec d’Upload (MinIO / S3)

## 🎯 Objectif
Corriger l’erreur d’upload de fichier via URL pré-signée dans une application web utilisant MinIO/S3.  
Les problèmes à résoudre :
- `401 (Unauthorized)`
- `net::ERR_NAME_NOT_RESOLVED` sur `minio:9000/...`

---

## 🧩 Contexte

### Erreurs observées
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
minio:9000/... Failed to load resource: net::ERR_NAME_NOT_RESOLVED
```

### Hypothèses
- `minio` est un hostname **interne Docker**, inaccessible côté navigateur.  
- Mauvaise configuration du **CORS** ou de la **signature URL**.  
- **Horloge**, **headers**, ou **auth API** incorrects.

---

## 🧠 Rôle de l’Agent
Tu es un **ingénieur fiabilité + full-stack** chargé de diagnostiquer et corriger le flux d’upload **de bout en bout**.

Tu dois :
1. Rendre l’upload via URL pré-signée **fiable depuis le navigateur**.  
2. Configurer les **hosts**, **CORS**, **headers**, et **authentification** correctement.  
3. Fournir un **patch complet** (code + config + tests + checklist).

---

## 📋 Contraintes
- Fournir **tout de suite** le code complet, les scripts et les commandes.
- Ne divulguer **aucun secret** (utiliser des placeholders).
- Ne pas ajouter d’headers non signés (`Authorization`, etc.).
- Utiliser **PUT** et le même `Content-Type` que lors de la signature.

---

## 🧱 Artefacts attendus
1. **Patch serveur** (Node/Go/Rails, selon stack) pour générer des URLs avec un **host public**.  
2. **Config MinIO** (CORS + `MINIO_SERVER_URL` + `MINIO_BROWSER_REDIRECT_URL`).  
3. **Exemple front-end** d’upload.  
4. **Script de test** `curl` pour isoler CORS/DNS/headers.  
5. **Checklist** de validation + critères d’acceptation.  
6. **Notes de déploiement** (Docker, env vars, proxy).

---

## ⚙️ Plan d’action

### 1. DNS / Host public
- Remplacer `minio:9000` par un host public :
  - `http://localhost:9000` en dev,
  - `https://files.example.com` en prod.
- Configurer :
  ```bash
  MINIO_SERVER_URL=http://localhost:9000
  MINIO_BROWSER_REDIRECT_URL=http://localhost:9001
  ```

---

### 2. CORS MinIO
Créer `cors.json` :
```json
[
  {
    "AllowedOrigin": ["http://localhost:3000", "https://app.example.com"],
    "AllowedMethod": ["PUT","GET","POST","HEAD"],
    "AllowedHeader": ["*"],
    "ExposeHeader": ["ETag","x-amz-request-id"],
    "MaxAgeSeconds": 3000
  }
]
```

Appliquer :
```bash
mc alias set local http://localhost:9000 MINIO_ROOT_USER MINIO_ROOT_PASSWORD
mc admin config set local/ api cors=/path/to/cors.json
```

---

### 3. Signature / Expiration / Headers
- Vérifier que la signature inclut le `Content-Type` si imposé.
- Vérifier l’**horloge synchronisée (NTP)**.
- Méthode : **PUT** uniquement, sans header d’auth perso.

---

### 4. Auth API (si 401 côté /api)
#### Front
```js
await fetch('/api/upload-url', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
  body: JSON.stringify({ filename: file.name, contentType: file.type })
});
```

#### Serveur
- Vérifier CSRF, cookies `SameSite=None; Secure` si cross-site.
- Vérifier CORS côté API.

---

### 5. Code Exemple (Node/Express)

#### Serveur
```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import slugify from 'slugify';

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  }
});

const PUBLIC_S3_BASE = process.env.PUBLIC_S3_BASE; // ex: http://localhost:9000

export async function getPresignedPutUrl(req, res) {
  const { filename, contentType } = req.body;
  const key = `lms-go/${new Date().toISOString().split('T')[0]}/${slugify(filename)}`;

  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType
  });

  const signed = await getSignedUrl(s3, cmd, { expiresIn: 900 });

  // Réécrire host si besoin
  const u = new URL(signed);
  const pub = new URL(PUBLIC_S3_BASE);
  u.protocol = pub.protocol;
  u.host = pub.host;

  res.json({ url: u.toString(), key });
}
```

#### Front
```js
async function uploadFile(file) {
  const meta = await fetch('/api/upload-url', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type })
  }).then(r => r.json());

  const res = await fetch(meta.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return meta.key;
}
```

---

### 6. docker-compose (extrait)
```yaml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_SERVER_URL: ${PUBLIC_MINIO_URL}
      MINIO_BROWSER_REDIRECT_URL: ${PUBLIC_MINIO_CONSOLE_URL}
```

---

## 🧪 Tests

### 1️⃣ Test PUT direct
```bash
curl -X PUT "<URL_PRE_SIGNEE>"   -H "Content-Type: video/mp4"   --data-binary "@fichier.mp4" -v
```

### 2️⃣ Test navigateur
- Ouvrir l’URL pré-signée → doit se résoudre (`localhost` ou domaine).
- Upload via front → pas de 401, pas d’erreur CORS.

---

## ✅ Critères d’acceptation
- Upload via navigateur = succès (200/204).  
- Plus d’`ERR_NAME_NOT_RESOLVED`.  
- Plus de 401.  
- URLs utilisent un host public (`localhost` ou domaine).  
- Deux uploads espacés de 10 minutes fonctionnent.  
- Fichier visible dans le bucket.

---

## 📦 Livrables
- Code serveur + front + docker-compose + cors.json.  
- README “Runbook Upload MinIO”.  
- Rapport final expliquant :
  - Cause racine (DNS interne + signature/horloge/CORS)
  - Correctifs appliqués
  - Validation OK.
