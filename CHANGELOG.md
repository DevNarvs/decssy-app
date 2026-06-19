# Changelog

All notable changes to Decssy are recorded here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project follows
[Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- **MAJOR** — incompatible / breaking changes to the product model.
- **MINOR** — new features, backward-compatible.
- **PATCH** — bug fixes and small tweaks.

The version shown in the app (Settings → footer) is this `version` from
`package.json`, alongside the precise build id (git short SHA).

## How to cut a release

1. Update this file: move the relevant notes from `[Unreleased]` into a new
   dated version section.
2. Bump `version` in `package.json` (MAJOR/MINOR/PATCH as appropriate).
3. Commit (`chore(release): vX.Y.Z`) and tag it: `git tag vX.Y.Z && git push --tags`.
4. Push — Vercel rebuilds; the in-app version updates and existing installs get
   the "Update available" banner.

## [Unreleased]

_Nothing yet._

## [1.0.0] — 2026-05-13

First stable release. A mobile-first shared calendar PWA for friend groups,
families, and small teams (Next.js + Convex + Convex Auth, deployed on Vercel).

### Accounts & onboarding
- Sign in with Google or email/password (Convex Auth).
- **Password reset** via emailed one-time code (`/forgot-password`), enumeration-safe.
- 3-step onboarding (name, timezone, first group or invite).
- **Account deletion** (Settings) — full data cascade; groups you own with other
  members are transferred to the longest-standing member rather than destroyed.

### Groups
- Create groups, share via QR code or link, manage members.
- Owner roles + **transfer ownership**.
- **Per-group notification mute** (Settings → group) silences its notifications
  and emails.

### Personal schedule
- A private **"Just me"** calendar that works solo — no group required, no invite
  gate. Kept out of the social groups list.

### Events
- Create/edit/cancel events; all-day and timed; **recurring** (RRULE).
- Personal vs group event types, **RSVP** (going / maybe / can't), and comments.
- **Location** field with an "open in Maps" link.
- **Add to calendar** — download an `.ics` for Google/Apple/Outlook.
- **Share a personal event** to a non-member who can RSVP without joining the
  group (the event lands on their calendar with your attribution).

### Calendar & coordination
- Color-coded month calendar + day agenda; group filter chips.
- **Find a free day** across a group's members.

### Notifications
- In-app inbox + email (Resend, env-gated) for invites, updates, cancellations,
  comments, joins, ownership changes.
- **Event reminders** — "starts tomorrow" (24h) and "starts in 1 hour" (1h).
- **Web Push** opt-in (iOS 16.4+ once installed to the home screen, Android,
  desktop).
- Inbox **bundles** repeated comments on the same event into one row.

### PWA & versioning
- Installable PWA (manifest, service worker, icons, OG image).
- App **version** shown in Settings; **"Update available" banner** detects new
  deploys and offers a one-tap refresh.
- **"What's new"** screen highlights each version's features once after an
  update (curated highlights, separate from this changelog).

[Unreleased]: https://github.com/DevNarvs/decssy-app/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/DevNarvs/decssy-app/releases/tag/v1.0.0
