import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { User, Camera, Save, AlertCircle } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

export function Profile() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const profile = useQuery(api.users.getProfile);
    const updateProfile = useMutation(api.users.updateProfile);
    const { signOut } = useAuthActions();

    // Pre-fill form with user data when it loads
    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setEmail(profile.email || "");
            setBio(profile.bio || "");
            setProfileImage(profile.image || null);
        }
    }, [profile]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfileImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        try {
            await updateProfile({
                name: name.trim() || undefined,
                email: email.trim() || undefined,
                bio: bio.trim() || undefined,
                profileImage: profileImage || undefined,
            });
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Failed to update profile");
        }
    };

    if (profile === undefined) {
        return (
            <div className="p-8 text-center">
                <div className="text-text-secondary">Loading profile...</div>
            </div>
        );
    }

    // Handle anonymous users
    if (profile.isAnonymous) {
        return (
            <div className="p-8 space-y-8">
                <div className="text-center">
                    <div className="w-16 h-16 bg-accent-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-accent-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-4 font-montserrat">
                        Anonymous Session
                    </h2>
                    <p className="text-text-secondary font-source-sans mb-6">
                        You're currently using an anonymous session. To save
                        your profile information, please sign up for an account.
                    </p>
                    <button
                        onClick={() => void signOut()}
                        className="bg-accent-primary text-white px-6 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium font-source-sans"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary font-montserrat">
                    Profile Settings
                </h2>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium font-source-sans"
                >
                    {isEditing ? "Cancel" : "Edit Profile"}
                </button>
            </div>

            <div className="max-w-2xl space-y-8">
                {/* Profile Image Section */}
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-full bg-background-primary border-4 border-accent-primary/20 flex items-center justify-center overflow-hidden">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-16 h-16 text-accent-primary/60" />
                            )}
                        </div>
                        {isEditing && (
                            <label className="absolute bottom-0 right-0 bg-accent-primary text-white p-2 rounded-full cursor-pointer hover:bg-accent-primary/90 transition-colors">
                                <Camera className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 font-source-sans">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 rounded-lg bg-background-primary border border-accent-primary/30 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-colors text-text-primary placeholder-text-muted disabled:opacity-50 disabled:cursor-not-allowed font-source-sans"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 font-source-sans">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 rounded-lg bg-background-primary border border-accent-primary/30 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-colors text-text-primary placeholder-text-muted disabled:opacity-50 disabled:cursor-not-allowed font-source-sans"
                            placeholder="Enter your email address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 font-source-sans">
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            disabled={!isEditing}
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg bg-background-primary border border-accent-primary/30 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-colors text-text-primary placeholder-text-muted disabled:opacity-50 disabled:cursor-not-allowed font-source-sans resize-none"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    {isEditing && (
                        <div className="flex gap-4 pt-6">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 px-4 py-3 border border-accent-primary/30 text-text-primary rounded-lg hover:bg-background-primary transition-colors font-medium font-source-sans"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void handleSave()}
                                className="flex-1 bg-accent-primary text-white px-4 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium font-source-sans flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
