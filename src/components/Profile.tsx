import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { User, Camera, Save, AlertCircle, Loader2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { UnitToggle } from "./UnitToggle";

// Utility functions
const validateImageFile = (file: File): string | null => {
    // File size validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        return "Image must be smaller than 5MB";
    }

    // MIME type validation
    if (!file.type.startsWith("image/")) {
        return "Please select a valid image file";
    }

    return null;
};

const resizeAndConvertImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            const maxSize = 300;
            const originalWidth = img.width;
            const originalHeight = img.height;

            // Calculate aspect ratio
            const aspectRatio = originalWidth / originalHeight;

            let newWidth, newHeight;

            if (aspectRatio > 1) {
                // Landscape image
                newWidth = maxSize;
                newHeight = maxSize / aspectRatio;
            } else {
                // Portrait or square image
                newHeight = maxSize;
                newWidth = maxSize * aspectRatio;
            }

            // Set canvas size to maxSize x maxSize
            canvas.width = maxSize;
            canvas.height = maxSize;

            // Calculate centering offsets
            const offsetX = (maxSize - newWidth) / 2;
            const offsetY = (maxSize - newHeight) / 2;

            // Fill canvas with white background (optional, for transparent images)
            if (ctx) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, maxSize, maxSize);
            }

            // Draw the resized image centered on the canvas
            ctx?.drawImage(img, offsetX, offsetY, newWidth, newHeight);

            // Convert to WebP
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to convert image"));
                },
                "image/webp",
                0.8
            ); // 80% quality for good balance
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
    });
};

const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
};

export function Profile() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({});
    const [originalProfile, setOriginalProfile] = useState<any>(null);

    const profile = useQuery(api.users.getProfile);
    const updateProfile = useMutation(api.users.updateProfile);
    const generateUploadUrl = useMutation(api.users.generateUploadUrl);
    const updateProfileImage = useMutation(api.users.updateProfileImage);
    const getFileUrl = useQuery(
        api.users.getFileUrl,
        profile?.imageStorageId ? { storageId: profile.imageStorageId } : "skip"
    );

    const { signOut } = useAuthActions();

    // Pre-fill form with user data when it loads
    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setEmail(profile.email || "");
            setBio(profile.bio || "");
            setOriginalProfile(profile);
        }
    }, [profile]);

    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation
        const validationError = validateImageFile(file);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setImageUploading(true);

        try {
            // Step 1: Process image
            const processedImage = await resizeAndConvertImage(file);

            // Step 2: Generate upload URL
            const uploadUrl = await generateUploadUrl();

            // Step 3: Upload to Convex storage
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": "image/webp" },
                body: processedImage,
            });

            if (!result.ok) {
                throw new Error("Upload failed");
            }

            const { storageId } = await result.json();

            // Step 4: Update profile with new storage ID
            const oldStorageId = profile?.imageStorageId;
            await updateProfileImage({
                storageId,
                oldStorageId: oldStorageId || undefined,
            });

            // Update the original profile to reflect the new image
            if (originalProfile) {
                setOriginalProfile({
                    ...originalProfile,
                    image: storageId,
                    imageStorageId: storageId,
                });
            }
            // The getFileUrl query will automatically update with the new storageId
            toast.success("Profile image updated successfully!");
        } catch (error) {
            console.error("Image upload error:", error);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setImageUploading(false);
        }
    };

    const handleSave = async () => {
        // Clear previous validation errors
        setValidationErrors({});

        // Validation
        const errors: Record<string, string> = {};

        if (name.trim() && !validateName(name.trim())) {
            errors.name = "Name must be at least 2 characters long";
        }

        if (email.trim() && !validateEmail(email.trim())) {
            errors.email = "Please enter a valid email address";
        }

        if (bio.trim() && bio.trim().length > 500) {
            errors.bio = "Bio must be less than 500 characters";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            toast.error("Please fix the validation errors");
            return;
        }

        // Check for changes (silently)
        const hasChanges =
            name.trim() !== (originalProfile?.name || "") ||
            email.trim() !== (originalProfile?.email || "") ||
            bio.trim() !== (originalProfile?.bio || "");

        // If no changes, just close edit mode silently
        if (!hasChanges) {
            setIsEditing(false);
            return; // No toast, no API call
        }

        setIsSaving(true);

        try {
            const updates: any = {};

            // Only include changed fields
            if (name.trim() !== (originalProfile?.name || "")) {
                updates.name = name.trim() || undefined;
            }
            if (email.trim() !== (originalProfile?.email || "")) {
                updates.email = email.trim() || undefined;
            }
            if (bio.trim() !== (originalProfile?.bio || "")) {
                updates.bio = bio.trim() || undefined;
            }

            await updateProfile(updates);
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
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
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary font-montserrat">
                    Profile Settings
                </h2>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium font-source-sans"
                >
                    {isEditing ? "Cancel" : "Edit Profile"}
                </button>
            </div>

            <div className="max-w-md sm:max-w-lg lg:max-w-xl mx-auto space-y-6 sm:space-y-8">
                {/* Profile Image Section */}
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-full bg-background-primary border-4 border-accent-primary/20 flex items-center justify-center overflow-hidden">
                            {getFileUrl ? (
                                <img
                                    src={getFileUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-16 h-16 text-accent-primary/60" />
                            )}
                            {imageUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
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
                                    disabled={imageUploading}
                                />
                            </label>
                        )}
                    </div>
                    {isEditing && (
                        <p className="text-sm text-text-secondary mt-2 font-source-sans">
                            Click the camera icon to upload a new profile image
                            (max 5MB)
                        </p>
                    )}
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
                            className={`w-full px-4 py-3 rounded-lg bg-background-primary border focus:ring-1 focus:ring-accent-primary outline-none transition-colors text-text-primary placeholder-text-muted disabled:opacity-50 disabled:cursor-not-allowed font-source-sans ${
                                validationErrors.name
                                    ? "border-danger focus:border-danger"
                                    : "border-accent-primary/30 focus:border-accent-primary"
                            }`}
                            placeholder="Enter your full name"
                        />
                        {validationErrors.name && (
                            <p className="text-danger text-sm mt-1 font-source-sans">
                                {validationErrors.name}
                            </p>
                        )}
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
                            className={`w-full px-4 py-3 rounded-lg bg-background-primary border focus:ring-1 focus:ring-accent-primary outline-none transition-colors text-text-primary placeholder-text-muted disabled:opacity-50 disabled:cursor-not-allowed font-source-sans ${
                                validationErrors.email
                                    ? "border-danger focus:border-danger"
                                    : "border-accent-primary/30 focus:border-accent-primary"
                            }`}
                            placeholder="Enter your email address"
                        />
                        {validationErrors.email && (
                            <p className="text-danger text-sm mt-1 font-source-sans">
                                {validationErrors.email}
                            </p>
                        )}
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
                            className={`w-full px-4 py-3 rounded-lg bg-background-primary border focus:ring-1 focus:ring-accent-primary outline-none transition-colors text-text-primary placeholder-text-muted disabled:opacity-50 disabled:cursor-not-allowed font-source-sans resize-none ${
                                validationErrors.bio
                                    ? "border-danger focus:border-danger"
                                    : "border-accent-primary/30 focus:border-accent-primary"
                            }`}
                            placeholder="Tell us about yourself..."
                        />
                        {validationErrors.bio && (
                            <p className="text-danger text-sm mt-1 font-source-sans">
                                {validationErrors.bio}
                            </p>
                        )}
                        <p className="text-xs text-text-muted mt-1 font-source-sans">
                            {bio.length}/500 characters
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 font-source-sans">
                            Weight Unit Preference
                        </label>
                        <UnitToggle size="md" showLabel={false} />
                        <p className="text-xs text-text-muted mt-1 font-source-sans">
                            This setting affects how weights are displayed
                            throughout the app
                        </p>
                    </div>

                    {isEditing && (
                        <div className="flex gap-4 pt-6">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setValidationErrors({});
                                    // Reset to original values
                                    if (originalProfile) {
                                        setName(originalProfile.name || "");
                                        setEmail(originalProfile.email || "");
                                        setBio(originalProfile.bio || "");
                                    }
                                }}
                                className="flex-1 px-4 py-3 border border-accent-primary/30 text-text-primary rounded-lg hover:bg-background-primary transition-colors font-medium font-source-sans"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void handleSave()}
                                disabled={isSaving}
                                className="flex-1 bg-accent-primary text-white px-4 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium font-source-sans flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
