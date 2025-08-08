import { useEffect } from "react";
import { startBackgroundSync } from "../lib/sync";

export function SyncProvider() {
    useEffect(() => {
        const stop = startBackgroundSync();
        return () => stop?.();
    }, []);
    return null;
}
