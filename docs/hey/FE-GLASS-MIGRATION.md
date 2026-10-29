# FE-02 Glass Surface System — Legacy Rule → Token Map

**Generated:** 21 October 2026  
**Status:** Migration deferred — legacy rules preserved, new components use tokens.

---

## Inventory of Hard-Coded Glass Rules

The following table maps every `backdrop-filter` usage found in the codebase to the new glass token system. **No existing CSS was deleted** — this is an additive migration. Legacy rules remain in place; new components should use `GlassSurface` or the utility classes.

---

### 1. Core UI Components (`src/components/ui/`)

| File | Legacy Rule | Maps To |
|------|-------------|---------|
| `AgentCard.css` | `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `ArtifactCard.css` | `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `Badge.css` | `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `Button.css` | `backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))` | `.hey-glass-bar` (for primary) / `.hey-glass-card` (for secondary) |
| `Card.css` | Multiple: `blur(var(--glass-blur))` / `blur(var(--glass-blur-strong))` | `.hey-glass-card` / `.hey-glass-elevated` |
| `ContextMenu.css` | `backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))` | `.hey-glass-elevated` |
| `DeviceCard.css` | `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `Drawer.css` | `blur(18px)` / `blur(var(--glass-blur-strong))` | `.hey-glass-elevated` |
| `EmptyState.css` | `blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `Input.css` | `blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `MissionCard.css` | `blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `Modal.css` | `blur(18px)` / `blur(var(--glass-blur-strong))` | `.hey-glass-elevated` |
| `Popover.css` | `blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))` | `.hey-glass-elevated` |
| `ProviderCard.css` | `blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `Select.css` | `blur(var(--glass-blur))` / `blur(var(--glass-blur-strong))` | `.hey-glass-card` / `.hey-glass-elevated` |
| `Skeleton.css` | `blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `StatusDot.css` | `blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `Table.css` | `blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `Tabs.css` | `blur(var(--glass-blur)) saturate(var(--glass-saturate))` | `.hey-glass-card` |
| `Toast.css` | `blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))` | `.hey-glass-elevated` |
| `Tooltip.css` | `blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))` | `.hey-glass-elevated` |

---

### 2. Layout & Navigation

| File | Legacy Rule | Maps To |
|------|-------------|---------|
| `layout/Sidebar.css` | `blur(var(--glass-blur-strong))` / `blur(18px)` | `.hey-glass-bar` |
| `Navbar/Navbar.module.css` | `blur(30px) saturate(155%)` | `.hey-glass-bar` |

---

### 3. Pages

| File | Legacy Rule | Maps To |
|------|-------------|---------|
| `Auth.module.css` | `blur(24px)` | `.hey-glass-elevated` |
| `Customization.module.css` | `blur(40px)` / `blur(24px)` | `.hey-glass-elevated` / `.hey-glass-card` |
| `Features.module.css` | `blur(24px)` / `blur(28px)` / `blur(26px)` / `blur(30px)` | `.hey-glass-card` / `.hey-glass-elevated` |
| `HomeInfinity.module.css` | `blur(30px) saturate(150%)` / `blur(20px)` | `.hey-glass-elevated` |
| `Landing.module.css` | `blur(30px)` | `.hey-glass-elevated` |
| `MediaStudio.module.css` | `blur(18px)` / `blur(22px)` | `.hey-glass-card` |
| `Pricing.module.css` | `blur(28px)` | `.hey-glass-card` |
| `Voice.module.css` | `blur(30px)` | `.hey-glass-elevated` |
| `WorldStudio.module.css` | `blur(20px)` | `.hey-glass-card` |

---

### 4. Home Sections

| File | Legacy Rule | Maps To |
|------|-------------|---------|
| `Home/CustomizationSection.module.css` | `backdrop-filter:` (incomplete) | `.hey-glass-card` |
| `Home/EcosystemSection.module.css` | `blur(40px)` / `blur(30px)` | `.hey-glass-elevated` |
| `Home/HomeHero.module.css` | `blur(20px)` | `.hey-glass-card` |
| `Hero/Hero.module.css` | `blur(25px)` / `blur(30px)` / `blur(40px)` | `.hey-glass-elevated` |

---

### 5. Customization & Theme Gallery

| File | Legacy Rule | Maps To |
|------|-------------|---------|
| `Customization/ThemeGallery.module.css` | `blur(15px)` | `.hey-glass-card` |

---

### 6. Capabilities & Palette

| File | Legacy Rule | Maps To |
|------|-------------|---------|
| `capabilities/CapabilityPanel.module.css` | `blur(24px)` | `.hey-glass-card` |
| `palette/Palette.module.css` | `blur(var(--hey-glass-elevated-blur, 40px))` | `.hey-glass-elevated` |

---

### 7. Global Styles

| File | Legacy Rule | Maps To |
|------|-------------|---------|
| `styles/globals.css` | Multiple: `blur(18px)` to `blur(32px)`, various saturate values | Tier-specific utilities |
| `styles/theme.css` | `.hey-glass` with `blur(var(--glass-blur)) saturate(150%)` | `.hey-glass-card` |
| `styles/v1Premium.css` | `.hey-sidebar` `blur(34px)`, `.hey-topbar` `blur(34px)`, `.glass-card` `blur(28px)` | `.hey-glass-bar` / `.hey-glass-card` |
| `styles/chat.css` | `blur(28px) saturate(140%)` / `blur(24px) saturate(150%)` | `.hey-glass-elevated` / `.hey-glass-card` |
| `styles/liquid.css` | `blur(28px) saturate(145%)` | `.hey-glass-card` |
| `styles/infinity.css` | Multiple widget/sidebar/topbar rules | Tier-specific |
| `styles/pwa.css` | `blur(20px) saturate(135%)` / `blur(12px)` | `.hey-glass-card` |
| `styles/states.css` | `blur(3px)` | Custom (minimal blur) |
| `styles/desktopIsland.css` | `blur(28px) saturate(1.25)` | `.hey-glass-elevated` |
| `styles/utilities.css` | `.hey-island` `blur(20px)`, `.hey-window` `blur(24px)`, `.hey-cosmos-zoom` `blur(12px)` | Tier-specific |

---

## New Token System (Added to `src/styles/theme.css`)

### Tier Definitions

```css
/* Glass Bar — Top bar, sidebar, status bar */
--hey-glass-bar-fill: rgba(5, 8, 10, 0.78);
--hey-glass-bar-blur: 34px;
--hey-glass-bar-border: rgba(255, 255, 255, 0.055);

/* Glass Card — Cards, panels, forms */
--hey-glass-card-fill: linear-gradient(145deg, rgba(255,255,255,0.052), rgba(255,255,255,0.018));
--hey-glass-card-blur: 28px;
--hey-glass-card-border: rgba(255, 255, 255, 0.075);

/* Glass Elevated — Modals, popovers, command palette */
--hey-glass-elevated-fill: rgba(10, 13, 17, 0.92);
--hey-glass-elevated-blur: 40px;
--hey-glass-elevated-border: rgba(255, 255, 255, 0.10);

/* Shared */
--hey-glass-shadow: 0 22px 65px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.08);
--hey-glass-inner-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.12);
```

### Utility Classes

```css
.hey-glass-bar     { /* uses bar tokens */ }
.hey-glass-card    { /* uses card tokens */ }
.hey-glass-elevated { /* uses elevated tokens */ }
```

### Accessibility Overrides

```css
@media (prefers-contrast: more) {
  --hey-glass-bar-fill: rgba(0, 0, 0, 0.92);
  --hey-glass-bar-blur: 0;
  --hey-glass-card-fill: rgba(255, 255, 255, 0.95);
  --hey-glass-card-blur: 0;
  --hey-glass-elevated-fill: rgba(0, 0, 0, 0.98);
  --hey-glass-elevated-blur: 0;
}

@media (prefers-reduced-transparency: reduce) {
  --hey-glass-bar-fill: rgba(5, 8, 10, 0.98);
  --hey-glass-card-fill: rgba(255, 255, 255, 0.95);
  --hey-glass-elevated-fill: rgba(10, 13, 17, 0.98);
}
```

---

## Migration Strategy (Deferred)

**This migration is documented but not executed.** Per the additive-only rule, legacy CSS remains untouched. Migration will happen in a future phase by:

1. **Phase 1** — New components use `GlassSurface` (done)
2. **Phase 2** — Replace utility classes in new features (`.hey-glass-bar`, etc.)
3. **Phase 3** — Gradually migrate existing components when they are refactored
4. **Phase 4** — Remove legacy `backdrop-filter` declarations once all consumers use tokens

---

## Verification

Run the token tests to verify all tiers are defined:

```bash
node --test tests/glass-tokens.test.js
```

**Expected:** 21 tests pass, confirming all three tiers have fill/blur/border with fill opacity ≥ 0.05.