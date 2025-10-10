# LMS Go

Projet open source de Learning Management System écrit en Go, suivant une approche spécifications → implémentation.

## Prérequis
- Go 1.22+
- Docker & Docker Compose

## Démarrage rapide
```bash
# Cloner le dépôt puis
make tidy
make test

# Préparer les assets CSS Tailwind (si modification UI)
npm install
npm run build:css

# Lancer l'API en local (port 8080)
GOCACHE=$(pwd)/.cache/go-build go run ./cmd/api

# Lancer le worker
GOCACHE=$(pwd)/.cache/go-build go run ./cmd/worker
```

### Environnement Docker
```bash
cp .env.example .env
make up   # build + start api, worker, postgres, redis, minio
make down # stop et supprime les volumes
```

Variables clés du fichier `.env` :
- `DATABASE_URL` : chaîne de connexion PostgreSQL utilisée par l'API et les workers.
- `JWT_SECRET` : clé de signature JWT (changer la valeur par défaut avant de déployer).
- `ACCESS_TOKEN_TTL` et `REFRESH_TOKEN_TTL` : durées de vie des tokens d'accès et de rafraîchissement.
- `MINIO_ENDPOINT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`, `MINIO_USE_SSL` : configuration stockage objets (MinIO/S3).
- `MINIO_PUBLIC_ENDPOINT` : hôte public utilisé pour générer les URL pré-signées accessibles depuis le navigateur (ex. `http://localhost:9000`).
- `MINIO_PUBLIC_CONSOLE_ENDPOINT` : URL publique de la console MinIO (ex. `http://localhost:9001`) utilisée pour les redirections du navigateur.

Endpoints santé :
- `GET http://localhost:8080/healthz`
- `GET http://localhost:8080/readyz`

## Structure
```
cmd/api           # Entrée API HTTP et rendu HTML
cmd/worker        # Exécutables tâches asynchrones
internal          # Logique métier (domain/services)
  http/ui         # Templates HTML (Tailwind CDN) et gestion UI côté serveur
  http/api        # Handlers JSON/REST
scripts           # Scripts utils/CI
```

## API disponible
- `GET /orgs` : lister les organisations (filtrage optionnel `?status=`).
- `POST /orgs` : créer une organisation (`name`, `slug`, `settings`).
- `GET /orgs/{id}` / `PATCH /orgs/{id}` / `DELETE /orgs/{id}` / `POST /orgs/{id}/activate` : gérer le cycle de vie d'une organisation.
- `GET /courses` : lister les cours d'une organisation (`X-Org-ID` requis).
- `POST /courses` : créer un cours (`title`, `slug`, `description`, `metadata`).
- `GET /courses/{id}` / `PATCH /courses/{id}` / `DELETE /courses/{id}` / `POST /courses/{id}/publish|unpublish` : gestion du statut.
- `GET /courses/{id}/modules` / `POST /courses/{id}/modules` : gérer les modules (ordre via `POST /courses/{id}/modules/reorder`).
- `PATCH /modules/{moduleId}` / `DELETE /modules/{moduleId}` : éditer/supprimer un module.
- `POST /auth/register` : créer un utilisateur (email, mot de passe, rôle, organisation).
- `POST /auth/login` : authentifier un utilisateur et récupérer un couple `access_token` / `refresh_token`.
- `POST /auth/refresh` : rafraîchir les tokens à partir d'un refresh token valide.
- `GET /healthz`, `GET /readyz` : endpoints de supervision.
- `GET /users` : lister les utilisateurs d'une organisation (entête `X-Org-ID`).
- `POST /users` : créer un utilisateur dans l'organisation courante.
- `GET /users/{id}` / `PATCH /users/{id}` / `DELETE /users/{id}` / `POST /users/{id}/activate` : cycle de vie utilisateur (nécessite `X-Org-ID`).
- `GET /enrollments` : lister les inscriptions (filtres `course_id`, `user_id`, `group_id`, `status`).
- `POST /enrollments` : inscrire un utilisateur (`course_id`, `user_id`, option `group_id`).
- `PATCH /enrollments/{id}` / `DELETE /enrollments/{id}` : mettre à jour progression/statut ou annuler.
- `GET /enrollments/groups` / `POST /enrollments/groups` : gérer les groupes (capacité, association cours).
- `GET /enrollments/{id}/progress` / `POST /enrollments/{id}/progress/start` / `POST /enrollments/{id}/progress/complete` : workflow de progression module par module.
- `GET /contents` : lister les contenus d'une organisation (`X-Org-ID`).
- `POST /contents` : créer un contenu et obtenir une URL de dépôt pré-signée.
- `GET /contents/{id}` / `POST /contents/{id}/finalize` / `DELETE /contents/{id}` / `GET /contents/{id}/download` : finaliser, archiver ou télécharger un contenu.

> La plupart des endpoints applicatifs nécessitent l'entête `X-Org-ID` pour identifier l'organisation courante dans le contexte multi-tenant.

## Qualité & outils
- `make fmt` : formatage Go
- `make lint` : lint via golangci-lint
- `make test` : tests Go (cache local `.cache/go-build`)

Pour contribuer, se référer à `CONTRIBUTING.md` (ajouté durant la phase 0).
