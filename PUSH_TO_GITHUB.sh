#!/bin/bash
# Push Admin Dashboard to GitHub
# Repository: policyproadminmaster
# Username: jack108510

cd /Users/jack/admin-master

echo "🚀 Pushing admin dashboard to GitHub..."
echo ""

# Add remote repository
echo "Adding remote repository..."
git remote add origin https://github.com/jack108510/policyproadminmaster.git

# Rename branch to main if needed
git branch -M main

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Now enable GitHub Pages:"
echo "   https://github.com/jack108510/policyproadminmaster/settings/pages"
echo ""
echo "Your dashboard will be live at:"
echo "   https://jack108510.github.io/policyproadminmaster/"

