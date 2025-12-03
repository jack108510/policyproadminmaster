#!/bin/bash
# Quick Status Check Script

cd /Users/jack/admin-master

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GIT REPOSITORY STATUS CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if git repo
if [ ! -d ".git" ]; then
    echo "❌ ERROR: Not a git repository!"
    echo "   Run: git init"
    exit 1
fi
echo "✅ Git repository: OK"

# Check current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "📍 Current branch: $BRANCH"

# Check remote
echo ""
echo "Remote configuration:"
if git remote get-url origin &>/dev/null; then
    REMOTE_URL=$(git remote get-url origin)
    echo "✅ Remote 'origin' exists: $REMOTE_URL"
else
    echo "⚠️  No remote 'origin' configured"
fi

# Check for uncommitted changes
echo ""
echo "Uncommitted changes:"
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "✅ No uncommitted changes"
else
    echo "⚠️  You have uncommitted changes"
    echo "   Run: git status"
fi

# Check commits
echo ""
echo "Recent commits:"
git log --oneline -3 2>/dev/null || echo "   No commits yet"

# Test remote connection
echo ""
echo "Testing remote connection..."
if git remote get-url origin &>/dev/null; then
    git ls-remote --heads origin 2>&1 | head -3
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

