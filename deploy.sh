#!/bin/bash
# deploy.sh — Push melioristgroup.com to GitHub → Cloudflare Pages auto-deploys
# Usage: ./deploy.sh "commit message"

MSG="${1:-Deploy: site update}"

cd "$(dirname "$0")"

git add -A
git commit -m "$MSG"
git push origin main

echo ""
echo "✓ Pushed. Cloudflare Pages deploys in ~60 seconds."
echo "  https://melioristgroup.com"
