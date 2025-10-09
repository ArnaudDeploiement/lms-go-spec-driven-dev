# Architecture LMS Go – Stack Go/Next.js

Ce document décrit l'architecture actuelle du projet LMS Go après la migration vers une stack hybride **Backend Go** + **Frontend Next.js**.

## Vue d'ensemble

Le projet est organisé en **monorepo** avec séparation claire entre backend et frontend :

```
lms-go/
├── cmd/                    # Binaires Go (api, worker)
├── internal/               # Code backend Go (services, ent, http)
├── web/                    # Application Next.js
├── specs/                  # Documentation
├── docker-compose.yml      # Stack dev complète
└── Makefile               # Commandes dev
```

## Stack technologique

### Backend (Go)

- **Framework** : `chi` pour le routing HTTP
- **ORM** : `ent` (schema-first) pour la génération de code
- **Base de données** : PostgreSQL 15
- **Stockage fichiers** : MinIO (S3-compatible)
- **Cache** : Redis (optionnel pour sessions/rate limiting)
- **Authentification** : JWT avec refresh tokens (cookies httpOnly)

### Frontend (Next.js)

- **Framework** : Next.js 14+ avec App Router
- **Langage** : TypeScript
- **Styling** : Tailwind CSS + shadcn/ui
- **Animations** : Framer Motion
- **Communication API** : Client TypeScript custom avec gestion automatique des tokens

## Architecture réseau

### Mode développement (Docker Compose)

```
┌─────────────────┐
│   Navigateur    │
└────────┬────────┘
         │
         │ http://localhost:3000
         ▼
┌─────────────────┐
│  Next.js (web)  │ ──────────┐
└─────────────────┘           │
         │                    │
         │ /api → proxy       │ Direct (dev mode)
         │                    │
         ▼                    ▼
┌─────────────────┐   ┌──────────────┐
│   API Go :8080  │   │  Worker Go   │
└────────┬────────┘   └──────┬───────┘
         │                   │
    ┌────┼────┬─────────┬────┴────┐
    ▼    ▼    ▼         ▼         ▼
  ┌────┬────┬─────┬────────┬─────────┐
  │ PG │Redis│MinIO│        │         │
  └────┴────┴─────┘        │         │
```

- **Next.js (port 3000)** : proxy les requêtes `/api/*` vers `http://api:8080` via `next.config.js`
- **API Go (port 8080)** : expose les endpoints REST
- **Worker Go** : traitement asynchrone (jobs, emails)
- **PostgreSQL** : base de données relationnelle
- **Redis** : cache et sessions
- **MinIO** : stockage objet compatible S3

### Mode production

En production, Next.js génère un build standalone qui :
1. Sert les assets statiques optimisés
2. Appelle l'API Go via une URL externe (configurée via variable d'environnement)
3. Utilise des cookies httpOnly pour sécuriser les tokens JWT

## Communication Frontend ↔ Backend

### API Client TypeScript

Le frontend utilise un client API centralisé ([`web/lib/api/client.ts`](../web/lib/api/client.ts)) qui :

1. **Gère automatiquement les tokens JWT** :
   - Stocke les tokens dans des cookies httpOnly
   - Refresh automatique en cas de 401
   - Retry de la requête échouée après refresh

2. **Utilise un proxy en dev** :
   - En développement : `/api` → `http://api:8080`
   - En production : `/api` → URL API externe

3. **Fournit une interface typée** :
   ```typescript
   await apiClient.getCourses(orgId, { status: 'published' })
   await apiClient.createEnrollment(orgId, { course_id, user_id })
   ```

### Authentification

#### Flow de connexion

1. **Signup** : `POST /api/auth/signup?use_cookies=true`
   - Crée organisation + utilisateur admin
   - Retourne JWT dans cookie httpOnly + body JSON

2. **Login** : `POST /api/auth/login?use_cookies=true`
   - Authentifie avec `organization_id`, `email`, `password`
   - Retourne JWT dans cookie httpOnly

3. **Profile** : `GET /api/auth/me`
   - Récupère les infos user + organization
   - Utilisé par `AuthProvider` au chargement

4. **Refresh** : `POST /api/auth/refresh?use_cookies=true`
   - Automatique en cas de 401
   - Renouvelle le token d'accès

#### Context React

Le [`AuthProvider`](../web/lib/auth/context.tsx) :
- Wrappe toute l'application
- Expose `user`, `organization`, `isAuthenticated`, `isLoading`
- Persiste les données en localStorage (pour éviter flash de contenu)
- Synchronise avec l'API au chargement

## Structure des pages

### Pages publiques

- **[`/`](../web/app/page.tsx)** : Redirection auto selon authentification
  - Authentifié → `/learn`
  - Non authentifié → `/auth`

- **[`/auth`](../web/app/auth/page.tsx)** : Page d'authentification
  - Tabs signup/login
  - Design moderne avec Framer Motion

### Pages apprenants

- **[`/learn`](../web/app/learn/page.tsx)** : Dashboard apprenant
  - Stats (formations en cours, progression moyenne, terminées)
  - Liste des cours inscrits avec progression
  - Catalogue des cours disponibles

- **[`/learn/course/[id]`](../web/app/learn/course/[id]/page.tsx)** : Détail cours
  - Header avec progression
  - Liste des modules (verrouillés/déverrouillés)
  - Bouton d'inscription si non inscrit

### Pages administration

- **[`/admin`](../web/app/admin/page.tsx)** : Dashboard admin (design Revolut-like)
  - Gestion organisations (super_admin uniquement)
  - Gestion cours (CRUD, publication, archivage, modules)
  - Gestion utilisateurs (création, activation/désactivation)
  - Gestion inscriptions (création, annulation, groupes)
  - Gestion contenus (upload, téléchargement, finalisation)

## Modèle de données

Le schéma de données est défini dans [`internal/ent/schema/`](../internal/ent/schema/) avec **ent** :

### Entités principales

- **Organization** : multi-tenancy, chaque ressource est liée à une org
- **User** : utilisateurs avec rôles (admin, designer, tutor, learner)
- **Course** : formations avec statuts (draft, published, archived)
- **Module** : contenus pédagogiques (video, pdf, article, quiz, scorm)
- **Enrollment** : inscription utilisateur ↔ cours
- **ModuleProgress** : progression par module (not_started, in_progress, completed)
- **Content** : fichiers stockés dans MinIO (via presigned URLs)
- **Group** : groupes d'apprenants (optionnel)

### Relations

```
Organization 1──N User
Organization 1──N Course
Organization 1──N Content

Course 1──N Module
Course 1──N Enrollment

User 1──N Enrollment

Enrollment 1──N ModuleProgress
Module 1──N ModuleProgress

Module N──1 Content (optionnel)
```

## Sécurité

### Multi-tenancy

Toutes les requêtes API (sauf auth publique) nécessitent le header `X-Org-ID` :

```typescript
headers: {
  'X-Org-ID': organization.id
}
```

Le middleware [`httpmiddleware.TenantFromHeader`](../internal/http/middleware/tenant.go) :
1. Extrait l'`org_id` du header
2. Valide son existence en base
3. L'injecte dans le contexte de la requête

### RBAC (Role-Based Access Control)

Les rôles utilisateurs :
- **super_admin** : accès global (gestion des organisations)
- **admin** : administration d'une organisation
- **designer** : création de cours
- **tutor** : suivi des apprenants
- **learner** : accès aux formations

## Déploiement

### Docker Compose (dev)

```bash
# Démarrer l'ensemble de la stack
docker compose up

# Accès :
# - Frontend : http://localhost:3000
# - API : http://localhost:8080
# - MinIO console : http://localhost:9001
```

### Production

1. **Build backend** :
   ```bash
   docker build -f Dockerfile.api -t lms-go-api .
   docker build -f Dockerfile.worker -t lms-go-worker .
   ```

2. **Build frontend** :
   ```bash
   cd web && npm run build
   docker build -f Dockerfile.web -t lms-go-web .
   ```

3. **Deploy** :
   - Helm chart à venir (Phase 3)
   - Variables d'environnement requises :
     - `DATABASE_URL`, `JWT_SECRET`
     - `MINIO_ENDPOINT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
     - `NEXT_PUBLIC_API_URL` (pour le frontend)

## Roadmap technique

### ✅ Phase 1 complétée
- Stack Go/Next.js opérationnelle
- Authentification JWT avec refresh
- CRUD complet (organisations, cours, modules, utilisateurs, inscriptions, contenus)
- UI moderne avec Framer Motion
- Gestion multi-tenant

### 🚧 Phase 2 en cours
- Module Quiz
- Tracking activité détaillé
- Notifications emails
- Jobs asynchrones (worker)

### 📋 Phase 3 à venir
- RBAC avancé
- Audit logs
- Observabilité (Prometheus, tracing)
- Helm chart production
- Tests de charge

## Commandes utiles

```bash
# Backend
make test          # Tests Go
make fmt           # Format code
make lint          # Lint Go
make generate      # Régénère code ent

# Frontend
cd web
npm install        # Install deps
npm run dev        # Dev server
npm run build      # Production build
npm run lint       # Lint TypeScript

# Stack complète
docker compose up            # Démarrer
docker compose down -v       # Arrêter + supprimer volumes
```

## Références

- [Spécification fonctionnelle](./lms-go-spec.md)
- [Backlog détaillé](./lms-go-backlog.md)
- [CLAUDE.md](../CLAUDE.md) : guide pour Claude Code
