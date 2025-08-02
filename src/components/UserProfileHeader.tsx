import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { User, Settings, LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

interface UserProfileHeaderProps {
    onNavigateToProfile?: () => void;
}

export function UserProfileHeader({
    onNavigateToProfile,
}: UserProfileHeaderProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const { signOut } = useAuthActions();
    const profile = useQuery(api.users.getProfile);
    const getFileUrl = useQuery(
        api.users.getFileUrl,
        profile?.imageStorageId ? { storageId: profile.imageStorageId } : "skip"
    );

    if (!profile) {
        return (
            <button
                onClick={() => void signOut()}
                className="px-4 py-2 rounded bg-background-secondary text-text-primary border border-accent-primary/30 font-semibold hover:bg-accent-primary hover:text-white transition-colors shadow-sm hover:shadow font-source-sans"
            >
                Sign out
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                aria-haspopup="true"
                aria-expanded={showDropdown}
                aria-label="User menu"
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-background-primary transition-colors"
            >
                <div className="w-12 h-12 rounded-full bg-background-primary border-2 border-accent-primary/20 flex items-center justify-center overflow-hidden">
                    {getFileUrl ? (
                        <img
                            src={getFileUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-6 h-6 text-accent-primary/60" />
                    )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-text-primary font-source-sans">
                    {profile.name || "User"}
                </span>
            </button>

            {showDropdown && (
                <div
                    role="menu"
                    aria-label="User menu options"
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-accent-primary/20 py-2 z-50"
                >
                    <div className="px-4 py-2 border-b border-accent-primary/10">
                        <p className="text-sm font-medium text-text-primary font-source-sans">
                            {profile.name || "User"}
                        </p>
                        <p className="text-xs text-text-secondary font-source-sans">
                            {profile.email}
                        </p>
                    </div>
                    <div className="py-1">
                        <button
                            onClick={() => {
                                setShowDropdown(false);
                                onNavigateToProfile?.();
                            }}
                            role="menuitem"
                            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-background-primary transition-colors font-source-sans flex items-center space-x-2"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Profile Settings</span>
                        </button>
                        <div className="border-t border-accent-primary/10 my-1"></div>
                        <div className="px-2">
                            <button
                                onClick={() => void signOut()}
                                role="menuitem"
                                className="w-full px-4 py-2 rounded bg-background-secondary text-text-primary border border-accent-primary/30 font-semibold hover:bg-accent-primary hover:text-white transition-colors shadow-sm hover:shadow font-source-sans"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop to close dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
}
