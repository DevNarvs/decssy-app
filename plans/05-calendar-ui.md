# Plan 5: Calendar UI — Implementation Plan

> Yolo-mode plan. Full code only for novel patterns; standard component patterns reference Plan 2–4.

**Goal:** The Calendar tab becomes a functional combined calendar showing events from all groups the user is in. Month grid + agenda below; group filter chips; FAB to create. Tap event → existing event detail page (Plan 4). Swipe months left/right.

**Architecture:**
- New Convex query `listMyEventsInRange(rangeStart, rangeEnd, groupIds?)` — server-side aggregation across the caller's group memberships, with optional group filter array
- Custom-built month grid (no calendar library — design brief flagged libs as desktop-heavy)
- Pure-client month navigation (no URL state); selected date as local React state
- FAB opens a small bottom-sheet group picker → routes to `/groups/[id]/events/new`
- Pending-invite redirect from existing /calendar logic stays untouched (runs first in useEffect)

**Out of scope:**
- Week / day views (Phase 2)
- Drag-to-reschedule (Phase 2)
- Multi-day spanning across cells (events appear on start-date cell only; agenda shows full range)
- Tablet two-pane layout (mobile-first; tablet uses same single-column for MVP)

---

## File structure (delta)

```
decssy/
├─ app/(app)/calendar/
│  └─ page.tsx                     ← REWRITTEN (was placeholder + pendingInvite redirect)
├─ components/calendar/
│  ├─ MonthGrid.tsx                ← NEW
│  ├─ DayCell.tsx                  ← NEW
│  ├─ AgendaList.tsx               ← NEW
│  ├─ GroupFilterChips.tsx         ← NEW
│  ├─ CalendarHeader.tsx           ← NEW (brand + filter chip + month nav)
│  └─ CreateEventFAB.tsx           ← NEW
├─ convex/
│  └─ events.ts                    ← MODIFIED (add listMyEventsInRange)
└─ tests/e2e/calendar.spec.ts      ← NEW
```

---

## Tasks (compact)

### Task 0: Pre-flight
- `git status` clean, e2e 10/10 non-auth pass

### Task 1: `listMyEventsInRange` query
Append to `convex/events.ts`:

```typescript
export const listMyEventsInRange = query({
  args: {
    rangeStart: v.number(),
    rangeEnd: v.number(),
    // Optional filter: if undefined → all groups the caller is in.
    // If empty array → no groups (returns []).
    groupIds: v.optional(v.array(v.id("groups"))),
  },
  handler: async (ctx, { rangeStart, rangeEnd, groupIds }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    // Get groups the caller is a member of.
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    let memberGroupIds = memberships.map((m) => m.groupId);

    if (groupIds !== undefined) {
      const allowed = new Set(groupIds);
      memberGroupIds = memberGroupIds.filter((id) => allowed.has(id));
    }

    // Fan-out: events per group, filtered to range, then merged + sorted.
    const allEvents: Doc<"events">[] = [];
    for (const gid of memberGroupIds) {
      const events = await ctx.db
        .query("events")
        .withIndex("by_group_and_start", (q) =>
          q.eq("groupId", gid).gte("startUtc", rangeStart),
        )
        .collect();
      for (const e of events) {
        if (e.deletedAt !== undefined) continue;
        if (e.startUtc > rangeEnd) continue;
        allEvents.push(e);
      }
    }

    // Resolve group color for client-side rendering.
    const groupsById = new Map<Id<"groups">, Doc<"groups">>();
    for (const gid of memberGroupIds) {
      const g = await ctx.db.get(gid);
      if (g) groupsById.set(gid, g);
    }

    return allEvents
      .sort((a, b) => a.startUtc - b.startUtc)
      .map((e) => ({
        event: e,
        groupColor: groupsById.get(e.groupId)?.color ?? "#9CA3AF",
        groupName: groupsById.get(e.groupId)?.name ?? "Unknown",
      }));
  },
});
```

Commit: "feat: listMyEventsInRange aggregates events across caller's groups with optional filter"

### Task 2: MonthGrid + DayCell components
Custom grid using only date math + Tailwind. Key details:
- Sunday-first week (PRD wireframe shows S M T W T F S)
- 6 rows × 7 cols max (handles months that span 6 weeks)
- Each cell renders date number + up to 3 colored dots
- Today: pink accent ring around the date number
- Selected: dark filled background on the date
- Dimmed cells for previous/next month overflow

```tsx
// components/calendar/MonthGrid.tsx
interface Props {
  year: number;
  month: number; // 0-indexed
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  eventsByDay: Map<string, { groupColor: string }[]>; // key: YYYY-MM-DD local
}
```

DayCell receives `date`, `isToday`, `isSelected`, `isOutOfMonth`, `eventColors[]`, `onClick`.

Commit: "feat: MonthGrid + DayCell — custom 6×7 layout with up to 3 color dots per cell"

### Task 3: AgendaList component
Shows events for the selected date (or all upcoming if no date selected). Uses EventCard from Plan 4. Empty state if no events.

Commit: "feat: AgendaList — selected-day events with EventCard reuse"

### Task 4: GroupFilterChips component
Horizontal scrollable row of group chips. Multi-select (clicking toggles). When 0 selected, show all (treat as "no filter"). Each chip: colored dot + group name.

Commit: "feat: GroupFilterChips — multi-select horizontal scroll filter"

### Task 5: CalendarHeader component
Brand wordmark, month name + year, prev/next arrow buttons. Optional filter chip count next to brand.

Commit: "feat: CalendarHeader with month nav"

### Task 6: CreateEventFAB
Floating + button bottom-right. Clicking opens a small sheet listing user's groups → tap one → routes to `/groups/[id]/events/new`. If only one group, skip the picker and route directly.

Commit: "feat: CreateEventFAB with group-picker bottom-sheet"

### Task 7: Rewrite /calendar/page.tsx
Wires it all together:
- Keep the pendingInvite redirect from Plan 3
- State: `currentMonth` (Date pointing to first of month), `selectedDate` (Date), `selectedGroupIds` (Set<Id<"groups">>)
- Query `listMyEventsInRange` with month bounds + filter
- Group events by local-date string for the grid
- Pass everything down

Commit: "feat: /calendar fully functional — grid + agenda + filter + FAB"

### Task 8: E2E tests
- Unauthed access to /calendar redirects to /sign-in (already covered by middleware — verify with explicit test)
- Authed users see "Calendar." heading (existing PlaceholderScreen test still valid since we're replacing the placeholder)

Commit: "test: calendar e2e — redirect + placeholder retired"

### Task 9: README + build check
Mark Plan 5 done. Run `npm run build` + e2e tests. Commit: "docs: Plan 5 complete"

---

## Self-review

**PRD coverage**: §5.4 Calendar viewing (unified, color-coded, filter, month nav, tap date) ✅. §9.1 wireframe approximation ✅.

**Out of scope (deferred per PRD §17.1)**: week/day views, drag-reschedule, multi-day cell spanning, tablet two-pane.

**Risks**:
1. `listMyEventsInRange` fan-out across groups is O(groups) DB calls — fine for <50 groups (PRD §17.1 caps groups at 50/user). Plan 9+ might add a denormalized cache if scale demands.
2. Multi-day events render on start date only — agenda shows full range, but grid shows just the start. PRD §9.1 wireframe implies this; users may expect spans. Phase 2 polish.
3. Selected-date is local React state — refreshing the page loses it. URL state is cleaner but adds routing complexity for MVP minimal gain.
