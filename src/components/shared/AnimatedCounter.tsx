"use client";

import { useEffect, useRef, useSyncExternalStore, useCallback } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

/**
 * Animates a number from 0 to target value on mount.
 * Uses requestAnimationFrame as an external store to satisfy
 * the react-hooks/set-state-in-effect lint rule.
 */
export function AnimatedCounter({
  value,
  duration = 600,
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const displayRef = useRef(0);
  const rafRef = useRef<number>(undefined);
  const startTimeRef = useRef<number>(undefined);
  const listenersRef = useRef(new Set<() => void>());

  const notify = useCallback(() => {
    for (const listener of listenersRef.current) listener();
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => { listenersRef.current.delete(listener); };
  }, []);

  const getSnapshot = useCallback(() => displayRef.current, []);

  const display = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (value === 0) {
      displayRef.current = 0;
      notify();
      return;
    }

    startTimeRef.current = undefined;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      displayRef.current = Math.round(eased * value);
      notify();

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, notify]);

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  );
}
