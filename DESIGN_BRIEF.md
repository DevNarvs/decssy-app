# Decssy — Design Brief

> Paste-friendly companion to PRD.md. Send this to Claude design (or v0, Magic Patterns, Lovable, Bolt, Figma + Claude) at the start of any design session, then add the per-screen prompt below.

---

## 1. The product (one paragraph)

**Decssy** is a mobile-first social calendar web app for friend groups, families, and small teams (3–50 people). Users create a group, share an invite QR/link, and coordinate events together. Two event types: **personal-shared** (broadcast my availability, friends RSVP) and **group-shared** (we're all attending automatically). Core features: RSVP, comments, find-free-day, recurring events, real-time updates, color-coded groups. Built on Next.js 15 + Convex + Clerk + Tailwind + shadcn/ui, deployed to Vercel as an installable PWA.

---

## 2. Design principles

1. **Mobile-first, thumb-friendly** — primary touch zones in bottom 40% of screen. Bottom tabs, bottom sheets for details, FAB for primary action. Anything important within thumb reach.
2. **Calm, not corporate** — this is for friends, not enterprise. Soft surfaces, warm tones, friendly micro-copy ("You're all set!" not "Operation completed"). No loud reds except destructive actions.
3. **Social presence visible** — RSVPs, attendees, avatars, comments — surface who's there and what's happening. Empty calendars are anxious; show recent group activity.
4. **Calendar-first, list-second** — month grid is the home, but agenda is always one tap away. Don't over-rotate on the grid; offer both equally.
5. **Optimistic > correct** — RSVPing should feel instant. Use optimistic UI; reconcile with server in the background.
6. **Quiet motion** — animations confirm action, never demand attention. 150–300ms transitions. No bounce, no parallax, no animated illustrations.

---

## 3. Visual direction (starter — designer can adjust)

**Vibe**: Warm, modern, social — somewhere between **Notion Calendar's clean utility**, **Cron's minimalism**, and **Linear's polish**. Avoid: Outlook density, Google Calendar grid-coldness, social-app loudness, fintech gradients.

**Color tokens**:

| Token | Light | Dark |
|---|---|---|
| `surface-base` | `#FAFAF9` | `#0A0A0A` |
| `surface-raised` | `#FFFFFF` | `#171717` |
| `surface-sunken` | `#F5F5F4` | `#000000` |
| `border-subtle` | `#E7E5E4` | `#262626` |
| `border-strong` | `#D6D3D1` | `#404040` |
| `text-primary` | `#0F172A` | `#F8FAFC` |
| `text-secondary` | `#475569` | `#94A3B8` |
| `text-muted` | `#94A3B8` | `#64748B` |
| `accent-primary` | `#6366F1` (indigo-500) | `#818CF8` |
| `accent-hover` | `#4F46E5` | `#6366F1` |

**Group color palette** (8 colors, distinguishable side-by-side, all hit 4.5:1 contrast on white):

| Color | Hex | Suggested default for |
|---|---|---|
| Emerald | `#10B981` | Family |
| Sky | `#0EA5E9` | Friends |
| Violet | `#8B5CF6` | Hobby |
| Amber | `#F59E0B` | Travel |
| Rose | `#F43F5E` | Date / partner |
| Teal | `#14B8A6` | Sports |
| Fuchsia | `#D946EF` | Project |
| Lime | `#84CC16` | Misc |

**Semantic colors**: success `#10B981` · warning `#F59E0B` · error `#EF4444` · info `#0EA5E9`.

**Typography**:
- Family: **Inter** (or Geist) — sans, variable
- Display weights 600/500, body 400
- Mobile scale: 28 / 22 / 18 / 16 / 14 / 12
- Tablet+ scale: 32 / 26 / 20 / 16 / 14 / 12
- Line height: 1.5 for body, 1.2 for headings
- Mono: JetBrains Mono only for invite tokens / codes

**Iconography**: **Lucide** — outline 1.5px stroke, 24px default (16px in dense lists, 20px in form labels).

**Spacing scale** (4px base): `4 8 12 16 20 24 32 40 48 64 80 96`.

**Border radius**:
- 8px — buttons, inputs, chips
- 12px — cards, list items
- 16px — bottom sheets, modals
- 9999px — avatars, pills, status badges

**Shadows**:
- `shadow-sm` — cards on raised surface (`0 1px 2px rgba(0,0,0,0.05)`)
- `shadow-md` — bottom sheets (`0 4px 16px rgba(0,0,0,0.08)`)
- `shadow-lg` — modals, popovers (`0 10px 32px rgba(0,0,0,0.12)`)

**Motion**:
- Hover/state: 150ms ease-out
- Layout shifts: 250ms ease-in-out
- Bottom sheets / drawers: 300ms cubic-bezier(0.32, 0.72, 0, 1) (iOS spring)
- RSVP count change: scale pop (1.0 → 1.12 → 1.0) over 200ms
- Never animate the calendar grid itself

---

## 4. Responsive breakpoints

| Range | Layout |
|---|---|
| 320–767 px (mobile) | Bottom-tab nav (4 tabs, 56px tall), full-width screens, bottom sheets for details |
| 768–1023 px (tablet) | Sidebar nav (icon + label, 240px), two-pane layouts where useful, sheets become side drawers |
| 1024 px+ (desktop) | Sidebar + persistent agenda panel; multi-pane layouts; modals instead of sheets |

**Critical**: design mobile-first, then *enhance* for larger screens. Don't design desktop and shrink.

---

## 5. Component primitives needed (shadcn/ui basis)

- `Button` (primary, secondary, ghost, destructive — 3 sizes)
- `Input`, `Textarea`, `Label`, `Select`, `Switch`, `Checkbox`, `RadioGroup`, `SegmentedControl`
- `Card`
- `Sheet` (bottom on mobile, right-side on tablet+)
- `Dialog` (centered modals — used sparingly)
- `Popover`, `Tooltip`
- `Tabs`, `BottomTabBar` (custom)
- `Avatar` (with color ring for group association)
- `Badge` (status pills with icon)
- `Calendar` (month grid — custom, on react-day-picker)
- `Toast` (bottom on mobile, top-right on desktop)
- `EmptyState` (illustration + message + CTA)
- `Skeleton` (for loading)
- `ColorDot`, `ColorPicker` (group colors)
- `QRCode` (display only — generated server-side)
- `EventChip` (event preview in agenda/grid)
- `RsvpControl` (segmented: Going / Maybe / Can't go)

---

## 6. State coverage required

For **every** screen, design these states:

| State | When | Visual |
|---|---|---|
| Empty | First-time, no data | Illustration + headline + supporting text + primary CTA |
| Loading | Initial fetch | Skeleton screens (not spinners) — match real layout |
| Populated | Normal use | Realistic content, varied (not all "Lorem ipsum") |
| Error | Network/permission failure | Inline error card with retry; full-screen for fatal |
| Offline | PWA cache mode | Read-only banner at top + cached content visible |

---

## 7. Accessibility checklist

- All interactive targets ≥ 44×44 px
- Color is never the sole signal (RSVP badges have icon + text + color)
- Group colors meet **WCAG AA 4.5:1** on white and dark surfaces
- Visible focus rings (2px accent + 2px white offset)
- Logical tab order; no `tabindex` > 0
- All images have alt text; all icons have `aria-label` or are aria-hidden
- Bottom sheets / modals trap focus and close on Esc
- Live regions (`aria-live="polite"`) announce RSVP / comment updates
- All copy is at 6th-grade reading level or simpler
- Dark mode is fully supported (`dark:` variants on every component)

---

## 8. The 15 screens (paste the PRD wireframe for each as needed)

| # | Screen | Tab | Purpose |
|---|---|---|---|
| 1 | Sign up / sign in | (auth) | Clerk-rendered, themed to brand |
| 2 | Onboarding (3-step) | (auth) | Timezone → avatar color → create or join |
| 3 | **Calendar (home)** | 📅 | Month grid + agenda below; FAB; group filter |
| 4 | **Event detail (sheet)** | 📅 | RSVP, attendees, comments thread |
| 5 | **Event create/edit** | 📅 | Type, title, time, recurrence, group |
| 6 | Group list | 👥 | Card list with color, name, member count, next event |
| 7 | **Group detail** | 👥 | Hero, members, history, danger zone |
| 8 | **Invite QR/link** | 👥 | Big QR + copy link + native share |
| 9 | Group create | 👥 | Name, desc, color picker grid |
| 10 | Member detail (sheet) | 👥 | Per-member info + owner actions |
| 11 | **Find Free Day** | 🔍 | Inputs + ranked results list |
| 12 | Notifications inbox | 🔔 | Grouped feed (Today / Yesterday / Earlier) |
| 13 | Profile | (avatar) | Avatar, name, timezone |
| 14 | Settings | (avatar) | Notification toggles, sign out |
| 15 | **Invite landing** (public) | — | Group preview + sign-in CTA |

**Bolded** = highest-impact screens — design these first.

For each screen, see PRD.md section 9.x for layout wireframes and section 5 for user stories.

---

## 9. Prompt templates

### 9.1 Per-screen prompt (the one you'll use most)

```
I'm designing the [SCREEN NAME] screen for Decssy, a mobile-first social
calendar for friend groups.

PRODUCT CONTEXT:
[Paste section 1 of this brief]

VISUAL DIRECTION:
[Paste section 3 of this brief — colors, typography, spacing, motion]

THIS SCREEN'S PURPOSE:
[1–2 sentences from section 8 + screen-specific detail from PRD §9.x]

LAYOUT (text wireframe):
[Paste the wireframe from PRD §9.x]

REQUIRED STATES:
- Empty (no events / no members / no notifications — pick relevant ones)
- Loading (skeleton)
- Populated (with realistic varied content)
- Error (network failure)

RESPONSIVE:
Show me mobile (375px wide) and tablet (768px wide) layouts side-by-side.

COMPONENTS TO USE:
[List of components from section 5 that apply]

DELIVERABLE:
A clean Tailwind + shadcn/ui implementation with light + dark mode.
Use the color tokens from the brief (don't substitute random hex codes).
```

### 9.2 Whole-product prompt (one-shot, results vary)

```
I'm building Decssy, a mobile-first social calendar web app.
Here is the full design brief: [PASTE THIS ENTIRE DESIGN_BRIEF.md]

Generate the home Calendar screen (mobile + tablet) first, in Tailwind +
shadcn/ui. Stay within the visual direction. After I approve, we'll move
to subsequent screens.
```

### 9.3 System-review prompt (run after all screens are designed)

```
I've designed all 15 screens of Decssy [paste links/exports]. Review for:
1. Visual consistency (do colors, type, spacing match across screens?)
2. Component reuse (is the same control used the same way everywhere?)
3. Accessibility issues
4. State coverage (any screens missing empty/loading/error?)
5. Responsive coherence (do mobile/tablet variants tell the same story?)

List the top 10 inconsistencies to fix.
```

---

## 10. What to deliver back from design

For each screen, your design output should produce:

1. **Mobile mockup** (375px) — populated state
2. **Tablet mockup** (768px) — populated state
3. **State variations** — empty, loading, error
4. **Component spec** — which shadcn/ui or custom components, with props
5. **Tailwind classes** — copy-pasteable, using the color tokens from §3
6. **Interaction notes** — what taps/swipes do, transition timing

---

## 11. Brand assets you'll eventually need

- App logo (wordmark + icon, square + horizontal lockups)
- Favicon (32×32, 16×16, SVG)
- PWA icons (192×192, 512×512, maskable)
- OG / social share image (1200×630 — template with QR + group preview)
- Empty-state illustrations (3–5; e.g., empty calendar, no groups, no notifications)
- Error illustrations (offline, not found)

If you don't have a designer, **shadcn/ui + Lucide + a single accent color** gets you ~80% of the way without custom assets.

---

## 12. Anti-patterns to avoid in generated designs

These are the failure modes generative tools default to. Watch for and reject:

- ❌ Heavy purple-blue gradients ("AI design fingerprint")
- ❌ Card-on-card-on-card stacking (unnecessary depth)
- ❌ Generic stock-photo hero blocks at the top of every screen
- ❌ Sidebars on mobile (use bottom tabs)
- ❌ Icons without text labels in primary navigation
- ❌ Light gray text on white (fails contrast)
- ❌ Animated emojis or excessive sparkle/star icons
- ❌ Centered alignment of left-reading content
- ❌ Auto-suggested forms with 12 unnecessary fields ("phone number", "company")
- ❌ Pricing tables, testimonials, "Trusted by" logos — this isn't a marketing site

---

## 13. The unfair advantage

The single best thing you can do for design quality: **show the AI 2–3 reference screenshots** of apps you like (Notion Calendar, Cron, Linear, Apple Calendar, Things 3) alongside this brief. Generative tools imitate vastly better than they invent. "Make it feel like this Cron screenshot but for our use case" beats any abstract style description.

---

*Last updated: 2026-05-07. See PRD.md for full product spec.*
