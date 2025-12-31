import Database from "better-sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(path.join(__dirname, "images.db"))

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY CHECK (id >= 0 AND id < 30),
    data TEXT NOT NULL,
    filename TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Insert default placeholder images (1-30) if not exists
const insertDefault = db.prepare(`
  INSERT OR IGNORE INTO images (id, data, filename, mimetype)
  VALUES (?, ?, ?, ?)
`)

// You can populate with actual default images if needed
// For now, we'll leave it empty so users upload their own

export interface ImageRecord {
  id: number
  data: string // base64
  filename: string
  mimetype: string
  uploaded_at: string
}

export const getImage = db.prepare<number, ImageRecord>(
  "SELECT * FROM images WHERE id = ?"
)

export const getAllImages = db.prepare<[], ImageRecord>(
  "SELECT * FROM images ORDER BY id ASC"
)

export const upsertImage = db.prepare(`
  INSERT INTO images (id, data, filename, mimetype)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    data = excluded.data,
    filename = excluded.filename,
    mimetype = excluded.mimetype,
    uploaded_at = CURRENT_TIMESTAMP
`)

export const deleteImage = db.prepare("DELETE FROM images WHERE id = ?")

export default db
