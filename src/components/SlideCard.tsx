import { forwardRef, useState, useEffect } from "react"
import { Rnd } from "react-rnd"
import { Card, CardContent } from "@/components/ui/card"
import { AspectRatio } from "./ui/aspect-ratio"
import { Slide, AspectRatio as AspectRatioType } from "@/types/slide"
interface SlideCardProps {
  slide: Slide
  onUpdate: (slideId: number, newProps: Partial<Slide>) => void
  aspectRatio: AspectRatioType
}

function hexToRgba(hex: string, opacity: number): string {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    return `rgba(0,0,0,${opacity})`
  }
  let c: any = hex.substring(1).split("")
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]]
  }
  c = "0x" + c.join("")
  return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",")},${opacity})`
}

export const SlideCard = forwardRef<HTMLDivElement, SlideCardProps>(({ slide, onUpdate, aspectRatio }, ref) => {
  const textBackground = hexToRgba(slide.backgroundColor, slide.backgroundOpacity)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [tempPosition, setTempPosition] = useState({ x: slide.imageX || 0, y: slide.imageY || 0 })

  // Validar posição inicial para evitar que o texto saia do slide
  const getValidatedPosition = () => {
    // Usar apenas validação mínima, deixar o Rnd lidar com os limites
    const x = Math.max(0, slide.position.x)
    const y = Math.max(0, slide.position.y)
    return { x, y }
  }

  useEffect(() => {
    if (!isDragging) {
      setTempPosition({ x: slide.imageX || 0, y: slide.imageY || 0 })
    }
  }, [slide.imageX, slide.imageY, isDragging])

  const imageStyle = {
    transform: `
      scale(${slide.imageScale || 1})
      translate(${tempPosition.x}px, ${tempPosition.y}px)
      rotate(${slide.imageRotation || 0}deg)
    `,
    transformOrigin: "center center",
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    setTempPosition({
      x: (slide.imageX || 0) + deltaX,
      y: (slide.imageY || 0) + deltaY,
    })
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Aplicar snap-back se estiver muito fora do container
    const maxOffset = 100
    const finalX = Math.max(-maxOffset, Math.min(maxOffset, tempPosition.x))
    const finalY = Math.max(-maxOffset, Math.min(maxOffset, tempPosition.y))

    onUpdate(slide.id, {
      imageX: finalX,
      imageY: finalY,
    })

    setTempPosition({ x: finalX, y: finalY })
  }

  return (
    <Card
      ref={ref}
      className="overflow-hidden w-full h-full shadow-lg border-0 relative max-w-full max-h-full rounded-none"
    >
      <CardContent className="p-0 w-full h-full">
        <AspectRatio ratio={aspectRatio.value} className="bg-muted relative w-full max-w-full max-h-full min-h-[400px]">
          <div
            className="absolute inset-0 overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={slide.imageUrl}
              alt={slide.text}
              className={`object-cover w-full h-full absolute inset-0 transition-transform duration-200 ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={imageStyle}
              onMouseDown={handleMouseDown}
              draggable={false}
            />
          </div>
          <Rnd
            size={{ width: slide.size.width, height: slide.size.height }}
            position={getValidatedPosition()}
            onDragStop={(_, d) => {
              const parentElement = d.node.parentElement
              if (!parentElement) return

              const parentWidth = parentElement.clientWidth
              const elementWidth = d.node.clientWidth
              const maxX = parentWidth - elementWidth
              const minX = 0
              const limitedX = Math.max(minX, Math.min(maxX, d.x))
              onUpdate(slide.id, { position: { x: limitedX, y: d.y } })
            }}
            onResizeStop={(_, _direction, ref, _delta, position) => {
              const parentElement = ref.parentElement
              if (!parentElement) return

              const parentWidth = parentElement.clientWidth
              const newWidth = parseFloat(ref.style.width)
              const constrainedWidth = Math.min(newWidth, parentWidth)

              onUpdate(slide.id, {
                size: { width: `${constrainedWidth}px`, height: ref.style.height },
                position,
              })
            }}
            maxWidth="100%"
            className="flex items-center justify-center border-2 border-dashed border-transparent hover:border-primary transition-colors"
            minWidth={60}
            minHeight={40}
          >
            <div
              style={{
                backgroundColor: textBackground,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                padding: "8px 16px",
                width: "100%",
                height: "100%",
                minWidth: "fit-content",
                minHeight: "fit-content",
              }}
            >
              <p
                style={{
                  fontFamily: slide.fontFamily,
                  fontSize: `clamp(8px, ${Math.max(16, slide.fontSize * 0.6)}px, ${slide.fontSize}px)`,
                  color: slide.color,
                  textAlign: slide.textAlign,
                  lineHeight: 1.2,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
                className="font-bold"
              >
                {slide.text || "Texto do slide"}
              </p>
            </div>
          </Rnd>
        </AspectRatio>
      </CardContent>
    </Card>
  )
})
