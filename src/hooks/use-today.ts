"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

function getLocalDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Returns today's local date string (YYYY-MM-DD) and refreshes at midnight.
 */
export function useToday() {
  const [today, setToday] = useState(getLocalDateString);

  useEffect(() => {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      setToday(getLocalDateString());
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [today]);

  return today;
}
