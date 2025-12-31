import "dotenv/config"
import fs from "fs"
import path from "path"
import pg from "pg"
import { fileURLToPath } from "url"

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "spotify_visualiser",
  ...(process.env.DB_PASSWORD && { password: process.env.DB_PASSWORD }),
  port: process.env.DB_PORT || 5432,
})

async function uploadInitialImages() {
  try {
    console.log("🚀 Starting initial image upload...")

    const coversDir = path.join(__dirname, "public", "covers")

    // Check if directory exists
    if (!fs.existsSync(coversDir)) {
      console.error(`❌ Directory not found: ${coversDir}`)
      process.exit(1)
    }

    // Upload images 0-29
    for (let i = 0; i < 30; i++) {
      const filename = `image_${i}.jpg`
      const filepath = path.join(coversDir, filename)

      if (!fs.existsSync(filepath)) {
        console.warn(`⚠️  File not found: ${filename}, skipping...`)
        continue
      }

      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(filepath)
      const base64Data = fileBuffer.toString("base64")
      const dataUrl = `data:image/jpeg;base64,${base64Data}`

      // Insert into database
      await pool.query(
        `INSERT INTO images (id, data, filename, mimetype)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           data = EXCLUDED.data,
           filename = EXCLUDED.filename,
           mimetype = EXCLUDED.mimetype,
           uploaded_at = CURRENT_TIMESTAMP`,
        [i, dataUrl, filename, "image/jpeg"]
      )

      console.log(`✅ Uploaded: Slot ${i} - ${filename}`)
    }

    console.log("\n🎉 All images uploaded successfully!")
    await pool.end()
  } catch (error) {
    console.error("❌ Error uploading images:", error)
    await pool.end()
    process.exit(1)
  }
}

uploadInitialImages()
