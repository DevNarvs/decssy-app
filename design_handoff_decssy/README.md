# Handoff: Decssy — Mobile Calendar App

**Date:** 2026-05-07  
**Designer:** Marvin Donina (marvin.donina@cvmfinance.com)  
**Fidelity:** High-fidelity  
**Stack target:** Next.js 15 + Convex + Tailwind + shadcn/ui (per PRD)

---

## Overview

Decssy is a mobile-first social calendar web app for small friend groups, families, and small teams. Users create groups, share invite links/QR codes, and coordinate events together.

The designs in this bundle are **HTML prototypes** — high-fidelity interactive mockups showing intended look, layout, and behavior. Your task is to **recreate these designs in the existing Next.js + Tailwind + shadcn/ui codebase**, using its established patterns and libraries. Do not ship the HTML files directly.

---

## Design Files in This Bundle

| File | Description |
|---|---|
| `Decssy Full.html` | Full interactive prototype — all screens, tab navigation, bottom sheets, flows |
| `Decssy Prototype.html` | Two-variant comparison canvas (Variant A: dark, Variant B: warm/light) |
| `decssy-full.jsx` | React component source for the full prototype |
| `decssy-data.jsx` | Shared mock data (groups, events, notifications) |
| `decssy-variant-a.jsx` | Variant A (Obsidian) component source |
| `decssy-variant-b.jsx` | Variant B (Peach Fuzz) component source |

Open `Decssy Full.html` in a browser to interact with the full prototype. All screens are navigable.

---

## Chosen Design Direction

**"Peach Fuzz"** — warm, soft, rounded.

- **Font:** Plus Jakarta Sans (weights 500–900)
- **Accent:** `#e8519a` (pink) — configurable
- **Background:** `#fdf7f2` (warm off-white)
- **Surface:** `#ffffff`
- **Surface 2:** `#f5ece4`
- **Border:** `#ecddd3`
- **Text:** `#2c1f17`
- **Text muted:** `#9a7b6a`
- **Positive (Going):** `#3aab6e`
- **Maybe:** `#e8a530`
- **Negative (Can't go):** `#e04f4f`
- **Shadow sm:** `0 2px 16px rgba(44,31,23,0.08)`
- **Shadow md:** `0 4px 24px rgba(44,31,23,0.12)`

---

## Design Tokens

```ts
// tokens.ts
export const tokens = {
  colors: {
    bg:        "#fdf7f2",
    surface:   "#ffffff",
    surface2:  "#f5ece4",
    border:    "#ecddd3",
    text:      "#2c1f17",
    textMuted: "#9a7b6a",
    accent:    "#e8519a",   // configurable per user preference
    positive:  "#3aab6e",
    maybe:     "#e8a530",
    negative:  "#e04f4f",
  },
  radius: {
    sm:  "10px",
    md:  "14px",
    lg:  "20px",
    xl:  "24px",
    pill:"9999px",
  },
  shadow: {
    sm: "0 2px 16px rgba(44,31,23,0.08)",
    md: "0 4px 24px rgba(44,31,23,0.12)",
  },
  font: {
    family: "'Plus Jakarta Sans', sans-serif",
    sizes: {
      xs:   "11px",
      sm:   "12px",
      base: "13px",
      md:   "14px",
      lg:   "15px",
      xl:   "17px",
      "2xl":"20px",
      "3xl":"24px",
    },
    weights: {
      normal:    500,
      semibold:  600,
      bold:      700,
      extrabold: 800,
      black:     900,
    },
  },
};
```

---

## Navigation

Bottom tab bar (mobile) / Left sidebar (≥768px):

| Tab | Icon | Route |
|---|---|---|
| Calendar | 📅 | `/calendar` |
| Groups | 👥 | `/groups` |
| Find | 🔍 | `/find` |
| Inbox | 🔔 | `/inbox` |

**Bottom nav specs:**
- Height: `64px` + safe area inset
- Background: `#ffffff`
- Top border: `1.5px solid #ecddd3`
- Shadow: `0 -4px 20px rgba(44,31,23,0.06)`
- Active tab: icon in `44×36px` pill with `${accent}18` background
- Active label: accent color, 10px, weight 800
- Inactive: `#9a7b6a`
- Unread badge: 16px circle, accent background, white text 9px

---

## Screens

### 1. Calendar (Home)

**Route:** `/calendar`

**Layout:**
- Fixed header (64px top padding for status bar): app title left, avatar right
- Filter chips row: horizontally scrollable, 18px horizontal padding, 12px bottom padding
- Month nav: prev/next chevron buttons (34×34px circles), month+year centered
- Calendar grid: 7-column CSS grid, inside a white card (border-radius 24px, 12px horizontal margin)
- Upcoming section: vertical list of event cards, 10px gap, 12px horizontal padding
- FAB: 52×52px circle, accent background, bottom-right, 88px from bottom, 16px from right

**Filter chips:**
- `5px 12px` padding, `border-radius: 9999px`
- Border: `1.5px solid` group color (active) or `#ecddd3` (inactive)
- Background: `${groupColor}18` (active) or `#ffffff` (inactive)
- Font: 12px weight 700

**Calendar grid cell:**
- Today: 30×30px circle, accent background, white text, weight 900
- Normal: transparent background, `#2c1f17`
- Event dots: 5px circles in group colors, below the date number, max 3 per cell

**Event card (upcoming list):**
- White card, 20px border-radius, `1.5px solid #ecddd3` border, shadow sm
- Left: 4px colored bar (group color), border-radius 999px
- Title: 14px weight 800 `#2c1f17`
- Subtitle: 12px `#9a7b6a`
- Right: group color dot + group name 11px
- Hover: `translateY(-1px)`, shadow md

---

### 2. Event Detail (Bottom Sheet)

**Trigger:** Tap any event card

**Layout:**
- Overlay: `rgba(44,31,23,0.35)` full-screen backdrop, tap to dismiss
- Sheet: slides up from bottom, `border-radius: 28px 28px 0 0`
- Drag handle: 40×5px, `#ecddd3`, centered, 14px top padding
- Max height: 88% of screen
- Padding: `0 20px 100px`

**Sections:**
1. **Color bar** — 5px tall, group color, border-radius 999, 85% opacity
2. **Header** — title (22px weight 900), date/time (13px muted), group + author (13px muted with dot)
3. **Description** — 13px, inside a surface card with border
4. **RSVP** (personal_shared events only) — 3 buttons in a row: Going / Maybe / Can't go
   - Active: `2px solid` status color, `${statusColor}18` background, status color text
   - Inactive: `2px solid #ecddd3`, white background, muted text
5. **Attendees** — white card, avatar (32px circle with group color tint), name, status dot + label
6. **Comments** — white card, avatar + author name + time + body; comment input at bottom
7. **Creator actions** — Edit (accent outline) + Cancel event (negative outline), only for event creator

**RSVP colors:**
- Going: `#3aab6e`
- Maybe: `#e8a530`
- Can't go: `#e04f4f`

---

### 3. Event Create / Edit

**Route:** `/events/new` or `/events/[id]/edit`

**Layout:** Full-screen, scrollable form

**Header:** Back button (36×36px circle) + "New event" title + "Save" button (accent pill)

**Form sections (white cards, 20px border-radius):**
1. **Type** — segmented: Personal / Group event
   - Personal: user owns it, friends RSVP
   - Group event: all members auto-attend
2. **Title** — text input, 15px weight 600
3. **Group** — radio list with colored group icons, checkmark on selected
4. **All day** — toggle switch (46×26px pill)
5. **Start / End** — date + time pickers (when not all-day)
6. **Repeats** — select: Doesn't repeat / Every day / Every week / Every month / Every year
7. **Description** — textarea, 3 rows

**Save button:** Full-width, accent background, `border-radius: 16px`, 14px weight 800, shadow `0 6px 20px ${accent}32`

---

### 4. Group List

**Route:** `/groups`

**Layout:**
- Header: "Groups." title + "+ New" button (accent, border-radius 14px)
- Cards: vertical list, 10px gap, 12px horizontal padding

**Group card:**
- 48×48px group icon (border-radius 16px, group color tint bg, first letter)
- Name: 15px weight 800
- Member count: 12px muted
- Next event: 11px accent, weight 700
- Chevron: 18px muted right

---

### 5. Group Detail

**Route:** `/groups/[id]`

**Sections:**
1. **Group hero card** — icon + name + description + member count + "Invite people" CTA button
2. **Members list** — avatar + name + "owner" badge (accent pill) + join date
3. **History** (collapsible) — audit log entries with dot timeline
4. **Danger zone** — Transfer ownership (muted outline) + Delete group (negative outline)

---

### 6. Invite QR / Link Share

**Route:** `/groups/[id]/invite`

**Layout:**
- QR code in white card (centered, 160×160px)
- Invite link row: text + "Copy" button (accent)
- "Share via…" full-width button (accent)
- Expiry info (centered, muted)
- "Revoke this invite" (negative outline)

**QR generation:** Use the `qrcode` npm package server-side in a Convex action. Returns SVG. URL pattern: `decssy.app/join/{token}`

---

### 7. Group Create

**Route:** `/groups/new`

**Form:**
- Group icon preview (72×72px, border-radius 22px)
- Name input (required)
- Description input (optional)
- Color picker: 8 swatches in a flex-wrap grid (36×36px each, border-radius 10px)
  - Colors: `#10B981`, `#6366F1`, `#F59E0B`, `#EF4444`, `#EC4899`, `#06B6D4`, `#8B5CF6`, `#84CC16`
  - Selected: 3px solid `#2c1f17` border

---

### 8. Find Free Day

**Route:** `/find`

**Form (inside a white card):**
- Group selector
- Date range: start → end (two date inputs)
- Duration: select (All day / 1hr / 2hr / 3hr / 4hr)
- Time of day: checkboxes (Morning 8am–12pm / Afternoon 12–5pm / Evening 5–10pm)
- Include people: member avatar chips with count

**Results:**
- Each slot: date (15px weight 800) + time range (13px muted) + "All free" badge (accent soft)
- "Create event from slot →" ghost button (accent outline)
- Partial slots: show "X of Y free · [name] busy" in muted text

---

### 9. Notifications Inbox

**Route:** `/inbox`

**Layout:**
- Header: "Inbox." + "Mark all read" (accent soft pill)
- Sections: "Today" (unread) and "Earlier" (read)
- Notification card: icon (36×36px, accent soft bg) + text + group dot + time
- Unread: accent border, `${accent}06` background, accent dot indicator
- Read: standard border, white background
- Empty state: 🎉 emoji + "All caught up!" message

**Notification types & icons:**
- `rsvp` → ✓
- `comment` → 💬
- `join` → 👋
- `update` → ✏️
- `event` → 📅

---

### 10. Onboarding (3 steps)

**Step 0 — Welcome:**
- 🗓️ emoji (64px)
- "Welcome to Decssy." headline (32px weight 900)
- Tagline (16px muted, max-width 280px)
- "Get started →" CTA

**Step 1 — Profile:**
- Avatar preview (80×80px, border-radius 24px, dashed accent border)
- Display name input
- Timezone (auto-detected, confirmable)
- Progress dots: 3 dots, active = accent + 20px wide, inactive = 6px circle

**Step 2 — Create or join:**
- Two choice cards: "Create a group" + "I have an invite link"
- Each: emoji + title (16px weight 800) + description (13px muted)

---

### 11. Invite Landing (Public)

**Route:** `/join/[token]` — server-rendered, no auth required

**Layout:**
- App name + tagline
- "You've been invited to" label
- Group card: icon + name + member count + creator name + avatar stack (first 5 members)
- "Sign in to join the group" CTA
- "New to Decssy?" copy
- Expiry countdown

**OG meta tags** (server-rendered for iMessage/WhatsApp previews):
```html
<meta property="og:title" content="Join [Group Name] on Decssy" />
<meta property="og:description" content="[N] members · Created by [Owner]" />
<meta property="og:image" content="/api/og/invite/[token]" />
```

---

## Interactions & Behavior

### Bottom Sheet
- Slides up from bottom on event tap
- Backdrop click dismisses
- Drag handle for visual affordance
- Max height 88% of viewport
- `overflow-y: auto` inside sheet

### Tab Navigation
- Bottom tab bar fixed to bottom with safe area padding
- Active tab has pill background highlight
- Inbox badge shows unread count

### RSVP Buttons
- Three-way toggle: Going / Maybe / Can't go
- Active state: colored border + tinted background
- Transition: `all 0.18s`

### Event Cards
- `translateY(-1px)` on hover, shadow increases
- Transition: `transform 0.15s, box-shadow 0.15s`

### Filter Chips (Calendar)
- Horizontally scrollable row
- Toggle active/inactive on tap
- Active: group color border + tinted background

### Find Free Day
- "Find times" button shows loading state ("Finding times…")
- Results appear below after 800ms (simulate API call)
- "Create event from slot →" pre-fills event create form

### Toggles
- 46×26px pill, accent when on, `#ecddd3` when off
- Inner circle 20×20px, slides with CSS transition `left 0.2s`

---

## Component Mapping (shadcn/ui)

| Design Component | shadcn/ui Primitive |
|---|---|
| Bottom sheet | `Sheet` (side="bottom") |
| Group filter chips | Custom — `Button` variant |
| RSVP buttons | `ToggleGroup` |
| Event cards | `Card` |
| Form inputs | `Input`, `Textarea`, `Select` |
| Toggles | `Switch` |
| Avatar | `Avatar` |
| Notifications | Custom list |
| Color picker | Custom swatches |
| QR display | `qrcode` npm → SVG |

---

## State Management Notes

- **Convex reactive queries** — no Redux/Zustand needed for server state
- **React Hook Form + Zod** for event create/edit form
- **Local state** for UI-only: active tab, open sheet, active filter chip, RSVP selection
- **Optimistic updates** for RSVP changes (update local state immediately, then sync)

---

## Group Color Palette

```ts
export const GROUP_COLORS = [
  "#10B981", // emerald
  "#6366F1", // indigo
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#8B5CF6", // violet
  "#84CC16", // lime
];
```

---

## Assets

- No image assets in this design (uses initials-based avatars)
- QR codes generated server-side via `qrcode` npm package
- Font: Plus Jakarta Sans via Google Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet"/>
```

---

## Files

```
design_handoff_decssy/
  README.md              ← This file
  Decssy Full.html       ← Full interactive prototype (open in browser)
  Decssy Prototype.html  ← Two-variant comparison canvas
  decssy-full.jsx        ← React source for full prototype
  decssy-data.jsx        ← Mock data
  decssy-variant-a.jsx   ← Obsidian (dark) variant source
  decssy-variant-b.jsx   ← Peach Fuzz (warm) variant source
```

---

## Questions for Implementation

1. **Accent color** — is `#e8519a` (pink) the locked brand color, or should it be user-configurable per account?
2. **Group color palette** — confirm the 8 preset colors above, or expand?
3. **Font** — Plus Jakarta Sans confirmed, or swap back to Nunito?
4. **Safe area** — implement via `env(safe-area-inset-bottom)` for PWA home screen install
5. **Tablet breakpoint** — bottom tabs → left sidebar at `≥768px` (see PRD §8.2)
