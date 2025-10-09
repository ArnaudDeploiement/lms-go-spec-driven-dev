# Backlog projet – LMS Go

Structure des tickets issue-ready, organisés par phases (MVP → durcissement) et backlog futur. Chaque ticket inclut une estimation indicative (points) pour faciliter la planification Agile.

## Phase 0 – Setup (2 semaines)

### ✅ T-0.1 Initialiser le monorepo Go *(3 pts)*
- **Description** : Créer le module `lms-go`, organiser les dossiers (`cmd/api`, `cmd/worker`, `internal`, `web`), configurer gofmt, golangci-lint, scripts de base.
- **Critères d’acceptation** :
  - `go test ./...` passe sans erreur.
  - README de structure projet commité avec instructions rapides.
  - Lint local exécutable via `make lint`.
- **Dépendances** : aucune.

### ✅ T-0.2 Pipeline CI/CD de base *(2 pts)*
- **Description** : Mettre en place GitHub Actions (lint, tests unitaires, build image Docker), caches modules Go/Node, badge CI.
- **Critères d’acceptation** :
  - Workflow `ci.yml` déclenché sur PR/merge.
  - Pipeline passe automatiquement sur branche principale.
  - Badge CI ajouté au README.
- **Dépendances** : T-0.1.

### ✅ T-0.3 Stack Docker Compose dev *(3 pts)*
- **Description** : Définir `docker-compose.yml` avec services api, worker, postgres, redis, minio, frontend.
- **Critères d’acceptation** :
  - `docker compose up` démarre l’ensemble.
  - Endpoints `/healthz`, `/readyz` accessibles.
  - Variables d’environnement regroupées dans `.env.example`.
- **Dépendances** : T-0.1.

### ✅ T-0.4 Cadre ORM et migrations *(3 pts)*
- **Description** : Installer ent, générer schémas initiaux (`users`, `organizations`), intégrer outil de migrations (atlas, goose).
- **Critères d’acceptation** :
  - Migrations exécutables en local et CI.
  - Génération ent scriptée (`make generate`).
  - Tests unitaires sur repository utilisateur réussissent.
- **Dépendances** : T-0.3.

### ✅ T-0.5 Squelette API Gateway *(2 pts)*
- **Description** : Implémenter serveur HTTP (chi/Gin), middlewares log, recovery, CORS, endpoints `/healthz`, `/readyz`.
- **Critères d’acceptation** :
  - Tests d’intégration santé automatisés.
  - Logs structurés disponibles.
- **Dépendances** : T-0.2, T-0.3.

### ✅ T-0.6 Authentification basique *(3 pts)*
- **Description** : Créer service auth (hash bcrypt, JWT), endpoints login/register, stockage utilisateurs.
- **Critères d’acceptation** :
  - Tests unitaires service auth (hash, token) ≥80% couverture.
  - Refresh token endpoint stub prêt.
  - Flux login depuis frontend fonctionnel.
- **Dépendances** : T-0.4, T-0.5.

### ✅ T-0.7 Shell UI Go/Tailwind *(2 pts)*
- **Description** : Mettre en place templates Go (`html/template`) avec Tailwind via CDN, layout commun, page d’accueil statique.
- **Critères d’acceptation** :
  - Rendu accessible à `/` avec design cohérent.
  - Tests snapshot/rendu (HTTP) vérifiant statut 200.
  - Aucun JavaScript requis côté client.
- **Dépendances** : T-0.1.

### ✅ T-0.8 Guide contributeurs *(1 pt)*
- **Description** : Documenter setup local (Go, Docker), conventions, checklists PR.
- **Critères d’acceptation** :
  - `CONTRIBUTING.md` accessible depuis README.
  - Template PR créé.
- **Dépendances** : T-0.1.

## Phase 1 – MVP parcours (4 semaines)

### ✅ T-1.1 Service organisations multi-tenant *(3 pts)*
- **Description** : CRUD organisations, séparation logique, middleware résolution organisation (header/host).
- **Critères d’acceptation** :
  - Tests API organisation (création, update, soft delete).
  - Toutes requêtes scoping `org_id` vérifié.
- **Dépendances** : T-0.5, T-0.6.

### ✅ T-1.2 Gestion utilisateurs & rôles *(3 pts)*
- **Description** : CRUD utilisateurs par organisation, rôles (admin, concepteur, tuteur, apprenant), invitations email placeholder.
- **Critères d’acceptation** :
  - RBAC minimal appliqué sur endpoints sensibles.
  - Tests unitaires/integ sur assignation rôles.
- **Dépendances** : T-1.1.

### ✅ T-1.3 Service contenus *(5 pts)*
- **Description** : Upload S3/MinIO, gestion métadonnées, quotas, prise en charge PDF, vidéo via URL, article Markdown.
- **Critères d’acceptation** :
  - Upload via URL présigné fonctionnel.
  - Validation type MIME, checksum.
  - Tests intégration stockage MinIO.
- **Dépendances** : T-0.3, T-0.4.

### ✅ T-1.4 Domaines cours & modules *(5 pts)*
- **Description** : Modèles `courses`, `modules`, statut brouillon/publié, versioning simple, API CRUD.
- **Critères d’acceptation** :
  - Tests service cours (création, publication).
  - Validation type module (scorm/pdf/video/article/quiz).
- **Dépendances** : T-1.1, T-1.3.

### ✅ T-1.5 Inscriptions & groupes *(4 pts)*
- **Description** : Modèle `enrollments`, gestion groupes, auto-inscription via lien sécurisé, invitations.
- **Critères d’acceptation** :
  - Endpoint `POST /courses/{id}/enroll` avec règles duplication.
  - Gestion liste d’attente.
- **Dépendances** : T-1.2, T-1.4.

### ✅ T-1.6 Workflow progression parcours *(4 pts)*
- **Description** : Service progression linéaire modules, état (non commencé, en cours, terminé), transitions.
- **Critères d’acceptation** :
  - Tests transitions progression.
  - Stockage progression par utilisateur/mode module.
- **Dépendances** : T-1.4, T-1.5.

### ✅ T-1.7 UI Admin CRUD *(5 pts)*
- **Description** : Templates Go (server-side) pour orgs, utilisateurs, cours/modules, uploads contenus.
- **Critères d’acceptation** :
  - Formulaires HTML accessibles et validation serveur.
  - Tests intégration HTTP (Go) couvrant les flux clés.
- **Dépendances** : T-1.2, T-1.4.

### T-1.8 Front web Next.js « Learner » *(8 pts)*
- **Description** : Implémenter une application Next.js (Tailwind + shadcn/ui + Framer Motion) inspirée du design Revolut pour les vues publiques/apprenants : page d’auth (signup/login), catalogue de parcours, lecteur de module, navigation responsive (sidebar animée).
- **Critères d’acceptation** :
  - Monorepo Go (API) + Next.js (front) fonctionnel avec scripts npm dédiés.
  - Page d’accueil = formulaire d’auth unifié (inscription/connexion) avec transitions fluides.
  - Catalogue apprenant affichant progression, modules et micro-interactions Revolut-like.
  - Tests basiques (Playwright ou Vitest/RTL) couvrant le rendu des pages critiques.
- **Dépendances** : T-1.6.

### T-1.8.1 Auth JWT côté API *(5 pts)*
- **Description** : Adapter l’API Go pour supporter l’inscription initiale (auto-admin), la gestion JWT pour le front Next.js (login, refresh, forgot password placeholder).
- **Critères d’acceptation** :
  - Endpoint public `POST /auth/signup` créant l’instance initiale (organisation + admin).
  - Flux JWT cohérent (headers, refresh, cookies httpOnly optionnels) documenté pour le front.
  - Tests d’intégration couvrant signup/login/refresh.
- **Dépendances** : T-1.6.

### T-1.9 Tests intégrés & qualité *(3 pts)*
- **Description** : Scénarios end-to-end (auth → inscription → module), seed fixtures, instrumentation couverture.
- **Critères d’acceptation** :
  - Suite e2e intégrée dans CI.
  - Couverture globale ≥60%.
- **Dépendances** : T-1.5, T-1.8.

## Phase 2 – Suivi & évaluation (3 semaines)

### T-2.1 Moteur Quiz *(5 pts)*
- **Description** : Modèles questions (QCM, V/F, réponse courte), tentatives, randomisation, notation automatique.
- **Critères d’acceptation** :
  - API création/édition quiz.
  - Soumission tentative renvoie score + feedback.
- **Dépendances** : T-1.4.

### T-2.2 Tracking activité *(4 pts)*
- **Description** : Enregistrement temps passé, statut module, events, instrumentation front/back.
- **Critères d’acceptation** :
  - Events stockés dans table `events`.
  - Agrégation progression temps total disponible.
- **Dépendances** : T-1.6.

### T-2.3 Reporting tuteur *(4 pts)*
- **Description** : Endpoints reporting progression, complétion, taux réussite par groupe/cours.
- **Critères d’acceptation** :
  - Requêtes optimisées (index, EXPLAIN validé).
  - Tests sur dataset volumineux simulé.
- **Dépendances** : T-2.2.

### T-2.4 UI Reporting *(3 pts)*
- **Description** : Dashboard manager/tuteur (tables, graphes), filtres organisation/groupe.
- **Critères d’acceptation** :
  - Temps de chargement <2s sur dataset seed.
  - Tests UI (Playwright) pour filtres.
- **Dépendances** : T-2.3.

### T-2.5 Infrastructure jobs async *(3 pts)*
- **Description** : Worker dédié, file Redis/NATS, conventions job, monitoring.
- **Critères d’acceptation** :
  - Jobs idempotents, retries configurables.
  - Observabilité (metrics job) en place.
- **Dépendances** : T-0.3.

### T-2.6 Notifications email *(3 pts)*
- **Description** : Templates inscription/rappel, envoi via worker, SMTP local configurable.
- **Critères d’acceptation** :
  - Emails envoyés sur inscription/rappel.
  - Tests unitaires templates + acceptance tests mailhog.
- **Dépendances** : T-2.5, T-1.5.

### T-2.7 Webhooks internes *(2 pts)*
- **Description** : Configuration webhook, signature HMAC, envoi events clés avec retry.
- **Critères d’acceptation** :
  - Dashboard admin pour config webhooks.
  - Logs erreurs + retry exponentiel.
- **Dépendances** : T-2.5, T-2.2.

### T-2.8 UX Quiz & notifications *(2 pts)*
- **Description** : Écrans front quiz (feedback immédiat), préférences notifications utilisateur.
- **Critères d’acceptation** :
  - Tests e2e tentative quiz.
  - Opt-in/out notifications respecté.
- **Dépendances** : T-2.1, T-2.6.

## Phase 3 – Durcissement (3 semaines)

### T-3.1 RBAC avancé *(4 pts)*
- **Description** : Matrice permissions fine (ressource/action), policy middleware, outils tests.
- **Critères d’acceptation** :
  - Tests unitaires couverture règles ≥80%.
  - Documentation rôles/permissions publiée.
- **Dépendances** : T-1.2.

### T-3.2 Audit logging *(3 pts)*
- **Description** : Table `audit_logs`, enregistrement actions sensibles, export CSV.
- **Critères d’acceptation** :
  - API admin pour requêtes filtrées.
  - Retention configurable.
- **Dépendances** : T-3.1.

### T-3.3 Observabilité *(3 pts)*
- **Description** : Intégrer metrics Prometheus, tracing OpenTelemetry optionnel, logs JSON.
- **Critères d’acceptation** :
  - Tableaux Grafana exemples.
  - Documentation instrumentation.
- **Dépendances** : T-0.5, T-2.5.

### T-3.4 Sécurité & secrets *(3 pts)*
- **Description** : TLS termination, rotation secrets, analyse dépendances (gosec, npm audit) automatisée.
- **Critères d’acceptation** :
  - Pipeline sécurité déclenché hebdomadaire.
  - Guide configuration TLS/secret management.
- **Dépendances** : T-0.2.

### T-3.5 Helm chart & prod-ready *(4 pts)*
- **Description** : Créer chart Helm (ingress, persistence, secrets), scripts packaging images, tests cluster.
- **Critères d’acceptation** :
  - `helm install` sur cluster test réussi.
  - Documentation déploiement cloud/on-prem.
- **Dépendances** : T-0.3, T-3.4.

### T-3.6 Performance & charge *(3 pts)*
- **Description** : Scénarios k6 (1k utilisateurs), profilage, recommandations scaling.
- **Critères d’acceptation** :
  - Rapport charge partagé.
  - Actions tuning identifiées et priorisées.
- **Dépendances** : T-1.9, T-3.3.

### T-3.7 Sauvegarde & restauration *(2 pts)*
- **Description** : Procédure backups PostgreSQL/minio, scripts automatisés, test restore.
- **Critères d’acceptation** :
  - Plan de backup documenté.
  - Exécution restore vérifiée sur env test.
- **Dépendances** : T-0.3, T-3.4.

### T-3.8 Publication release *(2 pts)*
- **Description** : Notes release 1.0.0, checklist QA, publication images, site documentation.
- **Critères d’acceptation** :
  - Release GitHub taguée avec notes complètes.
  - Documentation utilisateur final disponible.
- **Dépendances** : T-3.5, T-3.6, T-3.7.

## Backlog futur

### T-F.1 Support SCORM/xAPI complet *(8 pts)*
- **Description** : Parser packages SCORM, moteur séquencement, tracking xAPI.
- **Critères d’acceptation** :
  - Import package SCORM réussi.
  - Tracking cmi suspend_data/interaction stocké.
- **Dépendances** : T-1.4.

### T-F.2 Intégration SSO (OAuth2/SAML) *(5 pts)*
- **Description** : Provider SSO modulable, provisioning SCIM basique.
- **Critères d’acceptation** :
  - Login via IdP standard (Keycloak/Okta).
  - Mapping rôles configurable.
- **Dépendances** : T-3.4.

### T-F.3 Connecteur visioconférence *(5 pts)*
- **Description** : Intégrer BigBlueButton/BBB, planifier sessions live, suivi présence.
- **Critères d’acceptation** :
  - Création session live depuis cours.
  - Récupération participation (présence).
- **Dépendances** : T-1.4, T-2.2.

### T-F.4 Marketplace plugins *(8 pts)*
- **Description** : Architecture extension gRPC/Webhooks, SDK développeurs, sandbox sécurité.
- **Critères d’acceptation** :
  - Chargement plugin runtime.
  - Documentation SDK + exemples.
- **Dépendances** : T-3.1, T-3.3.
