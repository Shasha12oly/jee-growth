#!/bin/bash

# JEE Growth Tracker - Build Script for Render Deployment

echo "Starting JEE Growth Tracker build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Build the application
echo "Building application..."
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "Build successful! dist directory created."
    ls -la dist/
else
    echo "Build failed! dist directory not found."
    exit 1
fi

# Copy necessary files to root for Render static serving
echo "Copying build files to root..."
cp -r dist/* . 2>/dev/null || true

echo "Build process completed successfully!"
echo "Application is ready for deployment."
