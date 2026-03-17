# HTML → Figma Design Conversion Guidelines

## Purpose

This guide ensures that HTML/CSS layouts can be reliably converted into Figma designs (via MCP or import tools) without breaking structure, spacing, or hierarchy.

> **Main goal:** Preserve layout integrity first. Small visual fixes can be adjusted in Figma later.

---

## MCP Required Workflow

Follow these steps every time you use the Figma MCP server. Do not skip steps.

1. Run `get_design_context` first to fetch the structured representation for the exact node(s).
2. If the response is too large or truncated, run `get_metadata` to get the high-level node map, then re-fetch only the required node(s) with `get_design_context`.
3. Run `get_screenshot` for a visual reference of the node variant being implemented.
4. Download any assets needed from the MCP asset endpoint before starting implementation.
5. Translate the MCP output into this project's conventions and framework.
6. Validate the final result against the Figma screenshot for 1:1 look before marking complete.

> **Tip:** Break large screens into smaller components (e.g. Card, Header, BottomNav) and run MCP per component. Large selections slow tools down and cause incomplete responses.

---

## MCP Asset Rules

- The Figma MCP server provides an asset endpoint that serves images and SVGs.
- **If the MCP returns a `localhost` source for an image or SVG, use that source directly.**
- Do NOT import or add new icon packages — all assets come from the Figma payload.
- Do NOT create placeholders when a localhost source is already provided.

---

## Core Principles

- Layout correctness > Visual perfection
- Structure must be stable and predictable
- Avoid browser-dependent rendering tricks
- Class names must be semantic — they become Figma layer names
- Design tokens (CSS variables) must map to Figma variables

---

## DO — Recommended Practices

### 1. Use Clear and Stable Structure

Use simple HTML hierarchy:

```html
<div class="phone">
  <header class="TopBar"></header>
  <section class="LobbyList"></section>
</div>
```

- Keep nesting shallow (max 3–4 levels)
- Group UI into clear blocks (`CardContainer`, `HeaderBar`, `PrimaryButton`)

---

### 2. Name Layers Semantically

Class names become Figma layer names. Use descriptive, component-style names:

| Avoid         | Use instead       |
| ------------- | ----------------- |
| `div1`        | `LobbyCard`       |
| `group5`      | `PlayerRow`       |
| `wrapper`     | `ModalContainer`  |
| `box`         | `StatBadge`       |

```html
<div class="LobbyCard">
  <p class="LobbyCard__Title">Match Room</p>
  <button class="LobbyCard__JoinButton">Join</button>
</div>
```

---

### 3. Fix the Layout Size

Always define a fixed mobile frame:

```css
.phone {
  width: 390px;
  height: 844px;
}
```

Use fixed heights for key elements:

- Headers
- Buttons
- Cards

---

### 4. Use Design Tokens (CSS Variables)

**Do not hardcode values.** Define tokens at the top of your CSS and use them everywhere. This maps directly to Figma variables.

```css
:root {
  /* Colors */
  --color-bg-primary: #0d0d0d;
  --color-bg-card: #1a1a2e;
  --color-accent: #e94560;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0b0;
  --color-border: #2a2a3e;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* Typography */
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
}
```

Then use tokens consistently:

```css
.LobbyCard {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  gap: var(--space-md);
}
```

---

### 5. Use Simple Layout Systems

Prefer:

- `display: flex`
- `flex-direction`
- `gap`

**Example:**

```css
.LobbyList {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
```

---

### 6. Use Real Text Elements

Always use actual text nodes:

```html
<p class="LobbyCard__Title">Match Room</p>
```

Define text clearly using tokens:

```css
.LobbyCard__Title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  line-height: 24px;
  color: var(--color-text-primary);
}
```

---

### 7. Keep Styles Simple

Use tokens, not raw values:

```css
.CardContainer {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
```

Light shadow only:

```css
box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
```

---

### 8. Use Real Icons and Images

Use `<img>` or inline `<svg>`. If the Figma MCP provides a localhost asset URL, use it directly:

```html
<!-- From MCP asset endpoint -->
<img src="http://localhost:PORT/assets/icon-search.svg" />

<!-- Or inline SVG -->
<svg width="20" height="20">...</svg>
```

---

### 9. Build UI as Independent Component Blocks

Each component should mirror a Figma component:

```html
<div class="LobbyCard">
  <div class="LobbyCard__Header">
    <p class="LobbyCard__Title">Player Name</p>
    <span class="LobbyCard__Badge">PRO</span>
  </div>
  <button class="LobbyCard__JoinButton">Join</button>
</div>
```

- Each block must be visually independent
- Avoid mixing multiple responsibilities in one container
- Reuse the same component class for every repeated instance (do not clone with different names)

---

### 10. Lock Layout Stability

Use:

```css
width: 100%;
height: 56px;
```

Avoid unpredictable resizing.

---

## DON'T — Avoid These

### 1. Don't Break Layout Structure

Avoid:

- Deep nesting (5+ levels)
- Unnecessary overlapping elements
- Layout depending on content size

---

### 2. Avoid Complex CSS Effects

Do **not** use:

- `backdrop-filter`
- `filter: blur()`
- `mix-blend-mode`
- `clip-path`
- Complex gradients

> These do not render properly in Figma.

---

### 3. Don't Use Pseudo Elements for UI

Avoid `::before` and `::after`, especially for:

- Icons
- Labels
- Important visuals

---

### 4. Don't Use Emoji as UI

Avoid using emoji (e.g., ❤️ 🔍 ⭐) as UI elements.

> Replace with SVG icons instead.

---

### 5. Avoid CSS-Only Icons

Avoid:

- Border tricks
- Shape hacks

> Always use SVG or images.

---

### 6. Avoid Auto Layout Dependency

Avoid:

```css
height: auto;
width: fit-content;
```

> Causes layout shifts in Figma.

---

### 7. Don't Rely on Fonts Too Much

Avoid:

- Custom fonts
- Google Fonts dependency

Use instead:

```css
font-family: Arial, sans-serif;
```

---

### 8. Avoid Position-Based Layout

Avoid:

```css
position: absolute;
transform: translate(...);
```

> Only use for minor adjustments.

---

### 9. Don't Hardcode Values

Avoid:

```css
/* Bad — breaks token mapping to Figma variables */
background: #1a1a2e;
padding: 16px;
border-radius: 12px;
```

Use tokens instead:

```css
background: var(--color-bg-card);
padding: var(--space-lg);
border-radius: var(--radius-md);
```

---

## Common Breaking Issues

| Issue              | Result in Figma    |
| ------------------ | ------------------ |
| Emoji              | Missing            |
| Pseudo-elements    | Not rendered       |
| Blur effects       | Broken             |
| Auto height        | Layout shift       |
| Custom fonts       | Wrong spacing      |
| Absolute layout    | Misaligned UI      |
| Hardcoded values   | No variable link   |
| Generic class names| Unnamed layers     |
| Oversized selection| Truncated MCP output |

---

## Effective MCP Prompts

Use these prompt patterns when calling the Figma MCP server to get consistent results.

| Goal                            | Prompt Example                                                         |
| ------------------------------- | ---------------------------------------------------------------------- |
| Fetch a component               | `"Get design context for the LobbyCard component only"`               |
| Use existing tokens             | `"Get the variable names and values used in this frame"`               |
| Generate a single screen        | `"Generate HTML+CSS for this frame using the project's CSS variables"` |
| Reuse existing components       | `"Use existing LobbyCard and PrimaryButton components"`                |
| Validate against design         | `"Get a screenshot of this node and validate my implementation"`       |
| Limit scope                     | `"Only process the BottomNav section, not the full screen"`            |

---

## Best Workflow

### 1. Maintain Two Versions

- `index.html` → real app
- `index-figma.html` → simplified version

### 2. Break Down Before Exporting

Work on one component at a time, not the full screen:

1. Export `TopBar` → validate → fix
2. Export `LobbyCard` → validate → fix
3. Export `BottomNav` → validate → fix
4. Assemble full screen

### 3. Simplify Before Export

| Original        | Figma-safe      |
| --------------- | --------------- |
| Dynamic layout  | Fixed layout    |
| CSS tricks      | Simple blocks   |
| Pseudo elements | Real HTML       |
| Emoji           | SVG             |
| Hardcoded hex   | CSS variables   |
| Generic names   | Semantic names  |

### 4. Capture Only the App Frame

- Capture only `.phone`
- Exclude browser UI

### 5. Validate Before Import

Checklist:

- [ ] Fixed width/height on `.phone`
- [ ] No pseudo elements used for UI
- [ ] No emoji in UI
- [ ] No blur/filter effects
- [ ] Real text elements used
- [ ] Simple flex layout
- [ ] All values use CSS variables (no raw hardcoded hex/px)
- [ ] Class names are semantic (component-style naming)
- [ ] No `height: auto` or `width: fit-content` on key elements
- [ ] MCP screenshot matches implementation visually
- [ ] Assets use MCP localhost sources directly (no placeholders)
