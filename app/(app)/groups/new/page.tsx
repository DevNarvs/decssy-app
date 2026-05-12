import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GroupCreateForm } from "@/components/groups/GroupCreateForm";

export const metadata = { title: "New group · Decssy" };

export default function NewGroupPage() {
  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center gap-3 py-4">
        <Link
          href="/groups"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-text">
          New group
        </h1>
      </header>

      <GroupCreateForm />
    </div>
  );
}
