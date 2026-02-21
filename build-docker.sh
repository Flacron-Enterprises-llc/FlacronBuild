#!/bin/bash

# Bash script to build Docker image with Firebase environment variables
# Usage: ./build-docker.sh

set -e

IMAGE_TAG="${1:-flacronbuild:latest}"

echo "Building Docker image: $IMAGE_TAG"

# Read .env file and extract VITE_FIREBASE_* variables
BUILD_ARGS=()

if [ -f .env ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        if [[ "$line" =~ ^VITE_FIREBASE_ ]] && [[ ! "$line" =~ ^# ]]; then
            # Remove quotes if present
            line=$(echo "$line" | sed "s/^['\"]//; s/['\"]$//")
            BUILD_ARGS+=("--build-arg")
            BUILD_ARGS+=("$line")
            echo "  Found: $(echo $line | cut -d'=' -f1)"
        fi
    done < .env
else
    echo "Warning: .env file not found"
fi

if [ ${#BUILD_ARGS[@]} -eq 0 ]; then
    echo "Warning: No VITE_FIREBASE_* variables found"
    echo "Building without Firebase config - app may show white page"
    docker build -t "$IMAGE_TAG" .
else
    echo "Building with Firebase environment variables..."
    docker build -t "$IMAGE_TAG" "${BUILD_ARGS[@]}" .
fi

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Docker build failed"
    exit 1
fi

