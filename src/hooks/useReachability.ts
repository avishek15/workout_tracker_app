import { useEffect, useState } from "react";
import { subscribeReachability } from "../lib/sync";

export function useReachability() {
    const [online, setOnline] = useState<boolean>(navigator.onLine);
    const [reachable, setReachable] = useState<boolean>(true);

    useEffect(() => {
        const on = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener("online", on);
        window.addEventListener("offline", off);
        const unsub = subscribeReachability(setReachable);
        return () => {
            window.removeEventListener("online", on);
            window.removeEventListener("offline", off);
            unsub();
        };
    }, []);

    return { isOffline: !online || !reachable, online, reachable };
}
