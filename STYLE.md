# Strava Hub — Design System, UI & UX Flow Specification (`STYLE.md`)

This document outlines the complete visual design system, glassmorphism UI architecture, interactive patterns, and user experience flows implemented in Strava Hub.

---

## 1. Visual Philosophy & Glassmorphic Depth System

Strava Hub is designed around **quiet luxury** and **physical believability**. Rather than decorative transparency, surfaces simulate frosted glass as a structural physical material that captures and diffuses ambient light.

### 1.1 The Three-Layer Depth Model

```
┌────────────────────────────────────────────────────────┐
│ Layer 3: Surface (Frosted Glass Panels, GlassCard)     │  ← Inset 1px light-catch top specular rim
├────────────────────────────────────────────────────────┤
│ Layer 2: Diffusion (Reflected Back-Gradients & Blurs)  │  ← Tuned backdrop blur (10px–20px)
├────────────────────────────────────────────────────────┤
│ Layer 1: Atmosphere (Ambient Base Gradients & Light)   │  ← Directional soft radial fields
└────────────────────────────────────────────────────────┘
```

1. **Layer 1: Atmosphere (Ambient Canvas)**
   - Not a flat color, but a soft field of directional light.
   - **Light mode** combines warm cream (`#f8f5f0`), warm champagne, and soft amber/orange ambient light blooms.
   - **Dark mode** uses deep carbon near-black (`#090a0f` → `#12151c`) with luminous muted Strava orange (`rgba(252, 76, 2, 0.15)`) highlights.
2. **Layer 2: Diffusion (Subsurface Reflection)**
   - Elements behind panels are diffused using `backdrop-filter: blur()`.
   - Tuned blur depths: 10px (`glass-light`), 16px (`glass-mid`), 20px (`glass-strong`).
   - Never stacks heavy blurs to avoid muddy visual fog.
3. **Layer 3: Surface (Interactive Glass Panels & Highlights)**
   - Every glass panel features a **top-edge specular highlight**:
     - Light Mode: `inset 0 1px 0 0 rgba(255, 255, 255, 0.85)`
     - Dark Mode: `inset 0 1px 0 0 rgba(255, 255, 255, 0.12)`
   - This highlight simulates light hitting the physical bevel edge of glass, providing tangible thickness, premium finish, and tactile depth.

---

## 2. Color Palette & Typography

### 2.1 Color Tokens

The signature primary accent is **Strava Orange**:

| Token | Light Mode Value | Dark Mode Value | Usage |
|---|---|---|---|
| **Accent (Orange)** | `#fc4c02` / `hsl(18, 98%, 50%)` | `#f97316` / `hsl(24, 95%, 53%)` | Primary CTA buttons, active tabs, progress indicators |
| **Accent Glow** | `rgba(252, 76, 2, 0.18)` | `rgba(249, 115, 22, 0.24)` | Focus rings, hover states, subtle ambient highlights |
| **Background (Atmosphere)** | Warm champagne-cream gradient | Deep carbon-slate gradient | Base page canvas |
| **Surface Strong** | `rgba(255, 255, 255, 0.78)` | `rgba(18, 21, 28, 0.74)` | Hero cards, modals, primary widgets (`blur(20px)`) |
| **Surface Mid** | `rgba(255, 255, 255, 0.52)` | `rgba(18, 21, 28, 0.52)` | Activity cards, session lists (`blur(16px)`) |
| **Surface Light** | `rgba(255, 255, 255, 0.35)` | `rgba(255, 255, 255, 0.04)` | Nested chips, secondary stats (`blur(10px)`) |
| **Text Primary** | `#181512` (warm near-black) | `#fdfefe` (crisp luminous off-white) | Main headings, primary metric numbers |
| **Text Secondary** | `#544f48` (warm neutral charcoal) | `#a6a9b6` (neutral cool slate) | Subtitles, section descriptions, labels |
| **Text Muted** | `#878177` (soft muted) | `#6c7182` (deep muted) | Timestamps, metadata, placeholders |
| **Sport Ride** | `#f97316` | `#f97316` | Cycling activities |
| **Sport Run** | `#fc4c02` | `#fc4c02` | Running activities |
| **Sport Walk** | `#f59e0b` | `#f59e0b` | Walking & hiking |
| **Sport PR** | `#fb923c` | `#fb923c` | Personal records |
| **Semantic Warning** | `#f59e0b` (Amber) | `#fbbf24` (Amber) | Warning alerts |
| **Semantic Danger** | `#e11d48` (Rose) | `#fb7185` (Rose) | Destructive actions, high HR zones |

### 2.2 Typography System

- **UI & Controls**: Modern geometric sans-serif (`Geist Sans` / `Inter`, system stack) for crisp, legible UI elements.
- **Numbers & Metrics**: Tabular lining figures (`font-variant-numeric: tabular-nums` / `font-mono`) so distances, times, paces, heart rates, elevations, and splits align precisely across tables and cards.
- **Headings**: Modern bold display with high contrast and subtle letter spacing (`tracking-tight`).

---

## 3. UI Component Architecture

Strava Hub enforces strict UI component consistency:

### 3.1 `GlassCard`
- Foundational surface container implementing the 3-layer depth model.
- Depth tiers:
  - `variant="strong"`: Hero metric cards, interactive modals (`blur(20px)`, `border-white/10`, top highlight).
  - `variant="mid"`: Activity cards, transaction/session lists, breakdown blocks (`blur(16px)`).
  - `variant="light"`: Nested chips, secondary stats, mini tiles (`blur(10px)`).
- Features top-edge specular highlight (`inset 0 1px 0 ...`) and soft ambient drop shadows.
- `interactive` prop enables spring hover lift (`whileHover={{ y: -3 }}`) and compression (`whileTap={{ scale: 0.985 }}`).

### 3.2 `Button`
- **Variants**:
  - `primary`: Solid radiant orange gradient (`from-[#fc4c02] to-[#f97316]`) with white text, top specular rim, and subtle orange depth glow.
  - `accent-ghost`: Translucent orange tinted glass with crisp border.
  - `ghost`: Transparent with neutral hover glass effect.
  - `danger`: Soft rose glass for destructive actions.
- **Touch target**: Minimum **44px** height for ergonomic mobile tap accuracy.
- **Active state**: Spring micro-compression (`whileTap={{ scale: 0.98 }}`).

### 3.3 Modal Dialogs & Sheets (`ConfirmModal`)
- Native HTML `alert()` and `confirm()` are strictly forbidden.
- Modals utilize `framer-motion` spring physics:
  - Damping: `30`
  - Stiffness: `320`
- Surface strong container with frosted diffusion backdrop (`backdrop-blur-md`).

### 3.4 Notifications & Feedback
- Copy actions feature immediate inline icon feedback (`CheckCircle2` / "Copied!" state).
- Tactile spring feedback on all button presses and interactive cards.

---

## 4. Mobile Ergonomics & Navigation

- **Mobile (< 768px)**:
  - Fixed bottom glass navigation bar (`.glass-bottom-nav`) with thumb-friendly buttons for Dashboard, Activities, Records, Compare, and Profile.
  - Generous 50px tap target height with thumb-friendly layout.
  - Active indicator with radiant orange glowing pill and specular highlight.
- **Desktop (≥ 768px)**:
  - Fixed left glass sidebar (`.glass-nav`) with Strava Hub branding, ambient orange glow capsule, and active link indicators.
  - Minimum 44px navigation tap targets.
  - Footer with connection status and `ThemeToggle`.
