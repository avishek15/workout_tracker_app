import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
    // This component ensures the user is properly synced with Convex Auth
    // The loggedInUser query will automatically handle user creation/sync
    const user = useQuery(api.auth.loggedInUser);

    // No UI needed, just ensure the query runs
    return null;
}
