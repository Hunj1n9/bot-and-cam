-- Fix the auto-increment sequence to start after existing data
SELECT setval(
  pg_get_serial_sequence('images', 'id'),
  COALESCE((SELECT MAX(id) FROM images), 0) + 1,
  false
);
