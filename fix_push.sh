#!/bin/bash
# Fix Git Push Issues Script

cd /Users/jack/admin-master

echo "🔧 Troubleshooting Git Push Issues..."
echo ""

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository!"
    echo "   Run: git init"
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Remove existing remote if it exists
echo "Checking for existing remote..."
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' already exists"
    read -p "   Remove and recreate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove origin
        echo "✅ Removed existing remote"
    fi
else
    echo "✅ No existing remote"
fi

# Check current branch
echo ""
echo "Current branch:"
git branch --show-current

# Ensure we're on main branch
echo ""
echo "Ensuring we're on 'main' branch..."
git branch -M main 2>/dev/null || git checkout -b main 2>/dev/null

# Check for uncommitted changes
echo ""
echo "Checking for uncommitted changes..."
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes"
    read -p "   Commit them now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "Update files before push"
        echo "✅ Changes committed"
    fi
fi

# Add remote
echo ""
echo "Adding remote repository..."
git remote add origin https://github.com/jack108510/policyproadminmaster.git 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Remote added successfully"
else
    echo "⚠️  Remote may already exist or there was an error"
fi

# Show remote info
echo ""
echo "Remote configuration:"
git remote -v

# Check commits
echo ""
echo "Recent commits:"
git log --oneline -3

# Try to push
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Attempting to push to GitHub..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Your code has been pushed!"
    echo ""
    echo "Next steps:"
    echo "1. Enable GitHub Pages:"
    echo "   https://github.com/jack108510/policyproadminmaster/settings/pages"
    echo ""
    echo "2. Your dashboard will be live at:"
    echo "   https://jack108510.github.io/policyproadminmaster/"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo ""
    echo "1. Repository doesn't exist on GitHub:"
    echo "   Create it at: https://github.com/new"
    echo "   Name: policyproadminmaster"
    echo ""
    echo "2. Authentication required:"
    echo "   - Set up SSH keys, OR"
    echo "   - Use Personal Access Token"
    echo ""
    echo "3. Check the error message above for details"
    echo ""
    echo "See TROUBLESHOOT_PUSH.md for detailed solutions"
fi

