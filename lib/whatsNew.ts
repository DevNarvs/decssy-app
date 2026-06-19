/**
 * Curated, user-facing "What's new" highlights per version.
 *
 * This is deliberately separate from CHANGELOG.md: the changelog is the full
 * technical record; this is the friendly highlight reel shown in-app the first
 * time a user opens a new version. Only add an entry for versions worth
 * announcing — versions with no entry simply don't show a "What's new".
 */
export interface WhatsNewEntry {
  version: string;
  title: string;
  highlights: { emoji: string; text: string }[];
}

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: "1.0.0",
    title: "Welcome to Decssy 1.0",
    highlights: [
      { emoji: "⏰", text: "Event reminders — a heads-up the day before and an hour before." },
      { emoji: "📍", text: "Add a location to events, with a tap-to-open Maps link." },
      { emoji: "📅", text: "Save any event straight to your Google or Apple Calendar." },
      { emoji: "🙋", text: "Share a personal event so a friend can RSVP — no group to join." },
      { emoji: "🔔", text: "Turn on push notifications in Settings." },
      { emoji: "🔕", text: "Mute a noisy group's notifications anytime." },
      { emoji: "🔑", text: "Forgot your password? You can reset it now." },
    ],
  },
];

export function whatsNewFor(version: string): WhatsNewEntry | undefined {
  return WHATS_NEW.find((e) => e.version === version);
}
