/**
 * Event queries and mutations.
 *
 * Key contract: group_shared events auto-attend every current member;
 * personal_shared events invite all members but mark only the creator
 * as "attending" — others see "invited" and must RSVP.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireMember, requireUser } from "./lib/permissions";
import { expandOccurrences } from "./lib/recurrence";
import { createNotification } from "./notifications";

const TITLE_MIN = 1;
const TITLE_MAX = 100;
const DESCRIPTION_MAX = 2000;
const TZ_PATTERN = /^[A-Za-z]+\/[A-Za-z_\/+\-0-9]+$|^UTC$/; // permissive IANA check

function validate(args: {
  title: string;
  description?: string;
  startUtc: number;
  endUtc: number;
  eventTimezone: string;
}) {
  const trimmed = args.title.trim();
  if (trimmed.length < TITLE_MIN || trimmed.length > TITLE_MAX) {
    throw new Error(`Title must be ${TITLE_MIN}–${TITLE_MAX} characters`);
  }
  if (
    args.description !== undefined &&
    args.description.length > DESCRIPTION_MAX
  ) {
    throw new Error(`Description max ${DESCRIPTION_MAX} characters`);
  }
  if (args.endUtc < args.startUtc) {
    throw new Error("Event end must be after start");
  }
  if (!TZ_PATTERN.test(args.eventTimezone)) {
    throw new Error("Invalid IANA timezone");
  }
}

/**
 * Create a new event in a group. Caller must be a member.
 * For group_shared events, every current group member is added as an
 * attendee with status "attending". For personal_shared, only the creator
 * is "attending"; other members are "invited" and must RSVP.
 */
export const createEvent = mutation({
  args: {
    groupId: v.id("groups"),
    type: v.union(
      v.literal("personal_shared"),
      v.literal("group_shared"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    isAllDay: v.boolean(),
    startUtc: v.number(),
    endUtc: v.number(),
    eventTimezone: v.string(),
    recurrenceRule: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireMember(ctx, args.groupId);
    validate(args);

    const now = Date.now();
    const eventId = await ctx.db.insert("events", {
      groupId: args.groupId,
      type: args.type,
      title: args.title.trim(),
      description: args.description?.trim() || undefined,
      isAllDay: args.isAllDay,
      startUtc: args.startUtc,
      endUtc: args.endUtc,
      eventTimezone: args.eventTimezone,
      recurrenceRule: args.recurrenceRule,
      createdBy: userId,
      createdAt: now,
    });

    // Seed attendees. Get all members of the group.
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const creator = await ctx.db.get(userId);
    const actorName = creator?.name ?? creator?.email ?? "Someone";

    for (const m of members) {
      const isCreator = m.userId === userId;
      const status =
        args.type === "group_shared" || isCreator ? "attending" : "invited";
      await ctx.db.insert("eventAttendees", {
        eventId,
        userId: m.userId,
        status,
        respondedAt: isCreator || args.type === "group_shared" ? now : undefined,
      });

      // Notify each member (except creator) of the new event.
      if (!isCreator) {
        await createNotification(ctx, {
          userId: m.userId,
          type: "event_invite",
          groupId: args.groupId,
          eventId,
          actorName,
          actorUserId: userId,
          message:
            args.type === "group_shared"
              ? `${actorName} added "${args.title.trim()}" to the group`
              : `${actorName} invited you to "${args.title.trim()}"`,
        });
      }
    }

    return eventId;
  },
});

/**
 * List non-deleted events in a group within a date range, sorted by start.
 * Returns null if the caller isn't a member of the group.
 */
export const listGroupEvents = query({
  args: {
    groupId: v.id("groups"),
    rangeStart: v.number(),
    rangeEnd: v.number(),
  },
  handler: async (ctx, { groupId, rangeStart, rangeEnd }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", groupId).eq("userId", userId),
      )
      .unique();
    if (!membership) return null;

    // Fetch all events for the group (the by_group_and_start lower-bound
    // would miss recurring events whose original start is before rangeStart
    // but which still have occurrences in range). For MVP we collect all
    // non-deleted events and let expandOccurrences filter — fine up to
    // PRD's per-group event cap.
    const rawEvents = await ctx.db
      .query("events")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const expanded: Doc<"events">[] = [];
    for (const e of rawEvents) {
      if (e.deletedAt !== undefined) continue;
      expanded.push(...expandOccurrences(e, rangeStart, rangeEnd));
    }
    return expanded.sort((a, b) => a.startUtc - b.startUtc);
  },
});

/**
 * Next N upcoming events in a group from now. Convenience for the group
 * detail page. Returns null if caller isn't a member.
 */
export const listUpcomingEventsInGroup = query({
  args: { groupId: v.id("groups"), limit: v.optional(v.number()) },
  handler: async (ctx, { groupId, limit }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", groupId).eq("userId", userId),
      )
      .unique();
    if (!membership) return null;

    const now = Date.now();
    // Expand into a forward 1-year window so recurring events show up.
    const lookahead = now + 365 * 24 * 60 * 60 * 1000;
    const raw = await ctx.db
      .query("events")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const expanded: Doc<"events">[] = [];
    for (const e of raw) {
      if (e.deletedAt !== undefined) continue;
      expanded.push(...expandOccurrences(e, now, lookahead));
    }

    return expanded
      .sort((a, b) => a.startUtc - b.startUtc)
      .slice(0, limit ?? 5);
  },
});

/**
 * Aggregate events for the caller's calendar within a date range. Two
 * sources, unioned:
 *   1. Events from every group the caller is a member of.
 *   2. "Shared-in" events — events the caller has a direct eventAttendees
 *      row for but whose group they are NOT a member of (they accepted a
 *      per-event share; see convex/eventShares.ts). These render with the
 *      sharer's name as the label (the caller can't see the group), never
 *      the group name.
 *
 * The optional groupIds filter narrows source 1 to a subset of the caller's
 * groups; when a filter is active, shared-in events are excluded (they
 * belong to no group chip). Returns null if not authenticated.
 *
 * Used by the Calendar tab. O(groups × events-in-range) DB calls — fine
 * up to PRD's 50-groups-per-user cap; Plan 9+ can add a busy-cache table
 * if scale demands.
 */
export const listMyEventsInRange = query({
  args: {
    rangeStart: v.number(),
    rangeEnd: v.number(),
    groupIds: v.optional(v.array(v.id("groups"))),
  },
  handler: async (ctx, { rangeStart, rangeEnd, groupIds }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    // Full membership set (before the optional filter) — used to dedupe
    // shared-in events that the caller would also receive via a group.
    const allMemberGroupIds = new Set(
      memberships.map((m) => m.groupId.toString()),
    );
    let memberGroupIds = memberships.map((m) => m.groupId);

    if (groupIds !== undefined) {
      const allowed = new Set(groupIds.map((id) => id.toString()));
      memberGroupIds = memberGroupIds.filter((id) => allowed.has(id.toString()));
    }

    const groupsById = new Map<string, Doc<"groups">>();
    for (const gid of memberGroupIds) {
      const g = await ctx.db.get(gid);
      if (g) groupsById.set(gid.toString(), g);
    }

    const enriched: Array<{
      event: Doc<"events">;
      groupColor: string;
      groupName: string;
    }> = [];

    // Source 1: events from groups the caller belongs to.
    for (const gid of memberGroupIds) {
      const raw = await ctx.db
        .query("events")
        .withIndex("by_group", (q) => q.eq("groupId", gid))
        .collect();
      for (const e of raw) {
        if (e.deletedAt !== undefined) continue;
        const instances = expandOccurrences(e, rangeStart, rangeEnd);
        for (const inst of instances) {
          const g = groupsById.get(inst.groupId.toString());
          enriched.push({
            event: inst,
            groupColor: g?.color ?? "#9CA3AF",
            groupName: g?.name ?? "Unknown",
          });
        }
      }
    }

    // Source 2: shared-in events (direct attendee rows, group not joined).
    // Skipped when a group filter is active — these have no group chip.
    if (groupIds === undefined) {
      const myAttendeeRows = await ctx.db
        .query("eventAttendees")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const seenEventIds = new Set<string>();
      for (const a of myAttendeeRows) {
        const e = await ctx.db.get(a.eventId);
        if (!e || e.deletedAt !== undefined) continue;
        // Already surfaced via a group membership → skip (no double-render).
        if (allMemberGroupIds.has(e.groupId.toString())) continue;
        if (seenEventIds.has(e._id.toString())) continue;
        seenEventIds.add(e._id.toString());

        // Label with the sharer's name, color with the source group's color
        // (a color isn't sensitive; the group name/roster never leaks here).
        const g = await ctx.db.get(e.groupId);
        const creator = await ctx.db.get(e.createdBy);
        const sharerName =
          creator?.name ?? creator?.email ?? "Shared with you";
        const instances = expandOccurrences(e, rangeStart, rangeEnd);
        for (const inst of instances) {
          enriched.push({
            event: inst,
            groupColor: g?.color ?? "#9CA3AF",
            groupName: sharerName,
          });
        }
      }
    }

    enriched.sort((a, b) => a.event.startUtc - b.event.startUtc);
    return enriched;
  },
});

/**
 * Full event detail: event row + hydrated attendees + non-deleted comments
 * + the caller's own RSVP status. Returns null if the event is deleted or
 * the caller has no access.
 *
 * Access = group member OR has an eventAttendees row (the latter covers
 * "guests" who accepted a per-event share without joining the group; see
 * convex/eventShares.ts). Guests get the same payload EXCEPT `isGuest: true`
 * and they never receive group identity here — getEvent deliberately
 * returns no group name/color (the page falls back to a neutral style) and
 * the separate getGroup query stays membership-gated, so a guest can't
 * pivot from one shared event into the group or its other events.
 */
export const getEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const event = await ctx.db.get(eventId);
    if (!event || event.deletedAt !== undefined) return null;

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", event.groupId).eq("userId", userId),
      )
      .unique();
    const myAttendance = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", eventId).eq("userId", userId),
      )
      .unique();
    // No group membership AND no direct attendee row → no access.
    if (!membership && !myAttendance) return null;
    const isGuest = !membership;

    const attendeeRows = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();

    const attendees: Array<{
      userId: Id<"users">;
      name: string;
      status: string;
      isYou: boolean;
      isCreator: boolean;
    }> = [];
    for (const a of attendeeRows) {
      const u = await ctx.db.get(a.userId);
      if (!u) continue;
      attendees.push({
        userId: a.userId,
        name: u.name ?? u.email ?? "Anonymous",
        status: a.status,
        isYou: a.userId === userId,
        isCreator: a.userId === event.createdBy,
      });
    }

    const commentRows = await ctx.db
      .query("eventComments")
      .withIndex("by_event_and_created", (q) => q.eq("eventId", eventId))
      .collect();

    const comments: Array<{
      _id: Id<"eventComments">;
      userId: Id<"users">;
      authorName: string;
      body: string;
      createdAt: number;
      isYou: boolean;
    }> = [];
    for (const c of commentRows) {
      if (c.deletedAt !== undefined) continue;
      const u = await ctx.db.get(c.userId);
      if (!u) continue;
      comments.push({
        _id: c._id,
        userId: c.userId,
        authorName: u.name ?? u.email ?? "Anonymous",
        body: c.body,
        createdAt: c.createdAt,
        isYou: c.userId === userId,
      });
    }
    comments.sort((a, b) => a.createdAt - b.createdAt);

    // Guests (event-share recipients, or removed members with a lingering
    // attendee row) must NOT see the rest of the group. For a group_shared
    // event the full attendee list IS effectively the group roster, and the
    // comments are group chatter — so for guests we expose only the host
    // (event creator) plus the guest's own row, and only comments authored
    // by the creator or the guest. This makes getEvent's "no roster to
    // guests" guarantee true by construction, regardless of how the guest
    // obtained their attendee row.
    const visibleAttendees = isGuest
      ? attendees.filter(
          (a) => a.userId === event.createdBy || a.userId === userId,
        )
      : attendees;
    const visibleComments = isGuest
      ? comments.filter(
          (c) => c.userId === event.createdBy || c.userId === userId,
        )
      : comments;

    return {
      event,
      attendees: visibleAttendees,
      comments: visibleComments,
      myStatus: myAttendance?.status ?? null,
      isCreator: event.createdBy === userId,
      isGuest, // true = access via event-share attendee row, not group membership
    };
  },
});

/**
 * Creator-only: edit event fields. Any subset of args allowed.
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isAllDay: v.optional(v.boolean()),
    startUtc: v.optional(v.number()),
    endUtc: v.optional(v.number()),
    eventTimezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.deletedAt !== undefined) {
      throw new Error("Event not found");
    }
    if (event.createdBy !== userId) {
      throw new Error("Only the event creator can edit");
    }

    const patch: Partial<Doc<"events">> = {};
    const next = {
      title: args.title ?? event.title,
      description: args.description ?? event.description,
      startUtc: args.startUtc ?? event.startUtc,
      endUtc: args.endUtc ?? event.endUtc,
      eventTimezone: args.eventTimezone ?? event.eventTimezone,
    };
    validate(next);

    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.description !== undefined) {
      patch.description = args.description.trim() || undefined;
    }
    if (args.isAllDay !== undefined) patch.isAllDay = args.isAllDay;
    if (args.startUtc !== undefined) patch.startUtc = args.startUtc;
    if (args.endUtc !== undefined) patch.endUtc = args.endUtc;
    if (args.eventTimezone !== undefined) {
      patch.eventTimezone = args.eventTimezone;
    }

    await ctx.db.patch(args.eventId, patch);

    // Notify attending/maybe attendees of the update.
    const actor = await ctx.db.get(userId);
    const actorName = actor?.name ?? actor?.email ?? "Someone";
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const a of attendees) {
      if (a.userId === userId) continue;
      if (a.status === "declined") continue;
      await createNotification(ctx, {
        userId: a.userId,
        type: "event_updated",
        groupId: event.groupId,
        eventId: args.eventId,
        actorName,
        actorUserId: userId,
        message: `${actorName} updated "${event.title}"`,
      });
    }
  },
});

/**
 * Creator-only: cancel an event. Soft-delete (set deletedAt). Attendees
 * and comments remain attached for history.
 */
export const cancelEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const userId = await requireUser(ctx);
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");
    if (event.deletedAt !== undefined) return; // idempotent
    if (event.createdBy !== userId) {
      throw new Error("Only the event creator can cancel");
    }
    await ctx.db.patch(eventId, { deletedAt: Date.now() });

    // Notify all non-declined attendees that the event was cancelled.
    const actor = await ctx.db.get(userId);
    const actorName = actor?.name ?? actor?.email ?? "Someone";
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    for (const a of attendees) {
      if (a.userId === userId) continue;
      if (a.status === "declined") continue;
      await createNotification(ctx, {
        userId: a.userId,
        type: "event_cancelled",
        groupId: event.groupId,
        eventId,
        actorName,
        actorUserId: userId,
        message: `${actorName} cancelled "${event.title}"`,
      });
    }
  },
});
