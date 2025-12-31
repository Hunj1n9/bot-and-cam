import "dotenv/config"
import express from "express"
import cors from "cors"
import multer from "multer"
import pg from "pg"

const { Pool } = pg

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "spotify_visualiser",
  // Leave password undefined for local trust authentication
  ...(process.env.DB_PASSWORD && { password: process.env.DB_PASSWORD }),
  port: process.env.DB_PORT || 5432,
})

// Initialize database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        data TEXT NOT NULL,
        filename TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("✅ Database initialized")
  } catch (error) {
    console.error("❌ Database initialization error:", error)
  }
}

// Express app
const app = express()
const PORT = 3001

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

app.use(cors())
app.use(express.json())

// Get all images
app.get("/api/images", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM images ORDER BY id ASC")
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching images:", error)
    res.status(500).json({ error: "Failed to fetch images" })
  }
})

// Get single image
app.get("/api/images/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id) || id < 0) {
      return res.status(400).json({ error: "Invalid ID" })
    }
    const result = await pool.query("SELECT * FROM images WHERE id = $1", [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Image not found" })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching image:", error)
    res.status(500).json({ error: "Failed to fetch image" })
  }
})

// Upload/update image
app.post("/api/images/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" })
    }

    const { slot } = req.body
    const slotId = slot !== undefined ? parseInt(slot) : undefined

    if (slotId !== undefined && (isNaN(slotId) || slotId < 0)) {
      return res.status(400).json({ error: "Invalid slot ID" })
    }

    // Convert buffer to base64
    const base64Data = req.file.buffer.toString("base64")
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`

    // If slot specified, upsert to that slot. Otherwise, insert new row
    let targetId
    if (slotId !== undefined) {
      await pool.query(
        `INSERT INTO images (id, data, filename, mimetype)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           data = EXCLUDED.data,
           filename = EXCLUDED.filename,
           mimetype = EXCLUDED.mimetype,
           uploaded_at = CURRENT_TIMESTAMP`,
        [slotId, dataUrl, req.file.originalname, req.file.mimetype]
      )
      targetId = slotId
    } else {
      // Insert new image with auto-incrementing ID
      const result = await pool.query(
        `INSERT INTO images (data, filename, mimetype)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [dataUrl, req.file.originalname, req.file.mimetype]
      )
      targetId = result.rows[0].id
    }

    res.json({
      success: true,
      slot: targetId,
      filename: req.file.originalname,
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    res.status(500).json({ error: "Failed to upload image" })
  }
})

// Update image (PUT)
app.put("/api/images/:id", upload.single("image"), async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id) || id < 0) {
      return res.status(400).json({ error: "Invalid ID" })
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" })
    }

    // Convert buffer to base64
    const base64Data = req.file.buffer.toString("base64")
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`

    // Update or insert image
    const result = await pool.query(
      `INSERT INTO images (id, data, filename, mimetype)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         data = EXCLUDED.data,
         filename = EXCLUDED.filename,
         mimetype = EXCLUDED.mimetype,
         uploaded_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, dataUrl, req.file.originalname, req.file.mimetype]
    )

    res.json({
      success: true,
      image: result.rows[0],
    })
  } catch (error) {
    console.error("Error updating image:", error)
    res.status(500).json({ error: "Failed to update image" })
  }
})

// Delete image (DELETE)
app.delete("/api/images/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id) || id < 0) {
      return res.status(400).json({ error: "Invalid ID" })
    }

    const result = await pool.query("DELETE FROM images WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Image not found" })
    }

    res.json({
      success: true,
      message: `Image ${id} deleted successfully`,
      deleted: result.rows[0],
    })
  } catch (error) {
    console.error("Error deleting image:", error)
    res.status(500).json({ error: "Failed to delete image" })
  }
})

// Delete all images (DELETE)
app.delete("/api/images", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM images RETURNING *")
    res.json({
      success: true,
      message: `Deleted ${result.rowCount} images`,
      deleted: result.rows,
    })
  } catch (error) {
    console.error("Error deleting all images:", error)
    res.status(500).json({ error: "Failed to delete images" })
  }
})

// Start server
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on:`)
    console.log(`   - Local:   http://localhost:${PORT}`)
    console.log(`   - Network: http://192.168.81.45:${PORT}`)
  })
})
