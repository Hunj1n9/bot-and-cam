import * as THREE from "three"
import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"
import { Size } from "./types/types"

interface Props {
  scene: THREE.Scene
  sizes: Size
}

export default class Planes {
  scene: THREE.Scene
  geometry: THREE.PlaneGeometry
  material: THREE.ShaderMaterial
  mesh: THREE.InstancedMesh
  meshCount: number = 300
  sizes: Size

  constructor({ scene, sizes }: Props) {
    this.scene = scene
    this.sizes = sizes

    this.createGeometry()
    this.createMaterial()
    this.createInstancedMesh()
    this.fillMeshData()
  }

  createGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1.4, 1, 1)
  }

  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMaxXdisplacement: { value: this.sizes.width },
      },
    })
  }

  createInstancedMesh() {
    this.mesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.meshCount
    )
    this.scene.add(this.mesh)
  }

  fillMeshData() {
    const initialPosition = new Float32Array(this.meshCount * 3)
    const meshSpeed = new Float32Array(this.meshCount)

    for (let i = 0; i < this.meshCount; i++) {
      initialPosition[i * 3 + 0] = (Math.random() - 0.5) * this.sizes.width * 4 // x
      initialPosition[i * 3 + 1] = (Math.random() - 0.5) * this.sizes.height * 2 // y
      initialPosition[i * 3 + 2] = (Math.random() - 0.7) * 20 // z

      meshSpeed[i] = Math.random() * 0.5 + 0.5
    }

    this.geometry.setAttribute(
      "aInitialPosition",
      new THREE.InstancedBufferAttribute(initialPosition, 3)
    )
    this.geometry.setAttribute(
      "aMeshSpeed",
      new THREE.InstancedBufferAttribute(meshSpeed, 1)
    )
  }

  render(delta: number) {
    this.material.uniforms.uTime.value += delta * 0.1
  }
}
