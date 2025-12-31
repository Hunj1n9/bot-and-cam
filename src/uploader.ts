export class ImageUploader {
  private container: HTMLElement
  private dropzone: HTMLElement
  private fileInput: HTMLInputElement
  private uploadButton: HTMLElement
  private statusText: HTMLElement
  private imageList: HTMLElement
  private floatingButton: HTMLElement
  private onUploadComplete?: () => void

  constructor(onUploadComplete?: () => void) {
    this.onUploadComplete = onUploadComplete
    this.createUI()
    this.createFloatingButton()
    this.setupEventListeners()
    this.updateImageCount()
    this.loadImageList()
  }

  private createUI() {
    // Create container
    this.container = document.createElement("div")
    this.container.id = "upload-container"
    this.container.className = "upload-container"

    // Create dropzone
    this.dropzone = document.createElement("div")
    this.dropzone.id = "dropzone"
    this.dropzone.className = "dropzone"
    this.dropzone.innerHTML = `
      <div class="dropzone-content">
        <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="dropzone-text">Drag & drop image here or click to browse</p>
        <p class="dropzone-subtext">Supports JPG, PNG, GIF (max 5MB)</p>
      </div>
    `

    // Create hidden file input
    this.fileInput = document.createElement("input")
    this.fileInput.type = "file"
    this.fileInput.accept = "image/*"
    this.fileInput.style.display = "none"

    // Create upload button
    this.uploadButton = document.createElement("button")
    this.uploadButton.className = "upload-button"
    this.uploadButton.textContent = "Or Click to Upload"

    // Create status text
    this.statusText = document.createElement("p")
    this.statusText.className = "status-text"
    this.statusText.textContent = "Loading..."

    // Create image list container
    this.imageList = document.createElement("div")
    this.imageList.className = "image-list"
    this.imageList.innerHTML = `
      <h3 class="image-list-title">Uploaded Images</h3>
      <div class="image-grid"></div>
    `

    // Create close button
    const closeButton = document.createElement("button")
    closeButton.className = "close-button"
    closeButton.textContent = "×"
    closeButton.onclick = () => this.hide()

    // Assemble UI
    this.container.appendChild(closeButton)
    this.container.appendChild(this.dropzone)
    this.container.appendChild(this.uploadButton)
    this.container.appendChild(this.statusText)
    this.container.appendChild(this.imageList)
    this.container.appendChild(this.fileInput)

    document.body.appendChild(this.container)
  }

  private createFloatingButton() {
    this.floatingButton = document.createElement("button")
    this.floatingButton.className = "floating-upload-btn"
    this.floatingButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    `
    this.floatingButton.title = "Upload Images"
    this.floatingButton.onclick = () => this.toggle()

    document.body.appendChild(this.floatingButton)
  }

  private setupEventListeners() {
    // Dropzone click
    this.dropzone.addEventListener("click", () => {
      this.fileInput.click()
    })

    // Upload button click
    this.uploadButton.addEventListener("click", () => {
      this.fileInput.click()
    })

    // File input change
    this.fileInput.addEventListener("change", (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        this.handleFiles(Array.from(files))
      }
    })

    // Drag and drop
    this.dropzone.addEventListener("dragover", (e) => {
      e.preventDefault()
      this.dropzone.classList.add("dragover")
    })

    this.dropzone.addEventListener("dragleave", () => {
      this.dropzone.classList.remove("dragover")
    })

    this.dropzone.addEventListener("drop", (e) => {
      e.preventDefault()
      this.dropzone.classList.remove("dragover")
      const files = Array.from(e.dataTransfer?.files || [])
      this.handleFiles(files.filter((f) => f.type.startsWith("image/")))
    })

    // Keyboard shortcut (U key to toggle upload UI)
    document.addEventListener("keydown", (e) => {
      if (e.key === "u" || e.key === "U") {
        this.toggle()
      }
      if (e.key === "Escape" && this.container.classList.contains("visible")) {
        this.hide()
      }
    })
  }

  private async handleFiles(files: File[]) {
    if (files.length === 0) return

    for (const file of files) {
      await this.uploadFile(file)
    }
  }

  private async cropImageToSquare(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        // Show crop preview modal
        this.showCropPreview(img, url, (croppedBlob) => {
          if (croppedBlob) {
            resolve(croppedBlob)
          } else {
            reject(new Error('Crop cancelled'))
          }
        })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  private showCropPreview(img: HTMLImageElement, url: string, callback: (blob: Blob | null) => void) {
    // Create modal overlay
    const modal = document.createElement('div')
    modal.className = 'crop-modal'
    modal.innerHTML = `
      <div class="crop-modal-content">
        <h3>Adjust Image Position</h3>
        <div class="crop-preview-container">
          <canvas class="crop-preview-canvas"></canvas>
        </div>
        <div class="crop-controls">
          <button class="crop-btn crop-cancel">Cancel</button>
          <button class="crop-btn crop-confirm">Upload</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    const canvas = modal.querySelector('.crop-preview-canvas') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!

    // Set canvas size for preview (square)
    const previewSize = Math.min(400, window.innerWidth - 40)
    canvas.width = previewSize
    canvas.height = previewSize

    // Calculate scale to cover the entire square (not just fit)
    // We want the smaller dimension of the image to exactly fill the preview
    const scaleX = previewSize / img.width
    const scaleY = previewSize / img.height
    const scale = Math.max(scaleX, scaleY)  // Use max to cover, not fit

    // Calculate display dimensions
    const displayWidth = img.width * scale
    const displayHeight = img.height * scale

    // Initial position (centered)
    let offsetX = (previewSize - displayWidth) / 2
    let offsetY = (previewSize - displayHeight) / 2

    // Drag state
    let isDragging = false
    let startX = 0
    let startY = 0
    let lastOffsetX = offsetX
    let lastOffsetY = offsetY

    const redraw = () => {
      ctx.clearRect(0, 0, previewSize, previewSize)

      // Draw the full image scaled
      ctx.drawImage(
        img,
        0, 0, img.width, img.height,
        offsetX, offsetY, displayWidth, displayHeight
      )

      // Draw border around crop area (no overlay - we want to see exactly what will be cropped)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, previewSize - 2, previewSize - 2)
    }

    redraw()

    // Mouse/touch events for dragging
    canvas.addEventListener('pointerdown', (e) => {
      isDragging = true
      startX = e.clientX
      startY = e.clientY
      lastOffsetX = offsetX
      lastOffsetY = offsetY
      canvas.style.cursor = 'grabbing'
    })

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return

      const dx = e.clientX - startX
      const dy = e.clientY - startY

      // Update offset with bounds checking
      offsetX = Math.min(0, Math.max(previewSize - displayWidth, lastOffsetX + dx))
      offsetY = Math.min(0, Math.max(previewSize - displayHeight, lastOffsetY + dy))

      redraw()
    })

    window.addEventListener('pointerup', () => {
      isDragging = false
      canvas.style.cursor = 'grab'
    })

    canvas.style.cursor = 'grab'

    // Cancel button
    modal.querySelector('.crop-cancel')?.addEventListener('click', () => {
      URL.revokeObjectURL(url)
      document.body.removeChild(modal)
      callback(null)
    })

    // Confirm button
    modal.querySelector('.crop-confirm')?.addEventListener('click', () => {
      // Step 1: Create a temporary canvas that draws the image exactly like the preview
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')!

      tempCanvas.width = previewSize
      tempCanvas.height = previewSize

      // Draw the image exactly as shown in the preview (same as redraw function)
      tempCtx.drawImage(
        img,
        0, 0, img.width, img.height,
        offsetX, offsetY, displayWidth, displayHeight
      )

      // Step 2: Now scale this exact preview to 512x512
      const finalCanvas = document.createElement('canvas')
      const finalCtx = finalCanvas.getContext('2d')!
      const targetSize = 512

      finalCanvas.width = targetSize
      finalCanvas.height = targetSize

      // Copy the preview canvas and scale it to 512x512
      finalCtx.drawImage(
        tempCanvas,
        0, 0, previewSize, previewSize,
        0, 0, targetSize, targetSize
      )

      finalCanvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        document.body.removeChild(modal)
        callback(blob)
      }, 'image/jpeg', 0.95)
    })
  }

  private async uploadFile(file: File) {
    try {
      this.setStatus(`Processing ${file.name}...`, "loading")

      // Crop image to square 1:1 ratio
      const croppedBlob = await this.cropImageToSquare(file)

      this.setStatus(`Uploading ${file.name}...`, "loading")

      const formData = new FormData()
      formData.append("image", croppedBlob, file.name)
      // Don't send slot, let server auto-assign ID

      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/images/upload'
        : '/api/images/upload'

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      this.setStatus(
        `✓ Uploaded: ${result.filename} (ID: ${result.slot})`,
        "success"
      )

      // Update count
      await this.updateImageCount()

      // Reload image list
      await this.loadImageList()

      // Notify parent
      if (this.onUploadComplete) {
        this.onUploadComplete()
      }

      // Clear file input
      this.fileInput.value = ""
    } catch (error) {
      console.error("Upload error:", error)
      this.setStatus(`✗ Upload failed: ${error}`, "error")
    }
  }

  private async updateImageCount() {
    try {
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/images'
        : '/api/images'
      const response = await fetch(apiUrl)
      const images = await response.json()

      this.statusText.textContent = `Total images: ${images.length}`
    } catch (error) {
      console.error("Failed to fetch image count:", error)
    }
  }

  private async loadImageList() {
    try {
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/images'
        : '/api/images'

      const response = await fetch(apiUrl)
      const images = await response.json()

      const grid = this.imageList.querySelector('.image-grid') as HTMLElement
      if (!grid) return

      if (images.length === 0) {
        grid.innerHTML = '<p class="no-images">No images uploaded yet</p>'
        return
      }

      grid.innerHTML = images.map((img: any) => `
        <div class="image-item">
          <img src="${img.data}" alt="Slot ${img.id}" class="image-thumbnail" />
          <div class="image-info">
            <span class="image-slot">Slot ${img.id}</span>
            <span class="image-filename">${img.filename}</span>
          </div>
          <button class="delete-image-btn" data-id="${img.id}" title="Delete image">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      `).join('')

      // Add delete button event listeners
      const deleteButtons = grid.querySelectorAll('.delete-image-btn')
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = (e.currentTarget as HTMLElement).dataset.id
          if (id) {
            this.deleteImage(parseInt(id))
          }
        })
      })
    } catch (error) {
      console.error("Failed to load image list:", error)
    }
  }

  private async deleteImage(id: number) {
    if (!confirm(`Delete image in slot ${id}?`)) {
      return
    }

    try {
      this.setStatus(`Deleting slot ${id}...`, "loading")

      const apiUrl = import.meta.env.DEV
        ? `http://localhost:3001/api/images/${id}`
        : `/api/images/${id}`

      const response = await fetch(apiUrl, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`)
      }

      this.setStatus(`✓ Deleted image ${id}`, "success")

      // Update count and reload list
      await this.updateImageCount()
      await this.loadImageList()

      // Notify parent to reload
      if (this.onUploadComplete) {
        this.onUploadComplete()
      }
    } catch (error) {
      console.error("Delete error:", error)
      this.setStatus(`✗ Delete failed: ${error}`, "error")
    }
  }

  private setStatus(message: string, type: "loading" | "success" | "error") {
    this.statusText.textContent = message
    this.statusText.className = `status-text ${type}`

    if (type === "success" || type === "error") {
      setTimeout(async () => {
        await this.updateImageCount()
        this.statusText.className = "status-text"
      }, 3000)
    }
  }

  show() {
    this.container.classList.add("visible")
  }

  hide() {
    this.container.classList.remove("visible")
  }

  toggle() {
    this.container.classList.toggle("visible")
  }
}
