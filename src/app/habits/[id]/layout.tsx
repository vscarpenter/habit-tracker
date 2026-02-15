// Return a single placeholder so Next.js generates the page template.
// Actual habit IDs are resolved client-side from IndexedDB.
// CloudFront's 404→index.html fallback enables routing to any habit ID.
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function HabitIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
