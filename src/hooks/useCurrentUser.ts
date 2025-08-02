import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexAuth } from "convex/react";

export function useCurrentUser() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.auth.loggedInUser);

  return {
    user,
    isLoading: authLoading || (isAuthenticated && user === undefined),
    isAuthenticated,
    email: user?.email,
  };
}
