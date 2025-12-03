# Setup Guide - Admin Master Dashboard

## 🎯 Quick Setup Instructions

Follow these steps to deploy your admin dashboard to GitHub Pages.

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `policyproadminmaster`
3. Description: `Policy Pro Master Admin Dashboard`
4. Visibility: **Private** (recommended for admin dashboards)
5. Do NOT initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Step 2: Initialize and Push Code

Run these commands in your terminal:

```bash
# Navigate to the admin-master directory
cd /Users/jack/admin-master

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Admin dashboard for GitHub Pages"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/policyproadminmaster.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username (e.g., `jack108510`)

### Step 3: Enable GitHub Pages

1. Go to your repository: `https://github.com/YOUR_USERNAME/policyproadminmaster`
2. Click **Settings** tab
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**:
   - Select: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **Save**

### Step 4: Wait for Deployment

- Wait 1-2 minutes for GitHub to build and deploy
- Check the **Actions** tab to see deployment status

### Step 5: Access Your Dashboard

Your dashboard will be live at:
- **URL**: `https://YOUR_USERNAME.github.io/policyproadminmaster/`
- Example: `https://jack108510.github.io/policyproadminmaster/`

## ✅ What's Configured

- ✅ All admin dashboard files copied
- ✅ `supabase-config.js` included and paths updated
- ✅ `.nojekyll` file created (for proper static file serving)
- ✅ README.md created
- ✅ Paths updated for root-level deployment

## 🔧 Configuration

### Supabase Setup

The `supabase-config.js` file is already configured. If you need to update credentials:

1. Edit `supabase-config.js`
2. Update `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Commit and push changes:
   ```bash
   git add supabase-config.js
   git commit -m "Update Supabase configuration"
   git push origin main
   ```

## 🚨 Troubleshooting

### 404 Error After Deployment
- Wait a few more minutes (deployment can take 2-5 minutes)
- Check the **Actions** tab for deployment errors
- Verify GitHub Pages is enabled in Settings → Pages

### Blank Page
- Open browser developer tools (F12)
- Check Console tab for JavaScript errors
- Verify Supabase credentials are correct

### CORS Errors
- Check that Supabase RLS (Row Level Security) allows your domain
- Add your GitHub Pages URL to Supabase allowed origins

## 📝 Next Steps

1. Test all dashboard features
2. Configure Supabase RLS policies
3. Set up environment-specific configurations if needed

## 🔐 Security Notes

- Keep repository private if it contains admin access
- Review Supabase RLS policies
- Never commit sensitive API keys or tokens
- Regularly update dependencies

