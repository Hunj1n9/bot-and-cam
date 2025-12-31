#!/bin/bash
# Setup script for PostgreSQL database

echo "🗄️  Setting up PostgreSQL database for Spotify Visualiser..."
echo ""

sudo -u postgres psql << 'EOF'
CREATE DATABASE spotify_visualiser;
\c spotify_visualiser
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY CHECK (id >= 0 AND id < 30),
  data TEXT NOT NULL,
  filename TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\q
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "Now you can run:"
    echo "  npm run dev:all"
else
    echo ""
    echo "❌ Database setup failed. Please check PostgreSQL is running."
fi
