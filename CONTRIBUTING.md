# Contribuer à LMS Go

Merci de votre intérêt pour le projet ! Ce guide aide à préparer votre environnement et à proposer des contributions de qualité.

## Préparer l'environnement
1. Installer les dépendances :
   - Go 1.22+
   - Docker & Docker Compose
   - `golangci-lint` (optionnel localement, la CI l'exécute automatiquement)
   - Node.js 20+ / npm (pour compiler le CSS Tailwind)
2. Cloner le dépôt et copier l'exemple d'environnement :
   ```bash
   cp .env.example .env
   ```
   > Pensez à définir une valeur forte pour `JWT_SECRET` avant de lancer l'API.
   ```bash
   npm install            # dépendances front (CSS)
   npm run build:css      # génère internal/http/ui/static/tailwind.css
   # Lancer MinIO/Postgres via docker compose (voir README pour les variables MINIO_*)
   ```
3. Lancer les commandes de base :
   ```bash
   make tidy
   make test
   ```

## Workflow de développement
1. Créer une branche à partir de `main`.
2. Implémenter la fonctionnalité en suivant les spécifications (`specs/`).
3. S'assurer que `make fmt`, `make lint` et `make test` passent localement.
4. Vérifier le rendu HTML (page `/`) si des templates Go sont modifiés.
5. Tester les endpoints `/auth/*` (login/register/refresh) si impactés.
6. Mettre à jour la documentation ou les spécifications si nécessaire.
7. Ouvrir une Pull Request en remplissant le template proposé.

## Tests et qualité
- `make fmt` : formatage Go
- `make lint` : lint Go (requiert `golangci-lint`)
- `make test` : exécute `go test ./...`
- `make up` / `make down` : démarrer/arrêter l'environnement Docker local

## Revue de code
- Des revues sont exigées pour chaque PR.
- Veiller à décrire l'impact, les tests effectués et les risques potentiels.
- Ajouter des captures d'écran/vidéos pour les changements UI quand c'est pertinent.

## Communication
- Utiliser les tickets `specs/lms-go-backlog.md` comme référence pour l'issue à traiter.
- Documenter les décisions techniques importantes dans des ADR (à créer sous `docs/adr/`).
