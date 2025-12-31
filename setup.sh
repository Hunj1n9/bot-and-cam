#!/bin/bash

echo "🚀 Setting up Spotify Visualiser Upload Feature..."

# Step 1: Create PostgreSQL user and database
echo ""
echo "📦 Step 1: Setting up PostgreSQL..."
echo "Please run these commands manually:"
echo ""
echo "sudo -u postgres psql << EOF"
echo "CREATE USER hunjing WITH PASSWORD 'postgres';"
echo "ALTER USER hunjing CREATEDB;"
echo "CREATE DATABASE spotify_visualiser OWNER hunjing;"
echo "GRANT ALL PRIVILEGES ON DATABASE spotify_visualiser TO hunjing;"
echo "EOF"
echo ""

# Step 2: Check if database exists
echo "📦 Step 2: Checking database..."
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw spotify_visualiser; then
    echo "✅ Database spotify_visualiser exists"
else
    echo "⚠️  Database not found. Please run the commands above first."
fi

echo ""
echo "📦 Step 3: Installing npm packages..."
npm install pg express multer cors

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the app:"
echo "   Terminal 1: npm run server"
echo "   Terminal 2: npm run dev"
echo ""
echo "Or run both: npm run dev:all"
