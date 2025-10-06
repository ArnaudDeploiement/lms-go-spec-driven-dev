# Spécification fonctionnelle et technique – LMS Go

## 1. Vision et objectifs
- Fournir un LMS open source écrit en Go, facile à déployer (Docker Compose, Helm chart minimal) et extensible.
- Permettre aux organisations de concevoir, gérer et diffuser des contenus pédagogiques variés (e‑learning SCORM/xAPI simplifié, PDF, articles, vidéos).
- Proposer une fondation modulaire pouvant évoluer vers des usages avancés (gamification, marketplaces, intégrations SSO).

## 2. Personae et cas d’usage clés
- **Administrateur plateforme** : configure l’instance, gère les organisations, les entités juridiques, les intégrations.
- **Concepteur pédagogique** : crée des parcours, importe des médias, organise les modules, publie les sessions.
- **Apprenant** : suit les parcours, consulte les supports, répond aux activités, suit sa progression.
- **Manager / Tuteur** : suit les équipes, valide les inscriptions, consulte les tableaux de bord.

## 3. Fonctionnalités minimales (MVP)
1. **Gestion des utilisateurs et organisations**
   - Multi-tenant logique (séparation par organisation) avec rôles (admin, concepteur, tuteur, apprenant).
   - Authentification par mot de passe, réinitialisation, invitation par email (adapter selon restrictions réseau).
2. **Gestion des parcours et modules**
   - Création de parcours (« programmes ») composés de modules.
   - Support de contenus : SCORM/xAPI léger (stockage packages), PDF, vidéos, articles (éditeur markdown).
   - Versioning de contenus, brouillon/publication.
3. **Gestion des inscriptions**
   - Inscriptions manuelles, auto-inscription via lien sécurisé, listes d’attente.
   - Groupes d’apprenants et affectation à des parcours.
4. **Suivi pédagogique**
   - Tracking des activités (état, temps passé, score simple).
   - Tableaux de bord synthétiques pour tuteur/admin (progression, complétion, taux réussite).
5. **Évaluations**
   - Quiz basiques (QCM, vrai/faux, réponse courte) avec banque de questions.
   - Correction automatique, feedback immédiat.
6. **Notifications**
   - Emails transactionnels essentiels (inscription, rappel).
   - Webhooks internes pour intégrations futures.
7. **Stockage et media**
   - Gestionnaire de médias avec métadonnées, quotas par organisation.
   - Intégration CDN optionnelle via abstraction de stockage.

## 4. Exigences non fonctionnelles
- **Déploiement** : images Docker officielles, Docker Compose « tout-en-un », chart Helm minimal, documentation d’installation.
- **Performance** : objectif 1 000 utilisateurs actifs simultanés avec dimensionnement standard (2 vCPU, 4 Go RAM).
- **Sécurité** : JWT pour les API, RBAC, chiffrement en transit (TLS), audit trail de base.
- **Extensibilité** : architecture hexagonale, séparation claire domaine / services / adaptateurs.
- **Observabilité** : instrumentation Prometheus, tracing OpenTelemetry (optionnel), journaux structurés.

## 5. Architecture applicative
### 5.1 Découpage logique
- `gateway` (REST/GraphQL) : authentification, routage, validation.
- `core services` : user, org, course, enrollment, content, assessment, reporting.
- `workflow engine` léger pour gérer états parcours.
- `background workers` : traitement async (envoi emails, import SCORM, génération rapports).

### 5.2 Stack technologique
- Go 1.22+, framework HTTP Gin/Fiber ou chi (choisir selon préférence performance vs middleware).
- ORM : ent (schema first) ou GORM; recommandation ent pour générer schémas clairs.
- Base de données : PostgreSQL 15.
- Stockage fichiers : S3 compatible (MinIO pour dev), support local FS (volume Docker).
- Message broker : NATS ou RabbitMQ (optionnel MVP, fallback en in-process queue).
- Cache : Redis (sessions, rate limit, file d’attente simple).
- Front-end : rendu server-side Go (`html/template`) avec Tailwind CSS (CDN), pas de JavaScript obligatoire.
- CI : GitHub Actions (lint, test, build images).

### 5.3 Schéma de déploiement
```
[Clients Web] -> [Gateway REST] -> [Services Go] -> [PostgreSQL]
                              -> [Redis] -> [Workers]
                              -> [S3/MinIO]
```
- Images Docker multi-stage (Go build + runtime slim).
- Compose : services (api, worker, frontend, postgres, redis, minio).
- Helm chart : valeurs pour secrets, persistance, ingress.

## 6. Modèle de données (extrait MVP)
- `users` : id, org_id, email, password_hash, role, status, metadata JSONB, created_at.
- `organizations` : id, name, slug, settings JSONB.
- `courses` : id, org_id, title, description, status, metadata, version.
- `modules` : id, course_id, type (`scorm`, `pdf`, `video`, `article`, `quiz`), content_ref.
- `enrollments` : id, user_id, course_id, status, progress_pct, started_at, completed_at.
- `quiz_questions`, `quiz_answers`, `quiz_attempts`.
- `contents` : id, org_id, storage_key, mime_type, checksum, visibility.
- `events` : id, user_id, type, payload, occurred_at.

## 7. APIs principales (REST)
- `POST /auth/login`, `POST /auth/refresh`.
- `GET/POST /orgs`, `GET /orgs/{id}/stats`.
- `GET/POST /courses`, `PATCH /courses/{id}`, `GET /courses/{id}/modules`.
- `POST /courses/{id}/enroll`, `GET /enrollments?user_id=`.
- `GET /reports/progress?course_id=` (admin/tuteur).
- `POST /contents` (upload via presigned URL), `GET /contents/{id}` avec RBAC.
- `POST /quizzes/{moduleId}/attempt`, `POST /quizzes/{moduleId}/submit`.

## 8. Sécurité et conformité
- RBAC fin : actions mappées sur rôles, règles organisationnelles.
- Audit log : table `audit_logs` (actor_id, action, subject_type, subject_id, metadata, timestamp).
- Conformité RGPD : export/suppression donnée apprenant, consentement tracking.
- Stratégie backup : base PostgreSQL (pg_dump + WAL), stockage chiffré.

## 9. Observabilité et maintenance
- Logs JSON via Zap/Logrus.
- Metrics Prometheus (requêtes, latence, jobs workers).
- Healthchecks `/healthz`, `/readyz`.
- Feature flags pour fonctionnalités expérimentales (OpenFeature, config DB).

## 10. Roadmap initiale
1. **Phase 0 – Setup (2 semaines)**
   - Structuration repo (Go monorepo), configuration CI, Docker base, conventions coding.
   - Mise en place ent + migrations, squelette services, authentification basique.
2. **Phase 1 – MVP parcours (4 semaines)**
   - Modules user/org/course/enrollment.
   - Upload contenus (PDF, vidéo lien, article Markdown).
   - UI admin minimale (templates Go) pour CRUD et suivi simple.
3. **Phase 2 – Suivi & évaluation (3 semaines)**
   - Quiz, tracking progression, reporting tuteur.
   - Notifications emails, tâches async via worker.
4. **Phase 3 – Durcissement (3 semaines)**
   - RBAC complet, audit logs, observabilité, Helm chart.
   - Tests charge basiques, documentation déploiement, publication release.

## 11. Points d’attention et extensions futures
- Support SCORM complet nécessite parser dédié, envisager intégration open-source (Rustici alternatives) ou support partiel (zip + tracking xAPI).
- SSO (OAuth2, SAML) et provisioning SCIM à planifier.
- Intégration outils visioconférence (BigBlueButton, BBB) via connecteurs.
- Marketplace plugins : architecture d’extension (gRPC + Webhooks) pour personnalisation.
