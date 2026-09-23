#!/usr/bin/env bash

set -e

echo "Setting up Authorization service..."

mkdir -p authorization
cd authorization

# Initialize package.json if it doesn't exist
if [ ! -f package.json ]; then
    npm init -y
fi

# Runtime dependencies
npm install express jsonwebtoken dotenv

# Development dependencies
npm install -D \
    typescript \
    tsx \
    @types/node \
    @types/express \
    @types/jsonwebtoken

# Create TypeScript configuration if missing
if [ ! -f tsconfig.json ]; then
    npx tsc --init
fi

echo "Authorization dependencies installed successfully."