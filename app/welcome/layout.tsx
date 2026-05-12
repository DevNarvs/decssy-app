/**
 * Onboarding layout — no nav, no surrounding chrome.
 * Each step is a focused single-card screen.
 */
export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
