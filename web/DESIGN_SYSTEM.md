# LMS Go - Design System Revolut-Inspired

## 🎨 Philosophie de design

Notre design s'inspire des principes de Revolut pour créer une expérience premium, moderne et épurée :

- **Minimalisme premium** : Chaque élément a une fonction, rien de superflu
- **Fluidité** : Animations subtiles qui guident l'utilisateur
- **Profondeur** : Glassmorphism et ombres pour créer de la hiérarchie
- **Contraste** : Fond très sombre avec accents vibrants
- **Précision** : Alignement parfait et espacement cohérent

---

## 📐 Spacing Scale

```css
spacing: {
  '1': '4px',    // Micro spacing
  '2': '8px',    // Tight
  '3': '12px',   // Close
  '4': '16px',   // Default
  '6': '24px',   // Comfortable
  '8': '32px',   // Spacious
  '12': '48px',  // Section
  '16': '64px',  // Large section
  '24': '96px',  // Hero
  '32': '128px', // Extra large
}
```

**Règles** :
- Espacement par multiples de 4px uniquement
- Entre sections : 48px minimum
- Padding cards : 24-32px
- Gaps dans grids : 16-24px

---

## 🎨 Palette de couleurs

### Background
```css
--bg-primary: #0A0E1A          /* Near black */
--bg-secondary: #111827        /* Dark slate */
--bg-tertiary: #1E293B         /* Lighter slate */
--bg-glass: rgba(17, 24, 39, 0.6) /* Glassmorphism base */
```

### Surfaces
```css
--surface-elevated: rgba(255, 255, 255, 0.03)
--surface-overlay: rgba(255, 255, 255, 0.08)
--surface-glass: rgba(255, 255, 255, 0.05)
```

### Borders
```css
--border-subtle: rgba(255, 255, 255, 0.08)
--border-default: rgba(255, 255, 255, 0.12)
--border-strong: rgba(255, 255, 255, 0.2)
--border-accent: rgba(99, 102, 241, 0.4)
```

### Text
```css
--text-primary: #F8FAFC        /* High contrast */
--text-secondary: #CBD5E1      /* Medium contrast */
--text-tertiary: #64748B       /* Low contrast */
--text-disabled: #475569       /* Very low contrast */
```

### Accent Colors
```css
--accent-primary: #6366F1      /* Indigo - Actions principales */
--accent-secondary: #22D3EE    /* Cyan - Succès, validations */
--accent-success: #10B981      /* Green - Complétion */
--accent-warning: #F59E0B      /* Amber - Attention */
--accent-error: #EF4444        /* Red - Erreurs */
--accent-info: #3B82F6         /* Blue - Informations */
```

### Gradients
```css
--gradient-primary: linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)
--gradient-success: linear-gradient(135deg, #10B981 0%, #22D3EE 100%)
--gradient-glow: radial-gradient(circle at center, rgba(99, 102, 241, 0.15), transparent 70%)
```

---

## ✍️ Typographie

### Famille
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

### Scale
```css
--text-xs: 12px / 16px (line-height)
--text-sm: 14px / 20px
--text-base: 16px / 24px
--text-lg: 18px / 28px
--text-xl: 20px / 28px
--text-2xl: 24px / 32px
--text-3xl: 30px / 36px
--text-4xl: 36px / 40px
--text-5xl: 48px / 1
```

### Weights
```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Règles typographiques
- **Titres principaux** : text-3xl, font-bold, text-primary, tracking-tight
- **Sous-titres** : text-xl, font-semibold, text-primary
- **Body** : text-base, font-normal, text-secondary
- **Labels** : text-xs, font-medium, uppercase, tracking-wide, text-tertiary
- **Boutons** : text-sm, font-medium

---

## 🎯 Composants de base

### Cards

**Glass Card** (défaut)
```css
background: rgba(255, 255, 255, 0.05)
backdrop-filter: blur(24px)
border: 1px solid rgba(255, 255, 255, 0.1)
border-radius: 24px
padding: 24px-32px
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5)
```

**Elevated Card** (hover/focus)
```css
background: rgba(255, 255, 255, 0.08)
border: 1px solid rgba(99, 102, 241, 0.4)
box-shadow:
  0 25px 50px -12px rgba(0, 0, 0, 0.5),
  0 0 60px -15px rgba(99, 102, 241, 0.4)
transform: translateY(-2px)
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### Buttons

**Primary** (Actions principales)
```css
background: linear-gradient(135deg, #6366F1, #22D3EE)
color: white
padding: 12px 24px
border-radius: 9999px (rounded-full)
font-size: 14px
font-weight: 600
box-shadow: 0 10px 40px -12px rgba(99, 102, 241, 0.5)
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)

hover: {
  box-shadow: 0 20px 50px -12px rgba(99, 102, 241, 0.6)
  transform: translateY(-1px)
}

active: {
  transform: scale(0.98)
}
```

**Secondary** (Actions secondaires)
```css
background: rgba(255, 255, 255, 0.08)
border: 1px solid rgba(255, 255, 255, 0.1)
color: white
padding: 12px 24px
border-radius: 9999px
font-size: 14px
font-weight: 600

hover: {
  background: rgba(255, 255, 255, 0.12)
  border-color: rgba(255, 255, 255, 0.2)
}
```

**Ghost** (Actions tertiaires)
```css
background: transparent
color: var(--text-secondary)
padding: 12px 24px
border-radius: 9999px
font-size: 14px
font-weight: 500

hover: {
  background: rgba(255, 255, 255, 0.05)
  color: var(--text-primary)
}
```

### Inputs

**Text Input**
```css
background: rgba(255, 255, 255, 0.04)
border: 1px solid rgba(255, 255, 255, 0.1)
border-radius: 16px
padding: 12px 16px
color: var(--text-primary)
font-size: 14px

focus: {
  background: rgba(255, 255, 255, 0.06)
  border-color: rgba(99, 102, 241, 0.5)
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1)
}

placeholder: {
  color: var(--text-tertiary)
}
```

### Badges

**Status Badge**
```css
background: rgba(255, 255, 255, 0.08)
border: 1px solid rgba(255, 255, 255, 0.12)
padding: 4px 12px
border-radius: 9999px
font-size: 11px
font-weight: 600
text-transform: uppercase
letter-spacing: 0.05em
```

Variantes :
- Success : border cyan-400/30, text cyan-300
- Warning : border amber-400/30, text amber-300
- Error : border red-400/30, text red-300
- Info : border blue-400/30, text blue-300

---

## 🌊 Animations & Transitions

### Timing Functions
```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
--ease-in-out: cubic-bezier(0.4, 0, 0.6, 1)
```

### Durées
```css
--duration-fast: 150ms
--duration-normal: 250ms
--duration-slow: 350ms
```

### Animations courantes

**Fade In**
```css
@keyframes fadeIn {
  from: { opacity: 0; transform: translateY(20px); }
  to: { opacity: 1; transform: translateY(0); }
}
animation: fadeIn 0.35s var(--ease-smooth)
```

**Slide In**
```css
@keyframes slideIn {
  from: { opacity: 0; transform: translateX(-20px); }
  to: { opacity: 1; transform: translateX(0); }
}
animation: slideIn 0.3s var(--ease-smooth)
```

**Scale In**
```css
@keyframes scaleIn {
  from: { opacity: 0; transform: scale(0.95); }
  to: { opacity: 1; transform: scale(1); }
}
animation: scaleIn 0.25s var(--ease-smooth)
```

**Shimmer Loading**
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)
background-size: 1000px 100%
animation: shimmer 2s infinite
```

---

## 🎭 Effets visuels

### Glassmorphism
```css
backdrop-filter: blur(24px) saturate(180%)
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
```

### Glow Effect (hover)
```css
box-shadow:
  0 25px 50px -12px rgba(0, 0, 0, 0.5),
  0 0 60px -15px rgba(99, 102, 241, 0.5),
  inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
```

### Soft Shadow (cards)
```css
box-shadow:
  0 25px 50px -12px rgba(0, 0, 0, 0.5),
  0 0 0 1px rgba(255, 255, 255, 0.05)
```

---

## 📱 Responsive Breakpoints

```css
sm: 640px   // Mobile large
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

**Règles** :
- Mobile-first approach
- Layouts flexibles avec grid/flexbox
- Typographie responsive (clamp)
- Touch targets : 44px minimum sur mobile

---

## ♿ Accessibilité

### Contrastes
- Texte primaire : ratio 16:1 minimum
- Texte secondaire : ratio 7:1 minimum
- Texte tertiaire : ratio 4.5:1 minimum

### Focus States
```css
focus-visible: {
  outline: 2px solid rgba(99, 102, 241, 0.5)
  outline-offset: 2px
}
```

### Touch Targets
- Minimum 44x44px sur mobile
- Espacement de 8px entre éléments interactifs

---

## 📊 Layouts

### Container
```css
max-width: 1280px (lg)
margin: 0 auto
padding: 0 24px (mobile) / 48px (desktop)
```

### Grid System
```css
grid-cols-12 (desktop)
grid-cols-4 (mobile)
gap: 24px
```

### Section Spacing
```css
padding-top: 64px (mobile) / 96px (desktop)
padding-bottom: 64px (mobile) / 96px (desktop)
```

---

## 🎨 États des composants

### Default
- Couleurs normales
- Aucune transformation

### Hover
- Élévation légère (translateY -2px)
- Bordure accentuée
- Glow effect
- Durée : 250ms

### Active/Pressed
- Scale légèrement réduit (0.98)
- Durée : 150ms

### Focus
- Ring de focus visible (2px, accent color)
- Outline offset : 2px

### Disabled
- Opacité : 0.5
- Cursor : not-allowed
- Aucune interaction hover

### Loading
- Shimmer animation
- Opacité réduite : 0.7
- Cursor : wait

---

## 🎯 Patterns UX

### Empty States
- Icon centré (64x64px)
- Titre (text-xl, semibold)
- Description (text-sm, tertiary)
- CTA (si applicable)

### Loading States
- Skeleton screens avec shimmer
- Spinners : border spinning (24px default)
- Progress bars : gradient animé

### Error States
- Icon error (red)
- Message clair et actionnable
- Bouton retry si applicable

### Success States
- Checkmark animé (scale + fade)
- Message de confirmation
- Auto-dismiss après 3s

---

## 🔧 Utilisation

### Installation
```bash
npm install framer-motion lucide-react
```

### Import du CSS
```tsx
import '@/app/globals.css'
```

### Utilisation des classes
```tsx
<div className="glass-card">
  <h2 className="text-2xl font-bold text-primary">Titre</h2>
  <p className="text-sm text-secondary">Description</p>
</div>
```

---

## 📚 Ressources

- **Typographie** : [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
- **Icons** : [Lucide Icons](https://lucide.dev)
- **Animations** : [Framer Motion](https://www.framer.com/motion/)
- **Inspiration** : Revolut, Linear, Stripe

---

*Version 1.0 - Dernière mise à jour : 2025-10-09*
