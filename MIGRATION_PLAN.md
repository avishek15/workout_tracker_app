# Convex Migration Plan: Self-Hosted → Managed Cloud

## Overview

Migration plan for moving from self-hosted Convex to managed Convex cloud service.

## Pre-Migration Checklist

### 1. Environment Setup

- [ ] Create new Convex cloud project
- [ ] Get new deployment URL and keys
- [ ] Update environment variables
- [ ] Install Convex CLI if not already installed

### 2. Code Changes Required

#### Environment Variables

```bash
# Remove self-hosted URLs
CONVEX_SELF_HOSTED_URL=https://backend-fco84ggoo088ww88og8s0gsg.avishekmajumder.com
CONVEX_SELF_HOSTED_ADMIN_KEY=self-hosted-convex|01f4e37bbdd81e27c2af5634919d7ce93670a8dfe7655ef66f1c0372a434885e3a8bb5c7b7598a8bc5ad5e44787ab167de
CONVEX_SITE_URL=https://convex-fco84ggoo088ww88og8s0gsg.avishekmajumder.com

# Add managed Convex URLs
VITE_CONVEX_URL=https://your-new-deployment.convex.cloud
```

#### Auth Configuration

- [ ] Update `convex/auth.config.ts` to use managed Convex domain
- [ ] Test authentication flow with new deployment

#### Database Schema

- [ ] Deploy schema to new managed instance
- [ ] Verify all tables and indexes are created correctly

### 3. Data Migration

#### Option A: Fresh Start (Recommended for personal app)

- [ ] Start with empty database
- [ ] Re-create workouts and data
- [ ] No data loss if starting fresh

#### Option B: Data Export/Import (If needed)

- [ ] Export data from self-hosted instance
- [ ] Import to managed instance
- [ ] Verify data integrity

### 4. Deployment Steps

1. **Update Environment**

    ```bash
    # Update .env.local with new Convex URLs
    VITE_CONVEX_URL=https://your-new-deployment.convex.cloud
    ```

2. **Deploy to Managed Convex**

    ```bash
    npx convex deploy
    ```

3. **Test Authentication**

    - Verify sign up/login works
    - Test all app functionality

4. **Update DNS/Domain** (if using custom domain)
    - Point domain to new managed deployment
    - Update SSL certificates

### 5. Post-Migration Verification

- [ ] Authentication works correctly
- [ ] All queries and mutations function
- [ ] Progress analytics load properly
- [ ] Workout creation and tracking works
- [ ] Session management works

### 6. Rollback Plan

If issues arise:

1. Keep self-hosted instance running
2. Revert environment variables
3. Switch back to self-hosted URLs
4. Debug issues before re-migrating

## Benefits of Managed Convex

- ✅ **Automatic scaling**
- ✅ **Built-in monitoring**
- ✅ **Managed backups**
- ✅ **Better performance**
- ✅ **Simplified deployment**
- ✅ **Professional support**

## Timeline Estimate

- **Setup**: 1-2 hours
- **Testing**: 2-3 hours
- **Deployment**: 30 minutes
- **Total**: 4-6 hours

## Notes

- Self-hosted instance can be kept as backup
- No downtime required if planned correctly
- Test thoroughly before switching production traffic
