export type Slide = {
  id: number
  text: string
  imageUrl: string
  fontFamily: string
  fontSize: number
  textAlign: "left" | "center" | "right"
  color: string
  backgroundColor: string
  backgroundOpacity: number
  position: { x: number; y: number }
  size: { width: number | string; height: number | string }
  imageScale?: number
  imageX?: number
  imageY?: number
  imageRotation?: number
}

export type AspectRatio = {
  label: string
  value: number
  name: string
}
