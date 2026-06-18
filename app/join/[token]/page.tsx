import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { safeNextPath } from "@/lib/safeNext";
import { JoinLandingClient } from "./JoinLandingClient";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ next?: string }>;
}

async function getPreview(token: string) {
  try {
    return await fetchQuery(api.invites.getInvitePreview, { token });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const preview = await getPreview(token);

  if (!preview) {
    return {
      title: "Invite · Decssy",
      description: "This invite link is invalid or has expired.",
    };
  }

  const title = `Join ${preview.groupName} on Decssy`;
  const description = `${preview.memberCount} ${
    preview.memberCount === 1 ? "member" : "members"
  } · Created by ${preview.ownerName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["/og-image.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function JoinLandingPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { next: rawNext } = await searchParams;
  const preview = await getPreview(token);

  // Only honor same-origin in-app paths to prevent open-redirect to attacker
  // domains. null means the accept page uses its default destination
  // (/groups/<id>).
  const next = safeNextPath(rawNext);

  return <JoinLandingClient token={token} preview={preview} next={next} />;
}
