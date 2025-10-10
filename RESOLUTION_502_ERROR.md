# Résolution Erreur 502 Bad Gateway

## 🐛 Problème

Erreur 502 lors de l'accès à `/api/auth/me` et `/api/auth/signup` :
```
Failed to load resource: the server responded with a status of 502 ()
```

## 🔍 Diagnostic

### Étape 1 : Vérification des conteneurs
```bash
docker-compose ps
```
**Résultat** : Les conteneurs `api` et `minio` n'apparaissaient pas (crashés au démarrage).

### Étape 2 : Logs MinIO
```bash
docker-compose logs minio
```
**Erreur trouvée** :
```
ERROR Invalid MINIO_SERVER_URL value is environment variable:
URL contains unexpected resources, expected URL to be of http(s)://minio.example.com format:
https://localhost/storage
```

## 🔧 Cause

MinIO **refuse les URLs avec path** dans la variable `MINIO_SERVER_URL`. Il attend uniquement :
- ✅ `http://minio.example.com`
- ✅ `https://minio.example.com`
- ❌ `https://localhost/storage` (avec path `/storage`)

## ✅ Solution

### Modification de `docker-compose.yml`

**AVANT** :
```yaml
minio:
  environment:
    MINIO_SERVER_URL: https://localhost/storage
    MINIO_BROWSER_REDIRECT_URL: https://localhost/storage
```

**APRÈS** :
```yaml
minio:
  environment:
    MINIO_ROOT_USER: ${MINIO_ROOT_USER}
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    # MinIO n'accepte pas de path dans SERVER_URL, on laisse vide
    # Les URLs publiques seront gérées côté API via MINIO_PUBLIC_ENDPOINT
```

### Redémarrage
```bash
docker-compose up -d minio
docker-compose up -d api
```

## 📊 Résultat

Tous les conteneurs sont maintenant opérationnels :
```
✅ api        - Up and running on :8080
✅ caddy      - Up and running on :443
✅ minio      - Up and running on :9000
✅ postgres   - Up and running (healthy)
✅ redis      - Up and running
✅ web        - Up and running on :3000
✅ worker     - Up and running
```

## 🧪 Tests de validation

### 1. API Health Check
```bash
curl -k https://localhost/api/auth/me
# Devrait retourner 401 (normal, pas authentifié)
```

### 2. Inscription
Via le navigateur sur `https://localhost/auth` :
- Remplir le formulaire
- Créer un compte
- Vérifier la redirection vers `/learn`

### 3. Upload de fichier
1. Aller sur `/admin/courses/new`
2. Ajouter un module avec upload
3. Sélectionner un fichier
4. **Vérifier qu'il n'y a pas d'erreur 502**

## 📝 Notes importantes

### URLs pré-signées MinIO

L'API Go génère les URLs avec `MINIO_PUBLIC_ENDPOINT=https://localhost/storage` :
```go
// internal/platform/storage/minio.go
func (c *Client) applyPublicEndpoint(u *url.URL) {
    u.Scheme = c.publicEndpoint.Scheme  // https
    u.Host = c.publicEndpoint.Host      // localhost
    u.Path = basePath + u.Path          // /storage + /lms-go/...
}
```

### Proxy Caddy

Le Caddyfile route `/storage/*` vers MinIO :
```caddyfile
handle_path /storage/* {
  reverse_proxy minio:9000 {
    header_up Host {host}
    header_up Content-Type {>Content-Type}
  }
}
```

### Variables d'environnement

| Service | Variable | Valeur |
|---------|----------|--------|
| API | `MINIO_ENDPOINT` | `http://minio:9000` (interne) |
| API | `MINIO_PUBLIC_ENDPOINT` | `https://localhost/storage` (externe) |
| MinIO | `MINIO_SERVER_URL` | *(vide)* |
| MinIO | `MINIO_BROWSER_REDIRECT_URL` | *(vide)* |

## ✨ Conclusion

Le problème était une **incompatibilité de configuration** entre MinIO et notre architecture reverse proxy. MinIO ne supporte pas les sous-paths dans `SERVER_URL`, mais l'API Go peut gérer la réécriture des URLs publiques via `MINIO_PUBLIC_ENDPOINT`.

**Solution** : Ne pas définir `MINIO_SERVER_URL` dans docker-compose et laisser l'API gérer les URLs publiques.
