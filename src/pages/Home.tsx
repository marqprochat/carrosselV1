import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import { Loader2, Paintbrush } from "lucide-react"
import { toast } from "sonner"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { SlideCard } from "@/components/SlideCard"
import { GenerationForm } from "@/components/GenerationForm"
import { EditingPanel } from "@/components/EditingPanel"
import { ResponsiveSlideContainer } from "@/components/ResponsiveSlideContainer"
import { generateCarouselContent } from "@/lib/ai"
import { Slide, AspectRatio } from "@/types/slide"

const formSchema = z.object({
  carouselTheme: z.string(),
  model: z.string(),
  slideCount: z.coerce.number(),
})

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [slideCount, setSlideCount] = useState(5)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>({
    label: "Quadrado (1:1)",
    value: 1 / 1,
    name: "square",
  })

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api, slides])

  async function handleGenerate(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setSlides([])
    setSlideCount(values.slideCount)
    toast.info(`Gerando seu carrossel com ${values.model}...`, {
      description: "A IA está criando o conteúdo e buscando as imagens. Isso pode levar um momento.",
    })

    try {
      const generatedSlides = await generateCarouselContent(values.carouselTheme, values.model, values.slideCount)

      // Calcular posição centralizada baseada no aspect ratio
      const containerWidth = 800
      const containerHeight = containerWidth / aspectRatio.value
      const textWidth = 600
      const textHeight = 100
      
      // Posicionar o texto no início do container
      const textX = 0
      const textY = (containerHeight - textHeight) / 2

      const slidesWithStyles: Slide[] = generatedSlides.map((slide) => ({
        ...slide,
        fontFamily: "Inter, sans-serif",
        fontSize: 48,
        textAlign: "center",
        color: "#FFFFFF",
        backgroundColor: "#000000",
        backgroundOpacity: 0.5,
        position: { x: textX, y: textY },
        size: { width: textWidth, height: textHeight },
      }))

      setSlides(slidesWithStyles)
      toast.success("Seu carrossel foi gerado com sucesso!", {
        description: "Use o painel de edição para refinar o resultado.",
      })
    } catch (error: any) {
      console.error(error)
      toast.error("Ocorreu um erro ao gerar o carrossel.", {
        description: error.message || "Verifique suas chaves de API e tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSlides([])
    setCurrent(0)
    setCount(0)
    setSlideCount(5)
  }

  const handleSlideUpdate = (slideId: number, newProps: Partial<Slide>) => {
    setSlides((prevSlides) => prevSlides.map((s) => (s.id === slideId ? { ...s, ...newProps } : s)))
  }

  const handleSlideCountChange = (newCount: number) => {
    setSlideCount(newCount)
    
    if (newCount > slides.length) {
      // Adicionar slides
      const newSlides = [...slides]
      const containerWidth = 800
      const containerHeight = containerWidth / aspectRatio.value
      const textWidth = 600
      const textHeight = 100
      const textX = 0
      const textY = (containerHeight - textHeight) / 2

      for (let i = slides.length; i < newCount; i++) {
        newSlides.push({
          id: i + 1,
          text: `Slide ${i + 1}`,
          imageUrl: "",
          fontFamily: "Inter, sans-serif",
          fontSize: 48,
          textAlign: "center",
          color: "#FFFFFF",
          backgroundColor: "#000000",
          backgroundOpacity: 0.5,
          position: { x: textX, y: textY },
          size: { width: textWidth, height: textHeight },
          imageScale: 1,
          imageX: 0,
          imageY: 0,
          imageRotation: 0,
        })
      }
      setSlides(newSlides)
    } else if (newCount < slides.length) {
      // Remover slides
      setSlides(slides.slice(0, newCount))
      // Ajustar slide atual se necessário
      if (current > newCount) {
        setCurrent(newCount)
      }
    }
  }

  const slideRefs = useRef<React.RefObject<HTMLDivElement>[]>([])
  
  useEffect(() => {
    slideRefs.current = Array.from({ length: slides.length }, (_, i) => 
      slideRefs.current[i] || { current: null }
    )
  }, [slides.length])

  return (
    <div className="h-screen w-screen bg-background text-foreground">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <div className="flex h-full flex-col p-6">
            {slides.length === 0 ? (
              <GenerationForm isLoading={isLoading} onSubmit={handleGenerate} />
            ) : (
              <EditingPanel
                slides={slides}
                currentSlideIndex={current - 1}
                onSlidesChange={setSlides}
                onReset={handleReset}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                slideRefs={slideRefs.current}
                slideCount={slideCount}
                onSlideCountChange={handleSlideCountChange}
              />
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>
          <div className="flex h-full flex-col items-center justify-center bg-muted/40 p-8">
            {isLoading && (
              <div className="flex flex-col items-center text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-semibold">Criando magia...</h2>
                <p className="text-muted-foreground">Nossa IA está elaborando o conteúdo perfeito para você.</p>
              </div>
            )}
            {!isLoading && slides.length === 0 && (
              <div className="flex flex-col items-center text-center">
                <div className="p-6 bg-background/50 rounded-full mb-4 border">
                  <Paintbrush className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Pronto para criar?</h2>
                <p className="text-muted-foreground max-w-md">
                  Preencha as informações ao lado, escolha um modelo de IA e clique em "Gerar Carrossel" para ver a
                  mágica acontecer.
                </p>
              </div>
            )}
            {!isLoading && slides.length > 0 && (
              <div className="w-full h-full flex flex-col justify-center">
                <div className="w-full max-w-none mx-auto flex-1 flex flex-col justify-center">
                  <Carousel
                    setApi={setApi}
                    className="w-full h-full"
                    opts={{
                      watchDrag: false,
                    }}
                  >
                    <CarouselContent className="h-full">
                      {slides.map((slide, index) => (
                      <CarouselItem key={slide.id} className="h-full">
                      <div className="h-full flex items-center justify-center p-2 sm:p-4">
                      <ResponsiveSlideContainer aspectRatio={aspectRatio}>
                      <SlideCard 
                          slide={slide} 
                            onUpdate={handleSlideUpdate} 
                              aspectRatio={aspectRatio}
                                ref={slideRefs.current[index]}
                               />
                             </ResponsiveSlideContainer>
                           </div>
                         </CarouselItem>
                       ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
                <div className="text-center pt-4 flex-shrink-0">
                  <p className="text-sm text-muted-foreground">
                    Slide {current} de {count}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
