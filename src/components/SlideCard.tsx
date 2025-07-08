import { forwardRef, useRef } from "react"
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

  return (
    <Card ref={ref} className="overflow-hidden w-full h-full shadow-lg border-0 relative max-w-full max-h-full rounded-none">
      <CardContent className="p-0 w-full h-full">
        <AspectRatio ratio={aspectRatio.value} className="bg-muted relative w-full max-w-full max-h-full">
          <img
            src={slide.imageUrl}
            alt={slide.text}
            className="object-cover w-full h-full absolute inset-0 pointer-events-none"
          />
          <Rnd
            size={{ width: slide.size.width, height: slide.size.height }}
            position={{ x: slide.position.x, y: slide.position.y }}
            onDragStop={(e, d) => {
              onUpdate(slide.id, { position: { x: d.x, y: d.y } })
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              onUpdate(slide.id, {
                size: { width: ref.style.width, height: ref.style.height },
                position,
              })
            }}
            bounds="parent"
            className="flex items-center justify-center border-2 border-dashed border-transparent hover:border-primary transition-colors"
          >
            <div
              style={{
                backgroundColor: textBackground,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0px",
              }}
            >
              <p
                style={{
                  fontFamily: slide.fontFamily,
                  fontSize: `clamp(12px, ${Math.max(16, slide.fontSize * 0.6)}px, ${slide.fontSize}px)`,
                  color: slide.color,
                  textAlign: slide.textAlign,
                  lineHeight: 1.2,
                }}
                className="w-full font-bold p-1 sm:p-2 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl"
              >
                {slide.text}
              </p>
            </div>
          </Rnd>
        </AspectRatio>
      </CardContent>
    </Card>
  )
})
