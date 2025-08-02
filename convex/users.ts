import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
                bio: undefined,
                isAnonymous: true,
            };
        }

        // Get bio from userProfiles table
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();

        return {
            name: user.name,
            email: user.email,
            image: user.image,
            bio: userProfile?.bio,
            isAnonymous: user.isAnonymous || false,
        };
    },
}); 