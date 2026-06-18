import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { EventShareLandingClient } from "./EventShareLandingClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getPreview(token: string) {
  try {
    return await fetchQuery(api.eventShares.getEventSharePreview, { token });
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
      title: "Event invite · Decssy",
      description: "This event share link is invalid or has expired.",
    };
  }

  const title = `${preview.sharerName} invited you to ${preview.eventTitle}`;
  const description = "RSVP on Decssy — it'll show on your calendar.";

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

export default async function EventShareLandingPage({ params }: PageProps) {
  const { token } = await params;
  const preview = await getPreview(token);
  return <EventShareLandingClient token={token} preview={preview} />;
}
