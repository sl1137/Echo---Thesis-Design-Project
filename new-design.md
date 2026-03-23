# Design System Specification: Editorial Softness

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Curated Sanctuary."**

This system rejects the clinical, rigid structures of traditional SaaS dashboards in favor of an editorial, tactile experience. It treats the digital screen like a high-end art journal—spacious, intentional, and human. We achieve this through "Organic Asymmetry," where elements are not always locked to a predictable grid, and "Tonal Depth," where the user’s journey is guided by shifts in light and color rather than harsh lines.

The aesthetic is modern and gentle, leaning into the warmth of the pastel palette to create an inviting atmosphere that feels premium yet accessible.

---

## 2. Colors
Our palette is a sophisticated blend of spring-inspired pastels and grounded earthy tones. The focus is on low-contrast harmony.

### Palette Application
- **Primary & Secondary:** `primary` (#904949) and `secondary` (#346382) act as anchor points for high-importance actions, while their containers (`primary_container`: #F59C9A; `secondary_container`: #ACDAFE) provide the "Soft Pink" and "Periwinkle" washes that define the brand.
- **The "No-Line" Rule (Default):** Avoid 1px solid borders for sectioning. Structural boundaries should be defined primarily through background color shifts and tonal layering.
  - Example: a `surface_container_low` (#FFF0EF) card on a `surface` (#FFF8F7) background.
- **Surface Hierarchy & Nesting:** Use the `surface_container` tiers to create "stacked" depth. Treat the UI as layers of fine paper.
  - Example: a search bar in `surface_container_highest` (#FFDAD7) "floating" above a navigation bar in `surface_container_low`.
- **The Glass & Gradient Rule:** For floating modals or navigation headers, utilize Glassmorphism:
  - semi-transparent `surface_bright` + `backdrop-blur(20px)`
- **Signature Textures:** Apply subtle linear gradients (e.g., `primary` → `primary_container`) on main CTA buttons to provide a soft editorial glow.

**Text color rule:** Never use pure black (#000000). Use `on_surface` (#2D1513) for warmth and consistency.

---

## 3. Typography
The typographic soul of this system lies in the high-contrast pairing of an authoritative Serif and a functional Sans-Serif.

- **Display & Headlines (Noto Serif):** Used for storytelling and impact. These should feel editorial.
- **Titles & Body (Plus Jakarta Sans):** A modern sans-serif that maintains readability.
- **Hierarchy as Identity:** Wide letter-spacing on labels (all-caps when needed) creates an architectural feel, while tight leading in serif headings keeps the editorial tone intentional.

---

## 4. Elevation & Depth
We eschew traditional drop shadows for **Tonal Layering**. Depth is a feeling, not a dark smudge.

- **The Layering Principle:** Stacking determines importance. Place a `surface_container_lowest` (#FFFFFF) card on a `surface_container` (#FFE9E7) background to create a crisp, natural lift.
- **Ambient Shadows (Only when needed):** If separation cannot be achieved through tonal shifts, use large blur (30px+) and low opacity (4%–6%). Shadow color must be a tinted version of `on_surface` (#2D1513), never pure black.
- **The "Ghost Border" Fallback (Allowed):** If a border is required for accessibility or focus clarity, use `outline_variant` at low opacity (≈15%). High-contrast opaque borders are forbidden.

---

## 5. Roundedness (Card-style)
Consistency in softness is key. This system uses **card-style rounding**.

- Default rounding for most UI elements: **16px**
- Larger containers / hero moments: **24–32px** (use sparingly and consistently)

---

## 6. Components (Design Intent)

### Buttons
- **Primary:** High-impact. Uses a gradient from `primary` to `primary_container` with `on_primary` text.
- **Secondary:** Uses `secondary_container` with `on_secondary_container` text.
- **Tertiary (Editorial link):** Text-only with an underline on hover, using `secondary` for a refined editorial touch.

> Note: Roundedness defaults to card-style (16px). Avoid fully-pill buttons unless intentionally introduced as a new system rule.

### Chips & Tags
- **Filter Chips:** Use `secondary_fixed_dim` (#9ECCF0) with `on_secondary_fixed` text.
- Chips should feel lightweight, calm, and non-social-media-like.
> Note: Roundedness defaults to 16px. Avoid fully-pill chips unless intentionally introduced as a new system rule.

### Input Fields
- **Text Inputs:** Use `surface_container_low` for the field background.
- Default: no visible border; rely on tonal shift.
- On focus: transition background to `surface_container_highest`, and optionally use the "ghost border" fallback for focus clarity.

### Cards & Lists
- **The "No Divider" Rule:** Avoid divider lines. Separate list items via vertical spacing (Spacing 4/5) or subtle background alternation (`surface` ↔ `surface_container_low`).
- **Nesting:** For complex data, nest a `surface_container_lowest` inner card inside a `surface_container` outer card.

---

## 7. Do's and Don'ts

### Do
- **Do** use white space as a structural element. If a layout feels crowded, increase spacing tokens rather than adding lines.
- **Do** use "Peach Fuzz" (#FFBE98) and "Butter Yellow" (#FFE7AB) for accent moments like notifications or highlighted snippets.
- **Do** ensure serif headings have enough breathing room (at least `space-8` above them) to feel editorial.

### Don't
- **Don't** use pure black (#000000) for text. Use `on_surface` (#2D1513).
- **Don't** use sharp corners. Every element must adhere to the roundedness scale.
- **Don't** rely on standard drop shadows. Use tonal shifts first; ambient shadows only when functional separation is impossible.

---

# 8. Execution Appendix (Engineering Spec — FINAL, Directly Implementable)

This section is the **source of truth for implementation**. Do not guess sizes or introduce arbitrary values.

## A) Spacing scale (px)
Use only these spacing values:
- `space-1 = 4`
- `space-2 = 8`
- `space-3 = 12`
- `space-4 = 16`
- `space-5 = 20`
- `space-6 = 24`
- `space-8 = 32`
- `space-10 = 40`
- `space-12 = 48`

**Rule:** No arbitrary numbers (e.g., 13, 18, 22). Always use the scale above.

## B) Radius (px) — Card-style
- `radius-xs = 6`
- `radius-sm = 10`
- `radius-md = 14`
- `radius-lg = 16`  ← default for cards, buttons, inputs, bubbles, chips
- `radius-xl = 24`  ← large panels/modals only
- `radius-2xl = 32` ← hero containers only (rare)
- `radius-pill = 999` ← avoid in this design system unless explicitly required

**Rule:** Default radius is **16px** across components.

## C) Borders & Elevation
- Border width: **1px** (only when necessary)
- Default border color: `outline_variant` at ~15% opacity (ghost border)
- Shadow usage (keep minimal):
  - `elevation-0`: none
  - `elevation-1`: `0 1px 2px rgba(0,0,0,0.08)`
  - `elevation-2`: `0 6px 16px rgba(0,0,0,0.10)` (modals/overlays only)

**Rule:** Prefer tonal shifts. Use border/shadow only for clarity and accessibility.

## D) Typography (mobile defaults)
**Font families**
- Sans: **Plus Jakarta Sans**
- Serif (display only): **Noto Serif**

**Text tokens (size / line-height / weight)**
- `display-lg`: 32 / 40 / 700 (Serif)
- `title-lg`: 22 / 28 / 700 (Sans)
- `title-md`: 18 / 24 / 600 (Sans)
- `body-lg`: 16 / 24 / 400 (Sans)
- `body-md`: 14 / 20 / 400 (Sans)
- `label-lg`: 14 / 20 / 600 (Sans)
- `label-md`: 12 / 16 / 600 (Sans)
- `caption`: 12 / 16 / 400 (Sans)

**Rule:** Avoid mixing serif except for `display-lg`.

---

## Component specs (MVP)

### 1) Buttons
- Height: **44px**
- Radius: **16px**
- Padding: `px-4` (16) + `py-2.5` (~10)
- Text style: `label-lg`
- Primary:
  - Background: `primary` (can be subtle gradient to `primary_container`)
  - Text: `on_primary`
- Secondary:
  - Background: `secondary_container`
  - Text: `on_secondary_container`
- Ghost:
  - Background: transparent
  - Text: `on_surface`
  - Hover background: `surface_container_low`

**States**
- Disabled: opacity ~60% (layout unchanged)
- Focus: ghost border or 2px ring using `primary` (subtle)

### 2) Inputs / Text fields
- Height: **44px**
- Radius: **16px**
- Padding-x: **16px**
- Background: `surface_container_low`
- Default: no visible border (tonal shift defines shape)
- Focus:
  - Background: `surface_container_highest`
  - Optional ghost border (outline_variant @ ~15%) for clarity

### 3) Cards (default / micro-practice / summary)
- Radius: **16px**
- Padding: **16px**
- Background: `surface_container_low`
- Default separation: tonal shift
- Optional: ghost border OR `elevation-1` (choose one)

Typography inside:
- Title: `title-md`
- Body: `body-md`
- Meta: `label-md` or `caption` in `on_surface_variant`

### 4) Chips / Tags
- Height: **32px**
- Radius: **16px**
- Padding: `px-3` (12) + `py-1.5` (~6)
- Text: `label-md`
- Default:
  - Background: `surface_container_low`
  - Text: `on_surface`
  - Optional: ghost border for clarity
- Selected:
  - Background: `secondary_container`
  - Text: `on_secondary_container`

### 5) Message bubbles (chat)
- Max width: **78%**
- Radius: **16px**
- Padding: **12px 14px**
- Vertical gap: **8px**
- Assistant:
  - Background: `surface_container_low`
  - Text: `on_surface`
- User:
  - Background: `secondary_container` (or `primary_container` if needed)
  - Text: corresponding `on_*`

Meta:
- Timestamp/caption: `caption`, color `on_surface_variant`

### 6) Bottom navigation (mobile)
- Height: **72px** (includes safe-area padding)
- Icon: **24px**
- Label: `label-md`
- Divider: ghost border (outline_variant @ ~15%)
- Active state:
  - Icon/label: `primary`
  - Optional indicator: rounded rect (radius 16) in `secondary_container`

---

## Implementation rules (important)
- Do not invent new colors, radii, or spacing values.
- Build screens using the components above; avoid page-specific one-off styling.
- If a new component is needed, define its spec here first, then implement.