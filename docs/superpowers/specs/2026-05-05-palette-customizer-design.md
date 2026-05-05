# Palette Customizer — User-Facing Theme Editor

**Date:** 2026-05-05
**Status:** Design Approved
**Project:** goblog — web/ (SvelteKit)

## Overview

Port the user-facing theme customization from xypnox Themescura (`newtheme/src/components/themeManager/`) to goblog. Visitors can pick from preset palettes or edit colors in real time, with changes persisted to localStorage.

## Design Decisions

| Decision | Choice |
|----------|--------|
| UI placement | Global floating button (fixed, bottom-right), matching newtheme |
| Presets | 3-5 curated palettes (Aster default + warm/cool/high-contrast variants) |
| Editor scope | Full port: 5-color palette (light + dark), font family, card style |
| Architecture | Modular: Store / Injection / Editor UI three-layer separation |
| Lazy loading | Editor panel dynamically imported on first click |
| Persistence | localStorage: `palette-current` (active) + `palette-customs` (saved customs, max 5) |
| SSR flash | Accepted for v1; may add blocking script later |

## Architecture

### File Structure

```
web/src/lib/shared/theme/
├── theme.ts               # Existing — CSS variable generation
├── palette.ts             # Extended — ThemePalette interface + presets array
├── theme.svelte.ts        # Extended — reads from paletteStore instead of hardcoded default
└── paletteStore.svelte.ts # NEW — palette state management + localStorage

web/src/lib/features/theme-customizer/
└── components/
    ├── ThemeCustomizer.svelte      # NEW — floating button + panel container (lazy loads editor)
    ├── PaletteEditor.svelte        # NEW — 5-color editor (light + dark dual mode)
    ├── PresetSelector.svelte       # NEW — preset palette thumbnail selector
    └── CardStyleSelector.svelte    # NEW — card type switcher (gradient/solid/border/transparent)
```

### Data Flow

```
User clicks floating button
  → ThemeCustomizer lazy-loads editor panel
  → PresetSelector click / PaletteEditor manual edit
  → paletteStore.current = newPalette
  → theme.svelte.ts $effect triggers
  → generateThemeFromPalette() → cssConverter()
  → <style> tag content updated → site recolors instantly
  → persistToLocalStorage() saves
```

### Existing Code Changes

| File | Change |
|------|--------|
| `palette.ts` | Add `presets: ThemePalette[]` export (3-5 curated presets) |
| `theme.svelte.ts` | `startThemeSync()` reads `paletteStore.current` instead of `defaultThemePalette` |
| `+layout.svelte` | Import and render `ThemeCustomizer` |

## paletteStore Design

```typescript
class PaletteStore {
  current = $state<ThemePalette>(defaultThemePalette);
  presets: ThemePalette[] = [/* ... */];
  customs = $state<ThemePalette[]>([]);

  init(): void;              // restore from localStorage
  select(id: string): void;  // apply by ID (preset or custom)
  update(palette: ThemePalette): void;
  saveCustom(palette: ThemePalette): void;     // max 5
  deleteCustom(id: string): void;
  resetToDefault(): void;
}
```

## Editor UI Layout

```
Theme Customizer                    [x]

Presets:  [Aster] [Coral] [Moss]   ← circular swatch thumbnails

Light Mode
  Primary      [■] #613de3
  Secondary    [■] #b55089
  Background   [■] #dfdfed
  Surface      [■] #9f9fe02d
  Text         [■] #343654

Dark Mode
  Primary      [■] #ff5370
  Secondary    [■] #5d86ff
  Background   [■] #0f111a
  Surface      [■] #1e2139a0
  Text         [■] #919DCF

Card Style:  [gradient] [solid] [solid-border] [transparent]
Font:        [Jost ▾]

[Save as Custom]  [Reset to Default]
```

## Floating Button

- `position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 50`
- Palette/paintbrush SVG icon, circular, styled consistently with BottomNav
- Always visible; toggles panel open/closed with slide-up + fade animation

## Lazy Loading

`ThemeCustomizer.svelte` always renders the floating button. On first click:
```
dynamic import('./PaletteEditor.svelte')
dynamic import('./PresetSelector.svelte')
```
Editor code stays out of the initial bundle until the user interacts.

## Reactive Injection Link

```
paletteStore.current = newPalette        // $state assignment
  → $effect in theme.svelte.ts fires
  → generateThemeFromPalette(paletteStore.current)
  → cssConverter(uiTheme)
  → styleEl.textContent = newCSS
  → browser repaints, no page reload
```

## Page Load Recovery

```
browser startup
  → paletteStore.init() reads 'palette-current' from localStorage
  → found → paletteStore.current = savedPalette
  → not found → paletteStore.current = defaultThemePalette
  → startThemeSync() injects CSS (SSR already emitted default; client replaces if custom)
```

A brief flash may occur (~1-2 frames) if the saved palette differs from default. Accepted for v1; can add a blocking `<script>` in `app.html` later.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| localStorage unavailable | Silently fallback to default; editor works without persistence |
| Corrupted saved data | Validation fails → discard → use default |
| Invalid color input | Validate via tinycolor; discard silently if invalid |
| Custom palette limit (5) | Prompt user to delete an existing custom before saving |

## Implementation Phases

| Phase | Scope | Files |
|-------|-------|-------|
| P1 | `paletteStore.svelte.ts` + extend `palette.ts` (presets) + modify `theme.svelte.ts` | 1 new, 2 modified |
| P2 | `ThemeCustomizer.svelte` + `PresetSelector.svelte` + `CardStyleSelector.svelte` | 3 new |
| P3 | `PaletteEditor.svelte` (5-color × 2-mode picker) | 1 new |
| P4 | Integrate into `+layout.svelte` | 1 modified |

**Total: 5 new files, 3 modified files.**
