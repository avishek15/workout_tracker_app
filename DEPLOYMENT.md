# 🚀 FitFlow Pro - Coolify Deployment Guide

This guide will help you deploy FitFlow Pro on Coolify using Nixpacks for automatic build detection.

## 📋 Prerequisites

1. **Coolify Instance**: Access to a Coolify server
2. **GitHub Repository**: Your code is in `https://github.com/avishek15/workout_tracker_app`
3. **Convex Backend**: Already deployed at `dazzling-snake-548`
4. **Domain**: A domain name for your application (optional but recommended)

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

1. **Repository**: Select `avishek15/workout_tracker_app`
2. **Branch**: `main` (or your default branch)
3. **Build Pack**: Select "Nixpacks" (automatic detection)

### Step 4: Application Settings

#### Basic Configuration

- **Application Name**: `fitflow-pro` (or your preferred name)
- **Port**: `3000` (Nixpacks will auto-detect this)
- **Build Command**: Leave empty (Nixpacks auto-detects from package.json)
- **Start Command**: Leave empty (Nixpacks auto-detects from package.json)

#### Environment Variables

Add these environment variables:

```
NODE_ENV=production
VITE_CONVEX_URL=https://dazzling-snake-548.convex.cloud
```

#### Resource Limits (Optional)

- **CPU**: 0.5 - 1.0 cores
- **Memory**: 512MB - 1GB
- **Storage**: 1GB

### Step 5: Domain Configuration (Optional)

1. **Domain**: Add your custom domain (e.g., `fitflow-pro.yourdomain.com`)
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
3. Test the authentication flow
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

### Debug Commands

```bash
# Check if application is running
curl -I http://your-domain.com

# Check environment variables
echo $NODE_ENV
echo $VITE_CONVEX_URL

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

## 📞 Support

If you encounter issues:

1. Check Coolify documentation
2. Review application logs
3. Verify Convex deployment status
4. Check GitHub repository for issues

## 🎉 Success!

Once deployed, your FitFlow Pro application will be available at your configured domain and ready for users to track their fitness journey!
