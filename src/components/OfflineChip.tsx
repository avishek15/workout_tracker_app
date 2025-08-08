import { useEffect, useState } from "react";

export function OfflineChip() {
    const [online, setOnline] = useState<boolean>(navigator.onLine);

    useEffect(() => {
        const on = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener("online", on);
        window.addEventListener("offline", off);
        return () => {
            window.removeEventListener("online", on);
            window.removeEventListener("offline", off);
        };
    }, []);

    if (online) return null;

    return (
        <div className="hidden md:flex items-center text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
            Offline mode
        </div>
    );
}
