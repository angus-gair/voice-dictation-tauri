#!/bin/bash
# Development helper script to clean up port conflicts before starting dev server

set -e

echo "🔍 Checking for processes using port 1420..."

# Find and kill processes using port 1420
PIDS=$(lsof -ti :1420 2>/dev/null || true)

if [ -n "$PIDS" ]; then
    echo "⚠️  Found processes using port 1420: $PIDS"
    echo "🔪 Killing processes..."
    kill -9 $PIDS 2>/dev/null || true
    sleep 1
    echo "✅ Port 1420 is now free"
else
    echo "✅ Port 1420 is already free"
fi

# Verify port is free
if lsof -i :1420 >/dev/null 2>&1; then
    echo "❌ Error: Port 1420 is still in use"
    exit 1
fi

echo "🚀 Starting Tauri dev server..."
npm run tauri dev
