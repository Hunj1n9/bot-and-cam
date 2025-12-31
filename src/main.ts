import "./style.css"
import Canvas from "./canvas"
import { ImageUploader } from "./uploader"

class App {
  canvas: Canvas
  uploader: ImageUploader

  constructor() {
    this.canvas = new Canvas()

    // Initialize image uploader with callback to reload images when uploaded
    this.uploader = new ImageUploader(() => {
      // Reload canvas images when new images are uploaded
      this.canvas.reloadImages()
    })

    this.render()
  }

  render() {
    this.canvas.render()
    requestAnimationFrame(this.render.bind(this))
  }
}

export default new App()
