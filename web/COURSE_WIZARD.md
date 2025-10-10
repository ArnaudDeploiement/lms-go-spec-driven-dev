# Guide : Wizard de création de cours

## 📋 Vue d'ensemble

Le wizard de création de cours est une nouvelle interface guidée en 3 étapes pour créer des cours complets avec modules et contenus en une seule session.

## ✨ Fonctionnalités

### Assistant guidé en 3 étapes

#### **Étape 1 : Informations du cours**
- Titre du cours (requis)
- Description (optionnel)
- Slug (généré automatiquement ou personnalisable)
- **Templates prédéfinis** :
  - 📄 Cours vide
  - 📚 Cours théorique (Introduction + PDF + Quiz)
  - 🎬 Formation vidéo (Présentation + Vidéo + Documents + Quiz)

#### **Étape 2 : Ajout des modules**
- Interface de construction visuelle
- Ajout de modules avec formulaire contextuel
- **Sélecteur de contenu intelligent** :
  - Recherche en temps réel
  - Filtrage automatique par type de module
  - Aperçu visuel avec icônes
- **Réorganisation** : Déplacer les modules vers le haut/bas
- **Application automatique des templates** : Les modules du template choisi sont pré-remplis

#### **Étape 3 : Révision et publication**
- Résumé complet du cours
- Liste des modules créés
- Options de publication :
  - Enregistrer en brouillon (défaut)
  - Publier immédiatement

## 🚀 Utilisation

### Accéder au wizard

1. Aller sur `/admin`
2. Cliquer sur l'onglet "Cours"
3. Cliquer sur le bouton **"Assistant guidé"** (gradient bleu-indigo)

Ou accéder directement à `/admin/courses/new`

### Créer un cours avec le wizard

#### Étape 1 : Informations
1. Saisir le titre du cours (obligatoire)
2. Optionnel : Ajouter une description
3. Optionnel : Personnaliser le slug (généré automatiquement sinon)
4. Optionnel : Choisir un template pour pré-remplir les modules
5. Cliquer sur "Suivant : Ajouter des modules"

#### Étape 2 : Modules
1. Cliquer sur "Ajouter un module"
2. Remplir le formulaire :
   - Titre du module
   - Type (PDF, Vidéo, Article, Quiz, SCORM)
   - Sélectionner un contenu (optionnel, filtré par type)
   - Durée estimée en minutes (optionnel)
3. Cliquer sur "Ajouter le module"
4. Répéter pour ajouter d'autres modules
5. Réorganiser les modules si nécessaire (boutons haut/bas)
6. Cliquer sur "Suivant : Révision"

#### Étape 3 : Révision et publication
1. Vérifier le résumé du cours
2. Vérifier la liste des modules
3. Choisir une option :
   - "Enregistrer en brouillon" : Le cours ne sera pas visible
   - "Publier immédiatement" : Le cours sera accessible aux apprenants
4. Cliquer sur "Créer le cours"

### Workflow complet recommandé

1. **Préparer les contenus** : Uploader les fichiers PDF, vidéos, etc. dans `/admin` > Contenus
2. **Créer le cours** : Utiliser le wizard pour créer le cours
3. **Assigner les contenus** : À l'étape 2, sélectionner les contenus pour chaque module
4. **Publier** : Choisir l'option de publication à l'étape 3

## 🎨 Design et UX

### Principes appliqués

1. **Progressive disclosure** : Afficher les informations par étapes
2. **Feedback visuel** : Indicateur de progression, validation
3. **Cohérence** : Icônes uniformes, palette cohérente
4. **Affordance** : Boutons clairs, formulaires intuitifs
5. **Réversibilité** : Boutons "Retour" à chaque étape

### Palette de couleurs

| Élément | Couleur | Usage |
|---------|---------|-------|
| Bouton principal | Bleu/Indigo (gradient) | Assistant guidé |
| Indicateur actif | Bleu 600 | Étape en cours |
| Indicateur complété | Vert 600 | Étape terminée |
| Formulaire module | Indigo 50 | Zone d'ajout |
| Validation | Vert 600 | Bouton "Créer" |

### Icônes par type de module

- 📄 PDF / Document
- 🎬 Vidéo
- 📝 Article / Texte
- ✅ Quiz
- 📦 SCORM

## 🔧 Architecture technique

### Fichiers

```
web/app/admin/courses/new/
└── page.tsx          # Page du wizard (714 lignes)

web/app/admin/
└── page.tsx          # Page admin principale (modifiée)
```

### Composants utilisés

- `Navigation` : Barre de navigation
- `Button` : Boutons d'action
- `Input` : Champs de saisie
- `Card` : Conteneurs
- Icônes : `lucide-react`

### État local (React hooks)

```typescript
// Étape 1
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [slug, setSlug] = useState("");
const [selectedTemplate, setSelectedTemplate] = useState("blank");

// Étape 2
const [modules, setModules] = useState<Module[]>([]);
const [contents, setContents] = useState<ContentResponse[]>([]);

// Étape 3
const [publishOption, setPublishOption] = useState<"draft" | "publish">("draft");
```

### API utilisée

```typescript
// Charger les contenus
await apiClient.listContents(organizationId);

// Créer le cours
const course = await apiClient.createCourse(organizationId, {
  title,
  slug,
  description,
});

// Ajouter les modules
for (const module of modules) {
  await apiClient.createModule(organizationId, courseId, {
    title: module.title,
    module_type: module.module_type,
    content_id: module.content_id,
    duration_seconds: module.duration_seconds,
  });
}

// Publier si demandé
if (publishOption === "publish") {
  await apiClient.publishCourse(organizationId, courseId);
}
```

## 📊 Comparaison : Wizard vs Création rapide

| Critère | Wizard | Création rapide |
|---------|--------|-----------------|
| Nombre d'étapes | 3 étapes guidées | 1 formulaire |
| Création de modules | Intégrée | Séparée |
| Templates | Oui (3 templates) | Non |
| Sélection de contenus | Interface visuelle | Champ texte (ID) |
| Réorganisation | Oui (drag-like) | Non |
| Publication directe | Oui (option) | Non (manuel) |
| **Temps estimé** | **2-3 minutes** | **5-7 minutes** |
| **Cas d'usage** | Cours complets | Modifications rapides |

## 🐛 Limitations actuelles

1. **Pas de drag & drop** : Utilise des boutons haut/bas pour réorganiser
2. **Pas d'édition** : Impossible de modifier un module ajouté (il faut le supprimer et recréer)
3. **Pas de sauvegarde intermédiaire** : Si on quitte, les données sont perdues
4. **Contenus limités** : Affiche tous les contenus (pas de pagination)

## 🎯 Améliorations futures

### Court terme
- [ ] Ajouter drag & drop pour réorganiser les modules
- [ ] Permettre l'édition d'un module avant création
- [ ] Sauvegarde automatique en brouillon
- [ ] Pagination des contenus

### Moyen terme
- [ ] Prévisualisation du cours
- [ ] Duplication de cours existants
- [ ] Import/export de structure de cours (JSON)
- [ ] Mode d'édition de cours existants via wizard

### Long terme
- [ ] Templates personnalisés
- [ ] Suggestions AI pour organisation des modules
- [ ] Upload de contenus directement depuis le wizard
- [ ] Mode collaboratif (plusieurs concepteurs)

## 📝 Tests suggérés

### Tests fonctionnels

- [ ] Créer un cours vide (template "Vide")
- [ ] Créer un cours avec template "Théorique"
- [ ] Créer un cours avec template "Vidéo"
- [ ] Ajouter 5+ modules manuellement
- [ ] Réorganiser les modules
- [ ] Supprimer un module
- [ ] Créer et publier directement
- [ ] Créer en brouillon puis publier depuis /admin

### Tests d'intégration

- [ ] Workflow complet : Upload contenus → Wizard → Vérification
- [ ] Vérifier que les modules sont bien associés aux contenus
- [ ] Vérifier l'ordre des modules après réorganisation
- [ ] Tester avec organisation différente

### Tests de régression

- [ ] L'ancienne méthode de création fonctionne toujours
- [ ] Les cours existants ne sont pas affectés
- [ ] La publication manuelle fonctionne toujours

## 📚 Ressources

### Code source
- Page wizard : [web/app/admin/courses/new/page.tsx](app/admin/courses/new/page.tsx)
- Page admin : [web/app/admin/page.tsx](app/admin/page.tsx)

### Documentation
- Architecture Next.js : [Next.js Documentation](https://nextjs.org/docs)
- Composants UI : Shadcn/ui inspired
- API client : [web/lib/api/client.ts](../lib/api/client.ts)

### Technologies utilisées
- **Frontend** : Next.js 14, React 18, TypeScript
- **Styling** : Tailwind CSS
- **Icônes** : Lucide React
- **Backend** : Go API (REST)

## 🔄 Changelog

### v1.0.0 - 2025-10-10
- ✨ Création du wizard en 3 étapes
- ✨ Templates prédéfinis (vide, théorique, vidéo)
- ✨ Sélecteur de contenu visuel avec recherche
- ✨ Réorganisation des modules
- ✨ Publication directe ou brouillon
- ✨ Intégration dans la page admin
- 🐛 Correction du problème de Suspense boundary
- 📚 Documentation complète

---

**Pour toute question ou suggestion** : Consulter le README principal du projet.
