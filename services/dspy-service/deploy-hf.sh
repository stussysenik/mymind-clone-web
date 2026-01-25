#!/bin/bash
# Deploy DSPy Content Service to Hugging Face Spaces
#
# Prerequisites:
# 1. Install HF CLI: pip install huggingface_hub
# 2. Login: huggingface-cli login
# 3. Set your HF_USERNAME below

set -e

# Configuration - UPDATE THIS
HF_USERNAME="${HF_USERNAME:-your-hf-username}"
SPACE_NAME="dspy-content-service"

echo "=== DSPy Service → Hugging Face Spaces Deployment ==="
echo ""

# Check if huggingface-cli is installed
if ! command -v huggingface-cli &> /dev/null; then
    echo "❌ huggingface-cli not found. Install with: pip install huggingface_hub"
    exit 1
fi

# Check if logged in
if ! huggingface-cli whoami &> /dev/null; then
    echo "❌ Not logged in to Hugging Face. Run: huggingface-cli login"
    exit 1
fi

HF_USERNAME=$(huggingface-cli whoami | head -1)
echo "✓ Logged in as: $HF_USERNAME"

# Create Space if it doesn't exist
echo ""
echo "Creating/updating Space: $HF_USERNAME/$SPACE_NAME"

# Initialize git if needed
if [ ! -d ".git" ]; then
    git init
fi

# Add HF remote
HF_REMOTE="https://huggingface.co/spaces/$HF_USERNAME/$SPACE_NAME"
if git remote | grep -q "hf"; then
    git remote set-url hf "$HF_REMOTE"
else
    git remote add hf "$HF_REMOTE"
fi

# Create the space via API if it doesn't exist
echo ""
echo "Ensuring Space exists..."
huggingface-cli repo create "$SPACE_NAME" --type space --space-sdk docker 2>/dev/null || true

# Commit and push
echo ""
echo "Pushing to Hugging Face Spaces..."
git add .
git commit -m "Deploy DSPy Content Service" --allow-empty
git push hf main --force

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "🚀 Your service is deploying at:"
echo "   https://huggingface.co/spaces/$HF_USERNAME/$SPACE_NAME"
echo ""
echo "📡 Service URL (for Vercel env):"
echo "   https://$HF_USERNAME-$SPACE_NAME.hf.space"
echo ""
echo "⚙️  Don't forget to add secrets in Space Settings:"
echo "   - ZHIPU_API_KEY"
echo ""
echo "⏱️  First build may take 2-5 minutes. Cold starts ~10-30s."
