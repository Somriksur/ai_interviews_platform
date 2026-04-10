#!/bin/bash

# Script to push code to GitHub repository
# Repository: https://github.com/Somriksur/ai_interviews_platform

echo "🚀 Pushing code to GitHub..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add remote (or update if exists)
echo "🔗 Setting up remote repository..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/Somriksur/ai_interviews_platform.git

# Add all files
echo "📝 Adding all files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Major update: Dynamic salary tiers, interview flow fixes, database cleanup tools, and bug fixes

- Implemented dynamic salary tier system (Low/Mid/High based on salary range)
- Fixed interview completion flow and dashboard filtering
- Added database cleanup tools and documentation
- Restored job profile → tag colleges → create drive workflow
- Fixed college name display in interview drives
- Added student email-based login linking
- Multiple bug fixes and improvements"

# Push to GitHub (force push to replace old code)
echo "🚀 Pushing to GitHub..."
git push -f origin main

# If main branch doesn't exist, try master
if [ $? -ne 0 ]; then
    echo "⚠️ Main branch failed, trying master..."
    git push -f origin master
fi

echo "✅ Done! Check your repository at: https://github.com/Somriksur/ai_interviews_platform"
