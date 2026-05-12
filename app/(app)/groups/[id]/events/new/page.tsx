"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { EventCreateForm } from "@/components/events/EventCreateForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewEventPage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center gap-3 py-4">
        <Link
          href={`/groups/${groupId}`}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-text">
          New event
        </h1>
      </header>

      <EventCreateForm groupId={groupId} />
    </div>
  );
}
