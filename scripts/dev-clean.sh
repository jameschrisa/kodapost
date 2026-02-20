#!/usr/bin/env bash
# dev-clean.sh — Nuke local caches and start fresh dev server
# Usage: ./scripts/dev-clean.sh  (or via npm: npm run dev:clean)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🧹 Clearing .next build cache..."
rm -rf .next

echo "🧹 Clearing node_modules/.cache..."
rm -rf node_modules/.cache

echo "🚀 Starting dev server..."
NODE_OPTIONS='--disable-warning=DEP0040' npx next dev
