"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
    const { isAuthenticated } = useConvexAuth();
    const { signOut } = useAuthActions();

    if (!isAuthenticated) {
        return null;
    }

    return (
        <button
            className="px-4 py-2 rounded bg-background-secondary text-text-primary border border-accent-primary/30 font-semibold hover:bg-accent-primary hover:text-white transition-colors shadow-sm hover:shadow font-source-sans"
            onClick={() => void signOut()}
        >
            Sign out
        </button>
    );
}
