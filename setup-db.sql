-- Create database
CREATE DATABASE spotify_visualiser;

-- Connect to the database
\c spotify_visualiser

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY CHECK (id >= 0 AND id < 30),
  data TEXT NOT NULL,
  filename TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images(uploaded_at);

-- Show tables
\dt
