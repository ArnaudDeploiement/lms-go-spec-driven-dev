<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles:
- II. Sécurité Par Défaut (renforcée)
- III. Accessibilité HTML (clarifiée)
- IV. Traçabilité & Conformité (étendue)
- V. Simplicité Opérationnelle (étendue)
Added principles:
- VI. Observabilité & Résilience
Added sections:
- Documentation Applicative
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md (contrôles sécurité/observabilité déjà prévus)
- ✅ .specify/templates/spec-template.md (exigences alignées sur la documentation et la robustesse)
- ✅ .specify/templates/tasks-template.md (catégories compatibles avec nouvelles obligations)
Follow-up TODOs:
- Aucun
-->
# LMS Go Constitution

## Core Principles

### I. Socle Go Standard
La plateforme est développée exclusivement en Go en s'appuyant sur la bibliothèque standard.
Aucun framework tiers ni dépendance externe n'est autorisé pour la logique applicative. Toute
fonctionnalité doit rester compréhensible, portable et auditable par l'équipe cœur.

### II. Sécurité Par Défaut
Les parcours utilisateurs sont chiffrés, authentifiés et journalisés par défaut. Les identifiants
appliquent des politiques de mot de passe fort, l'authentification multifacteur est exigée pour
les rôles élevés, et les sessions sont invalidées après inactivité. Chaque itération inclut une
analyse de risque, des scans de vulnérabilités et un plan de mitigation vérifiable. Au moins deux
tests d'intrusion externes sont réalisés par an avec suivi des actions correctives.

### III. Accessibilité HTML
Chaque page est rendue côté serveur en HTML sémantique stylé par une feuille Tailwind
précompilée. L'expérience reste fonctionnelle sans JavaScript, respecte les standards WCAG AA,
offre des parcours clavier complets et met à disposition des contenus alternatifs pour toute
ressource multimédia critique.

### IV. Traçabilité & Conformité
Toutes les actions sensibles (authentification, gestion de cours, publication de notes) sont
tracées avec contexte horodaté et identifiant d'acteur. Les journaux sont conservés 12 mois
minimum, protégés contre l'altération, corrélés avec les alertes de sécurité et audités
trimestriellement.

### V. Simplicité Opérationnelle
Chaque évolution vise le minimum indispensable pour un LMS sécurisé. Les flux restent
déterministes, testables automatiquement, et la documentation métier et technique est mise à
jour avant toute mise en production. Les dépendances infrastructures sont limitées et
standardisées.

### VI. Observabilité & Résilience
Le système expose des métriques clés (authentification, erreurs serveur, temps de réponse,
file d'attente) et des journaux structurés corrélables. Les budgets d'erreur sont définis et
surveillés via alerting 24/7. Des tests de charge et des exercices de reprise après sinistre sont
réalisés au minimum deux fois par an pour valider la capacité à encaisser la charge cible et à
restaurer le service sous quatre heures.

## Contraintes Structurantes
- Hébergement sur une pile contrôlée supportant TLS 1.2+ avec certificats renouvelés
  automatiquement et redondance géographique documentée.
- Utilisation d'une feuille Tailwind générée en amont et servie telle quelle (pas de compilation
  dynamique ni de pipeline Node).
- Stockage des données sensibles chiffré au repos avec rotations de clés documentées et tests de
  restauration de sauvegarde trimestriels.
- Disponibilité cible ≥ 99 %, appuyée par un plan d'escalade incident, un PRA testé et une
  surveillance active des alertes.
- Tests de charge semestriels couvrant les parcours critiques (inscription, suivi de cours,
  évaluations) avec objectifs de performance définis.

## Workflow de Développement
- Toute fonctionnalité débute par une expression de besoin métier validée, un plan de tests et une
  évaluation de risques de sécurité et de disponibilité.
- Les revues de code vérifient la conformité aux principes de sécurité, d'accessibilité et
  d'observabilité avant approbation.
- Chaque livraison passe par une checklist de déploiement incluant sauvegarde, rollback testé,
  revue de documentation et validation manuelle des parcours critiques en environnement contrôlé.
- Les équipes observent en production les métriques clés dans la première heure suivant
  déploiement et consignent les résultats.

## Documentation Applicative
- Un dossier de documentation est publié et tenu à jour pour chaque version (architecture,
  parcours utilisateurs, guides d'exploitation, procédures incident).
- Les runbooks d'astreinte couvrent détection, diagnostic et remédiation des incidents critiques.
- Les rapports de tests (fonctionnels, charge, sécurité) sont archivés et accessibles aux parties
  prenantes avant la mise en production.

## Governance
Cette constitution prime sur toute autre directive projet. Les amendements nécessitent la
proposition écrite d'un mainteneur, la validation de deux responsables produit, et la mise à
jour coordonnée de la documentation associée. Chaque équipe effectue une revue de conformité
trimestrielle, teste au moins un scénario de reprise et consigne les écarts observés dans un
registre partagé.

**Version**: 1.1.0 | **Ratified**: 2025-10-06 | **Last Amended**: 2025-10-06
