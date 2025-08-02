import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
    args: v.object({}),
    returns: v.string(),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        return await ctx.storage.generateUploadUrl();
    },
});

export const updateProfileImage = mutation({
    args: {
        storageId: v.id("_storage"),
        oldStorageId: v.optional(v.id("_storage")), // for cleanup
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Delete old profile image if it exists
        if (args.oldStorageId) {
            await ctx.storage.delete(args.oldStorageId);
        }

        // Update user profile with new storage ID
        await ctx.db.patch(userId, { image: args.storageId });

        return null;
    },
});

export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        bio: v.optional(v.string()),
        profileImage: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Update user profile with provided fields
        const updates: any = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.email !== undefined) updates.email = args.email;
        if (args.profileImage !== undefined) updates.image = args.profileImage;

        await ctx.db.patch(userId, updates);

        // Store bio in a separate table since it's not part of the auth user schema
        if (args.bio !== undefined) {
            const existingBio = await ctx.db
                .query("userProfiles")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .unique();

            if (existingBio) {
                await ctx.db.patch(existingBio._id, { bio: args.bio });
            } else {
                await ctx.db.insert("userProfiles", {
                    userId,
                    bio: args.bio,
                });
            }
        }

        return null;
    },
});

export const getProfile = query({
    args: {},
    returns: v.object({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        image: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        bio: v.optional(v.string()),
        isAnonymous: v.boolean(),
    }),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return {
                name: undefined,
                email: undefined,
                image: undefined,
                imageStorageId: undefined,
                bio: undefined,
                isAnonymous: true,
            };
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            return {
                name: undefined,
                email: undefined,
                image: undefined,
                imageStorageId: undefined,
                bio: undefined,
                isAnonymous: true,
            };
        }

        // Get bio from userProfiles table
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();

        // Handle mixed data types: user.image can be URL string OR storage ID
        let imageStorageId: Id<"_storage"> | undefined;
        if (user.image && typeof user.image === "string") {
            // If user.image is a string, assume it's a storage ID
            // Convex storage IDs are strings that can be used directly
            imageStorageId = user.image as Id<"_storage">;
        }

        return {
            name: user.name,
            email: user.email,
            image: user.image,
            imageStorageId,
            bio: userProfile?.bio,
            isAnonymous: user.isAnonymous || false,
        };
    },
});

export const getFileUrl = query({
    args: { storageId: v.id("_storage") },
    returns: v.union(v.string(), v.null()),
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});
