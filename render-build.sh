#!/usr/bin/env bash
# Build script for Render.com

# Install dependencies
npm install

# Build the frontend
npm run build

# The server will serve the built frontend from dist/
