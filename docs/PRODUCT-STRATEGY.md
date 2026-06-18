# Decssy — Product Strategy (research-backed)

> Synthesized from a multi-source, adversarially-verified web research pass (2026-05-13).
> 28 sources fetched → 134 claims extracted → 25 verified by 3-vote → 21 confirmed, 4 killed.
> Scope: how to make Decssy more compelling, sticky, and useful as a solo-built indie PWA.

## TL;DR

Solo-utility-first → saturate one friend group → let each shared event pull in
non-users. Decssy has already built the hardest parts of that playbook (no invite
gate, per-event sharing). The work now is **retention polish + a viral on-ramp**,
not new pillars.

The single highest retention-per-effort move: **curate notifications** (digest +
per-group mute). Notification overload is the #1 complaint across the entire
category; ease-of-use is the #1 thing users praise.

## What the research validates about what's already built

| Feature | Verified finding |
|---|---|
| **"Just me" personal calendar** | The cold-start solution. Winning social products deliver standalone value *before* network effects (Andrew Chen). Howbout's "invite 3 friends before you can use the app" wall is the canonical anti-pattern — traps users, 1-star reviews, deletions. Decssy has **no invite gate**. Keep it. |
| **Per-event sharing, RSVP without joining** | The viral loop. Virality and network effects are *separate playbooks* — build both (NFX). Partiful added ~2M users in months because every event pulls non-users in. Decssy's `/e/<token>` flow is this engine. |
| **Find-free-time + RSVP** | Fast one-touch RSVP / availability coordination is the #1 *praised* capability across Spond, Partiful, Howbout reviews. |

## Quick wins (high retention per unit of effort)

1. **Notification digest + per-group mute** — addresses the #1 category complaint
   (overload). Bundle related notifications, daily-digest option, per-group mute,
   bulk accept/decline. *(Building this first.)*
2. **iOS install coaching + Web Push** — iOS gives no auto install prompt (Share
   Sheet → Add to Home Screen); push needs iOS 16.4+ after home-screen install +
   explicit permission tap (Apple WebKit). Coach iOS Safari users; ask for push at
   a meaningful moment (first RSVP), not first load.
3. **One-tap RSVP everywhere** — from the notification, the calendar cell, the
   share link. No extra screens.
4. **Instrument DAU/MAU + invite funnel** — a16z: track DAU/MAU (33% ≈ opens 10 of
   30 days) + frequency/depth, not one vanity number. Track invite→open→signup→
   RSVP→return.
5. **Make the solo/empty state a feature** — personal reminders so a "Just me" user
   has a reason to return before any friend joins.

## Bigger bets (sequence after quick wins)

| Bet | Why | Notes |
|---|---|---|
| **Date polls — "when works for everyone?"** | Merges find-free-time with a Doodle/When2meet poll; the killer recurring-coordination loop. | Highest retention-per-effort of the big bets; availability data already exists. |
| **Per-event comments → coordination thread** | TimeTree's moat = switching costs from shared data + chat-inside-events (discuss without leaving for WhatsApp). | Builds the "group chat companion" wedge. Add photos, @mentions, pinned details. |
| **Calendar import (Google/Apple/ICS, one-way)** | Lowers "another calendar" friction; sees real conflicts. | Start read-only ICS import. NOTE: OS-sync as a churn driver was **refuted** — don't over-invest in two-way sync. |
| **Recurring hangouts** | "Every other Friday" = habit loop; turns one-event apps sticky. | RRULE expansion already exists — mostly UX. |

## Monetization (when there's an active base — not yet)

Proven indie pattern (TimeTree, 55–70M users): **keep the core calendar free;
charge to remove ads + layer conveniences.**

- Price **~$4.49/mo or ~$44.99/yr** (TimeTree's actual numbers).
- **Favor annual billing** — RevenueCat 2025: yearly retains **44% vs 17%** at Year 1
  (partly self-selection; direction is real).
- **Avoid the $5–10/mo mid-tier** — pricing polarizes toward cheap-or-premium.
- Lead premium with **"no ads"** + conveniences (extra groups, richer
  notifications, attachments, themes).
- ⚠️ Don't model a fixed conversion rate — the "~2% freemium" rule of thumb
  **failed verification**. Measure your own funnel.

## What NOT to do (failed verification — do not build a roadmap on these)

- ❌ "OS calendar sync is the #1 churn driver" — **refuted 0-3.**
- ❌ "~2% freemium conversion" benchmark — **refuted 1-2.**
- ❌ "Partiful has 60%+ weekly-active" — **refuted 0-3.** (The +2M signups held; the
  engagement stat didn't.)
- ❌ "In-event chat is TimeTree's single core advantage" — **refuted 1-2** (it's *a*
  driver, alongside switching costs — not the sole one).

## Metrics to watch

- **DAU/MAU** (headline stickiness ratio).
- Engagement decomposed: **frequency** (sessions/DAU), **depth** (time/session),
  **aggregate attention** (total time/user) — not a single number.
- **Invite funnel**: invite sent → opened → signed up → RSVP'd → returned D1/D7/D30.

## Open questions (answer with your own data)

1. Which solo hook converts a "Just me" user into a group creator? (Solo-first is
   validated; the specific trigger isn't — A/B test it.)
2. Right notification cadence (digest timing, smart bundling) that cuts overload
   without dulling the RSVP loop.
3. When (if ever) to add a native wrapper — stay pure-PWA until iOS push
   reliability or App Store discoverability actually blocks growth.

## Sources (quality-rated)

**Primary / authoritative**
- a16z — measuring social-app stickiness & engagement: https://a16z.com/the-stickiest-most-addictive-most-engaging-and-fastest-growing-social-apps-and-how-to-measure-them/
- Apple WebKit — Web Push for home-screen web apps (iOS 16.4): https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- MDN — making PWAs installable (no beforeinstallprompt on iOS): https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- RevenueCat — State of Subscription Apps 2025: https://www.revenuecat.com/state-of-subscription-apps-2025/
- RevenueCat — 2025 App Monetization Trends: https://www.revenuecat.com/blog/growth/2025-app-monetization-trends/
- TimeTree Premium (pricing & free-vs-premium): https://support.timetreeapp.com/hc/en-us/articles/4647239978905-What-is-TimeTree-Premium
- Howbout App Store reviews (invite-gate complaints): https://apps.apple.com/us/app/howbout-shared-calendar/id1477248221?see-all=reviews

**Authority blogs / frameworks**
- Andrew Chen — solving the cold-start problem: https://andrewchen.com/how-to-solve-the-cold-start-problem-for-social-products/
- Andrew Chen — more retention → more viral growth: https://andrewchen.com/more-retention-more-viral-growth/
- NFX — Network Effects Manual: https://www.nfx.com/post/network-effects-manual
- CNBC — Partiful growth (Apr 2025): https://www.cnbc.com/2025/04/19/meet-partiful-the-gen-z-party-planning-staple-thats-taking-on-apple.html

**Secondary / review aggregators (corroborated)**
- Spond reviews — Capterra: https://www.capterra.com/p/181253/Spond/reviews/ · G2: https://www.g2.com/products/spond/reviews
- TimeTree review (OurCal): https://ourcal.com/blog/timetree-app-review
- PWA on iOS (Brainhub): https://brainhub.eu/library/pwa-on-ios

## Caveats

- Several growth/monetization figures are 2025 snapshots that age (Partiful "+2M
  since January" is CEO-reported gross signups; RevenueCat benchmarks shift YoY).
- Annual-vs-monthly retention gap is partly selection bias (annual subscribers
  self-select as higher-intent) — direction holds, magnitude overstated.
- Spond is sports-team-focused (recurring mandatory attendance); its findings map
  to friend groups by analogy, corroborated by Partiful/Howbout.
- "Personal-utility lock-in" (NFX) maps weakly onto a shared calendar — treat as an
  aspirational design target, not a current property.
