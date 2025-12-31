import express from "express"
import cors from "cors"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import { upsertImage, getAllImages, getImage, deleteImage } from "./db.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
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

// Serve static files from the dist directory in production
// In production, server runs from dist-server/, frontend is in dist/
const distPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../dist')
  : path.join(__dirname, '../dist')

app.use(express.static(distPath))

// Get all images
app.get("/api/images", (req, res) => {
  try {
    const images = getAllImages.all()
    res.json(images)
  } catch (error) {
    console.error("Error fetching images:", error)
    res.status(500).json({ error: "Failed to fetch images" })
  }
})

// Get single image
app.get("/api/images/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (id < 0 || id >= 30) {
      return res.status(400).json({ error: "ID must be between 0 and 29" })
    }
    const image = getImage.get(id)
    if (!image) {
      return res.status(404).json({ error: "Image not found" })
    }
    res.json(image)
  } catch (error) {
    console.error("Error fetching image:", error)
    res.status(500).json({ error: "Failed to fetch image" })
  }
})

// Upload/update image
app.post("/api/images/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" })
    }

    const { slot } = req.body
    const slotId = slot !== undefined ? parseInt(slot) : undefined

    if (slotId !== undefined && (slotId < 0 || slotId >= 30)) {
      return res.status(400).json({ error: "Slot must be between 0 and 29" })
    }

    // Convert buffer to base64
    const base64Data = req.file.buffer.toString("base64")
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`

    // If no slot specified, find the next available slot (0-29)
    let targetSlot = slotId
    if (targetSlot === undefined) {
      const existingImages = getAllImages.all()
      const usedSlots = new Set(existingImages.map((img) => img.id))
      for (let i = 0; i < 30; i++) {
        if (!usedSlots.has(i)) {
          targetSlot = i
          break
        }
      }
      // If all slots are full, replace slot 0
      if (targetSlot === undefined) {
        targetSlot = 0
      }
    }

    upsertImage.run(
      targetSlot,
      dataUrl,
      req.file.originalname,
      req.file.mimetype
    )

    res.json({
      success: true,
      slot: targetSlot,
      filename: req.file.originalname,
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    res.status(500).json({ error: "Failed to upload image" })
  }
})

// Delete image endpoint
app.delete("/api/images/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (id < 0 || id >= 30) {
      return res.status(400).json({ error: "ID must be between 0 and 29" })
    }
    deleteImage.run(id)
    res.json({ success: true, message: `Image ${id} deleted` })
  } catch (error) {
    console.error("Error deleting image:", error)
    res.status(500).json({ error: "Failed to delete image" })
  }
})

// Serve frontend for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
