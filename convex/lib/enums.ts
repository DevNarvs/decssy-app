/**
 * Single source of truth for semantic enums + their display metadata.
 * Used by both server (Convex validators) and client (UI labels/icons/colors).
 *
 * PRD §7.13 — the values are tightly coupled to code logic, so they live
 * here in TypeScript (compile-time exhaustiveness) rather than a master
 * table (runtime config that would require DB lookups).
 */

export const EVENT_TYPES = {
  personal_shared: {
    label: "Personal",
    description: "Broadcast your availability — friends RSVP",
    icon: "user",
  },
  group_shared: {
    label: "Group event",
    description: "We're all attending — auto-attended",
    icon: "users",
  },
} as const;
export type EventType = keyof typeof EVENT_TYPES;

export const RSVP_STATUSES = {
  invited:   { label: "No response yet", color: "#9CA3AF" },
  attending: { label: "Going",            color: "#3aab6e" },
  maybe:     { label: "Maybe",            color: "#e8a530" },
  declined:  { label: "Can't go",         color: "#e04f4f" },
} as const;
export type RsvpStatus = keyof typeof RSVP_STATUSES;
