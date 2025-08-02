# 🚀 FitFlow Pro - Coolify Deployment Guide

This guide will help you deploy FitFlow Pro on Coolify using Nixpacks for automatic build detection.

## 📋 Prerequisites

1. **Coolify Instance**: Access to a Coolify server
2. **GitHub Repository**: Your code is in a GitHub repository
3. **Convex Backend**: A Convex deployment for your backend
4. **Domain**: A domain name for your application (optional but recommended)

## 🔐 Convex Auth Setup (CRITICAL)

**⚠️ IMPORTANT**: Convex Auth requires specific environment variables to be set on both development and production deployments. This is a common source of authentication errors.

### Development Environment Setup

1. **Start Convex Development Server**:

    ```bash
    npx convex dev
    ```

    - This automatically sets up your development environment
    - Creates a development deployment if needed
    - Sets `CONVEX_DEPLOYMENT` environment variable
    - Provides the development Convex URL

2. **Initialize Convex Auth for Development**:

    ```bash
    npx @convex-dev/auth
    ```

    - This will prompt for your development site URL (e.g., `http://localhost:5173`)
    - Automatically generates and sets `JWT_PRIVATE_KEY` and `JWKS`
    - Sets `SITE_URL` for development

3. **Verify Development Environment Variables**:

    ```bash
    npx convex env list
    ```

    You should see:

    - `SITE_URL=http://localhost:5173` (or your dev URL)
    - `JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...`
    - `JWKS={"keys":[...]}`

### Production Environment Setup

1. **Initialize Convex Auth for Production**:

    ```bash
    npx @convex-dev/auth --prod
    ```

    - This will prompt for your production site URL (e.g., `https://yourdomain.com`)
    - Automatically generates and sets `JWT_PRIVATE_KEY` and `JWKS` for production
    - Sets `SITE_URL` for production
    - **Automatically detects and uses your production Convex URL**

2. **Verify Production Environment Variables**:

    ```bash
    npx convex env list --prod
    ```

    You should see:

    - `SITE_URL=https://yourdomain.com` (or your prod URL)
    - `JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...`
    - `JWKS={"keys":[...]}`

3. **Deploy Convex Backend to Production**:

    ```bash
    npx convex deploy
    ```

4. **Get Your Production Convex URL**:

    ```bash
    npx convex env list --prod
    ```

    Look for the `VITE_CONVEX_URL` or note the URL from the deployment output.

### Troubleshooting Convex Auth

#### Common Error: `[CONVEX A(auth:signIn)] Server Error`

**Symptoms**:

- Authentication fails with server error
- Error occurs during sign-in process
- No specific error details in browser console

**Root Cause**: Missing or incorrect environment variables on production deployment.

**Solution**:

1. Check if environment variables are set on production:

    ```bash
    npx convex env list --prod
    ```

2. If variables are missing, run the production setup:

    ```bash
    npx @convex-dev/auth --prod
    ```

3. Redeploy Convex backend:

    ```bash
    npx convex deploy
    ```

#### Environment Variable Mismatch

**Problem**: Variables set on dev but not on production deployment.

**Solution**: Always run both development and production setup commands.

#### Manual Environment Variable Setup (Alternative)

If the automatic setup fails, you can manually set variables:

1. **Generate JWT Keys**:

    ```bash
    node generateKeys.mjs
    ```

2. **Set Environment Variables**:

    ```bash
    npx convex env set SITE_URL https://yourdomain.com --prod
    npx convex env set JWT_PRIVATE_KEY "your-private-key" --prod
    npx convex env set JWKS "your-jwks" --prod
    ```

## 🔧 Coolify Deployment Steps

### Step 1: Access Your Coolify Dashboard

1. Navigate to your Coolify instance
2. Log in with your credentials
3. Go to the "Applications" section

### Step 2: Create New Application

1. Click "New Application" or "Create Application"
2. Select "Application" (not service)
3. Choose "GitHub" as your Git provider
4. Connect your GitHub account if not already connected

### Step 3: Configure Repository

1. **Repository**: Select your repository
2. **Branch**: `main` (or your default branch)
3. **Build Pack**: Select "Nixpacks" (automatic detection)

### Step 4: Application Settings

#### Basic Configuration

- **Application Name**: Choose your preferred name
- **Port**: `3000` (Nixpacks will auto-detect this)
- **Build Command**: Leave empty (Nixpacks auto-detects from package.json)
- **Start Command**: Leave empty (Nixpacks auto-detects from package.json)

#### Environment Variables

**⚠️ CRITICAL**: You must set the `VITE_CONVEX_URL` environment variable in your deployment platform.

Add these environment variables:

```
NODE_ENV=production
VITE_CONVEX_URL=<your-production-convex-url>
```

**To get your production Convex URL**:

1. Run `npx convex env list --prod` to see your deployment URL
2. Or check the output from `npx convex deploy` for the URL
3. The URL format will be: `https://<deployment-name>.convex.cloud`

**Where to set VITE_CONVEX_URL**:

- **Coolify**: In the Environment Variables section of your application settings
- **Vercel**: In the Environment Variables section of your project settings
- **Netlify**: In the Environment Variables section of your site settings
- **Railway**: In the Variables section of your service
- **Any other platform**: Look for "Environment Variables" or "Build Environment" settings

#### Resource Limits (Optional)

- **CPU**: 0.5 - 1.0 cores
- **Memory**: 512MB - 1GB
- **Storage**: 1GB

### Step 5: Domain Configuration (Optional)

1. **Domain**: Add your custom domain
2. **SSL**: Enable automatic SSL certificate
3. **Force HTTPS**: Enable redirect from HTTP to HTTPS

### Step 6: Deploy

1. Click "Deploy" or "Save and Deploy"
2. Monitor the build process in the logs
3. Wait for deployment to complete

## 🔍 Post-Deployment Verification

### Check Application Health

1. Visit your application URL
2. Verify the FitFlow Pro logo appears
3. **Test the authentication flow** (critical step)
4. Check that workouts can be created and saved

### Monitor Logs

1. In Coolify dashboard, go to your application
2. Check the "Logs" tab for any errors
3. Monitor resource usage

## 🛠️ Troubleshooting

### Common Issues

#### Build Fails

- Check if package.json has proper build scripts
- Verify all dependencies are in package.json
- Check build logs for specific errors
- Ensure Nixpacks is selected as build pack

#### Application Won't Start

- Verify port 3000 is exposed (Nixpacks auto-detects)
- Check environment variables are set correctly
- Review application logs
- Ensure package.json has proper start script

#### Convex Connection Issues

- Verify VITE_CONVEX_URL is set correctly
- Check if Convex deployment is active
- Test Convex connection from browser console

#### Authentication Errors

- **Most Common**: `[CONVEX A(auth:signIn)] Server Error`
- **Solution**: Follow the Convex Auth Setup section above
- **Check**: Environment variables on both dev and prod deployments
- **Verify**: SITE_URL matches your actual domain

### Debug Commands

```bash
# Check if application is running
curl -I http://your-domain.com

# Check environment variables
echo $NODE_ENV
echo $VITE_CONVEX_URL

# Check Convex environment variables
npx convex env list --prod

# Check application logs
docker logs <container-name>
```

## 🔄 Continuous Deployment

### Automatic Deployments

1. Enable "Auto Deploy" in Coolify
2. Push changes to your main branch
3. Coolify will automatically rebuild and deploy

### Manual Deployments

1. Go to your application in Coolify
2. Click "Redeploy" button
3. Monitor the deployment process

## 📊 Monitoring

### Health Checks

- Set up health check endpoint (optional)
- Monitor application uptime
- Set up alerts for downtime

### Performance Monitoring

- Monitor CPU and memory usage
- Check response times
- Set up logging aggregation

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **SSL**: Always use HTTPS in production
3. **Updates**: Keep dependencies updated
4. **Backups**: Regular backups of your data
5. **Convex Auth**: Keep JWT keys secure and rotate if needed

## 📞 Support

If you encounter issues:

1. Check Coolify documentation
2. Review application logs
3. Verify Convex deployment status
4. **Check Convex Auth environment variables**
5. Check GitHub repository for issues

## 🎉 Success!

Once deployed, your FitFlow Pro application will be available at your configured domain and ready for users to track their fitness journey!

### Final Checklist

- [ ] Convex development server running (`npx convex dev`)
- [ ] Convex Auth initialized for development
- [ ] Convex Auth initialized for production
- [ ] Environment variables verified on both deployments
- [ ] Convex backend deployed to production
- [ ] Production Convex URL obtained and set in Coolify
- [ ] Coolify application deployed successfully
- [ ] Authentication flow tested and working
- [ ] Application functionality verified
