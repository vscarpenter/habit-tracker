"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";

interface SyncRefreshContextValue {
  /** Incremented each time a remote completion change is applied to IndexedDB. */
  refreshKey: number;
}

const SyncRefreshContext = createContext<SyncRefreshContextValue>({ refreshKey: 0 });

export function SyncRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const onRemoteChange = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useRealtimeSync({ onRemoteChange });

  return (
    <SyncRefreshContext.Provider value={{ refreshKey }}>
      {children}
    </SyncRefreshContext.Provider>
  );
}

export function useSyncRefresh(): SyncRefreshContextValue {
  return useContext(SyncRefreshContext);
}
