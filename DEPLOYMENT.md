# Deployment Guide

This guide explains how to push the project to GitHub and deploy it to Vercel.

## Prerequisites

1. **Node.js** (v18+) and npm installed
2. **Git** installed
3. **GitHub account** (free or paid)
4. **Vercel account** (free tier available at https://vercel.com)

## Step 1: Create a GitHub Repository

### Option A: Using GitHub Web UI

1. Go to https://github.com/new
2. Enter "expense-tracker" as the repository name
3. Add description: "Multi-platform expense tracking app with real-time analytics"
4. Choose **Public** or **Private** (both work with Vercel)
5. Do NOT initialize with README (we already have one)
6. Click **Create repository**

### Option B: Using GitHub CLI

```bash
gh repo create expense-tracker --public --source=. --remote=origin --push
```

## Step 2: Push Code to GitHub

### If you created the repo via web UI:

```bash
cd v:\Expense tracker

# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git

# Rename branch to main (optional but recommended)
git branch -M main

# Push the code
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### If you used GitHub CLI:
Your code is already pushed! You can verify with:
```bash
git remote -v
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```
   This will open a browser to authenticate.

3. **Deploy the Web App:**
   ```bash
   cd web
   vercel
   ```
   
   When prompted:
   - **Which scope do you want to deploy to?** → Select your account
   - **Link to existing project?** → No (first time)
   - **What's your project's name?** → `expense-tracker-web`
   - **In which directory is your code?** → `.` (current directory)
   - **Want to override the settings?** → No (unless you want to customize)

4. **Your app is now live!** 🎉
   - Vercel will provide a URL like `https://expense-tracker-web.vercel.app`

### Option B: Using Vercel Dashboard (GitHub Integration)

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. **Import from Git**:
   - Select **GitHub** as your Git provider
   - Search and select `expense-tracker` repository
4. **Configure Project**:
   - **Project Name**: `expense-tracker-web`
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `web/`
5. **Environment Variables** (if needed):
   - Add any `.env` variables required by your app
   - The `DATABASE_URL` should already be set via `.env.local`
6. Click **Deploy**

## Step 4: Set Up Environment Variables in Vercel

If you have environment variables (like `DATABASE_URL`):

### Via Vercel Dashboard:
1. Go to your project settings
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Your actual value
   - **Environments**: Select `Production`, `Preview`, `Development` as needed
4. Redeploy for changes to take effect

### Via Vercel CLI:
```bash
vercel env add DATABASE_URL
# (You'll be prompted to enter the value)
```

Then redeploy:
```bash
vercel --prod
```

## Step 5: Configure Auto-Deployment (Optional)

With GitHub integration, every push to `main` will auto-deploy. This is already enabled when you use the Vercel Dashboard integration.

To check/modify:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Git**
4. Verify "Vercel for GitHub" is connected

## Step 6: Test Your Deployment

1. Visit your Vercel URL: `https://expense-tracker-web.vercel.app` (or your custom domain)
2. Test the login functionality
3. Create a test expense to verify the backend is working
4. Check the Analytics page

## Helpful Links

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **GitHub Web**: https://github.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Custom Domain Setup**: https://vercel.com/docs/concepts/projects/domains

## Troubleshooting

### Build Fails on Vercel

- Check **Vercel Logs**: Go to project → **Deployments** → Select failed build → View logs
- Common issues:
  - Missing environment variables
  - Incorrect Node.js version
  - Type errors in TypeScript

### Site Shows 404 or Blank Page

- Verify `DATABASE_URL` is set in Vercel environment variables
- Check that the database is accessible from Vercel's servers
- Review the deployment logs for errors

### Can't Connect Mobile App to Deployed API

- Update the API base URL in the mobile app to match your Vercel URL:
  ```
  https://expense-tracker-web.vercel.app/api
  ```
- Ensure CORS is properly configured in the API

## Notes

- The free Vercel tier includes:
  - 100 GB bandwidth per month
  - 1000 function invocations per month
  - Serverless Functions up to 10 seconds
  - Good for this app's use case
  
- For production with higher traffic, consider upgrading to Hobby or Pro plan

---

**Your app is now live and automatically deploys on every GitHub push!** 🚀
