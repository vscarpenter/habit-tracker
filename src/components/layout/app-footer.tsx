import { format } from "date-fns";
import { APP_VERSION, BUILD_DATE } from "@/lib/version";

function formatBuildDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return null;
  }
}

export function AppFooter() {
  const formatted = formatBuildDate(BUILD_DATE);

  return (
    <footer className="px-6 py-4 text-center text-xs text-text-muted">
      v{APP_VERSION}
      {formatted && <> · Built {formatted}</>}
    </footer>
  );
}
