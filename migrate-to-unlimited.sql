-- Migration script to remove 30 image limit
-- This will drop the old table and create a new one with SERIAL id

-- Backup existing data
CREATE TABLE IF NOT EXISTS images_backup AS SELECT * FROM images;

-- Drop old table
DROP TABLE IF EXISTS images;

-- Create new table without limit
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  data TEXT NOT NULL,
  filename TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restore data (if any existed)
INSERT INTO images (data, filename, mimetype, uploaded_at)
SELECT data, filename, mimetype, uploaded_at FROM images_backup
ORDER BY id;

-- Drop backup table
DROP TABLE images_backup;

-- Show result
SELECT COUNT(*) as total_images FROM images;
