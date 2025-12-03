# Policy Pro Master Admin Dashboard

A comprehensive admin dashboard for managing the Policy Pro ecosystem - companies, users, policies, and access codes.

## 🚀 Quick Start

This dashboard is ready to deploy to GitHub Pages!

### Live URL

Once deployed, your dashboard will be available at:
- `https://[your-username].github.io/admin-master/`

## 📁 Files

- `index.html` - Main admin dashboard
- `script.js` - Dashboard functionality
- `styles.css` - Styling
- `supabase-config.js` - Supabase configuration
- `test-functions.html` - Function testing page

## 🛠️ Features

- **Company Management** - Create and manage organizations
- **User Management** - Manage users across all companies
- **Policy Management** - View and manage all policies
- **Access Codes** - Generate and manage access codes
- **Analytics** - System-wide analytics and insights
- **Email Marketing** - Create and manage email campaigns
- **AI Policy Assistant** - Generate policies with AI

## 🔧 Configuration

Make sure to configure your Supabase credentials in `supabase-config.js` before deploying.

## 📦 Deployment

### Deploy to GitHub Pages

1. Create a new repository on GitHub named `admin-master`
2. Push this code to the repository
3. Go to Settings → Pages
4. Select "Deploy from a branch" → `main` → `/ (root)`
5. Wait 1-2 minutes for deployment

### Manual Setup

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Admin dashboard"

# Add remote (replace with your GitHub username)
git remote add origin https://github.com/[your-username]/admin-master.git
git branch -M main
git push -u origin main
```

## 🌐 Access

After deployment, access your dashboard at:
- `https://[your-username].github.io/admin-master/index.html`

Or simply:
- `https://[your-username].github.io/admin-master/` (index.html loads automatically)

## 🔐 Security

- Ensure Supabase Row Level Security (RLS) is properly configured
- Never commit sensitive API keys
- Use environment variables for production

## 📝 License

Private - Internal Use Only

