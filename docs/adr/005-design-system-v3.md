# ADR-005: Design System v3 — CSS Variables + Token Architecture

## Status
Accepted

## Context
The IMI platform has 111+ backoffice pages and a public website. Visual consistency across all surfaces is critical for brand perception and user trust in a real estate context.

## Decision
Implement **Design System v3 (DS3)** using CSS custom properties:

### Brand Tokens
- **Navy scale**: `--imi-navy-950` (#05080F) to `--imi-navy-50` (#E4E8F2)
- **Gold scale**: `--imi-gold-700` (#8A6820) to `--imi-gold-50` (#FAF4E4)
- **Accent**: `--imi-gold-500` (#B8943A)

### Semantic Tokens
- Backgrounds: `--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-muted`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Borders: `--border-default`, `--border-subtle`, `--border-strong`
- Radii: `--r-sm` (4px), `--r-md` (8px), `--r-lg` (12px), `--r-xl` (16px)

### Typography
- **Libre Baskerville**: Display headings
- **Figtree**: UI text
- **JetBrains Mono**: Data, metrics, timestamps

### Theme Support
Dark (default Navy) and Light modes via CSS variable overrides on `.theme-light` class.

### Buttons
All interactive buttons use `border-radius: 4px` (DS3 standard — not pill-shaped).

## Consequences
- **Positive**: Theme changes propagate instantly via CSS variables
- **Positive**: Dark/light mode without JavaScript
- **Positive**: Consistent `T` object in TypeScript maps to CSS vars
- **Negative**: Migration from hardcoded hex values ongoing (72 pages still have some)
- **Negative**: CSS specificity conflicts when inline styles override variables

## Alternatives Considered
- **Tailwind-only**: Utility classes are harder to theme dynamically
- **CSS-in-JS (styled-components)**: Runtime overhead, SSR complexity
- **Design tokens JSON**: Additional build step needed
