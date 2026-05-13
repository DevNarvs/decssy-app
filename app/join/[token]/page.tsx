import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { JoinLandingClient } from "./JoinLandingClient";

interface PageProps {
  params: Promise<{ token: string }>;
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

export default async function JoinLandingPage({ params }: PageProps) {
  const { token } = await params;
  const preview = await getPreview(token);
  return <JoinLandingClient token={token} preview={preview} />;
}
