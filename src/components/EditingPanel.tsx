import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Image as ImageIcon,
  Text,
  Undo2,
  Palette,
  Replace,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  CaseSensitive,
  PaintBucket,
  Sparkles,
  Download,
} from "lucide-react"
import { useEffect, useState } from "react"
import html2canvas from "html2canvas"
import JSZip from "jszip"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "./ui/separator"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ImagePicker } from "./ImagePicker"
import { ImageUrlExtractor } from "./ImageUrlExtractor"
import { Slide, AspectRatio } from "@/types/slide"
import { Slider } from "./ui/slider"

interface EditingPanelProps {
  slides: Slide[]
  currentSlideIndex: number
  onSlidesChange: (slides: Slide[]) => void
  onReset: () => void
  aspectRatio: AspectRatio
  onAspectRatioChange: (aspectRatio: AspectRatio) => void
  slideRefs?: React.RefObject<HTMLDivElement>[]
  slideCount: number
  onSlideCountChange: (count: number) => void
}

const editFormSchema = z.object({
  text: z.string().min(1, "O texto não pode estar vazio."),
  imageUrl: z.string().url("Por favor, insira uma URL de imagem válida."),
  fontFamily: z.string(),
  fontSize: z.coerce.number().min(8, "Fonte muito pequena").max(128, "Fonte muito grande"),
  textAlign: z.enum(["left", "center", "right"]),
  color: z.string(),
  backgroundColor: z.string(),
  backgroundOpacity: z.coerce.number().min(0).max(1),
  imageScale: z.coerce.number().min(0.1).max(5),
  imageX: z.coerce.number(),
  imageY: z.coerce.number(),
  imageRotation: z.coerce.number().min(-180).max(180),
})

const fonts = [
  { name: "Anton", value: "Anton, sans-serif" },
  { name: "Bebas Neue", value: "Bebas Neue, sans-serif" },
  { name: "Crimson Text", value: "Crimson Text, serif" },
  { name: "DM Sans", value: "DM Sans, sans-serif" },
  { name: "Dancing Script", value: "Dancing Script, cursive" },
  { name: "Fira Sans", value: "Fira Sans, sans-serif" },
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Karla", value: "Karla, sans-serif" },
  { name: "Lato", value: "Lato, sans-serif" },
  { name: "Libre Baskerville", value: "Libre Baskerville, serif" },
  { name: "Merriweather", value: "Merriweather, serif" },
  { name: "Montserrat", value: "Montserrat, sans-serif" },
  { name: "Nunito", value: "Nunito, sans-serif" },
  { name: "Open Sans", value: "Open Sans, sans-serif" },
  { name: "Oswald", value: "Oswald, sans-serif" },
  { name: "PT Sans", value: "PT Sans, sans-serif" },
  { name: "Pacifico", value: "Pacifico, cursive" },
  { name: "Playfair Display", value: "Playfair Display, serif" },
  { name: "Poppins", value: "Poppins, sans-serif" },
  { name: "Quicksand", value: "Quicksand, sans-serif" },
  { name: "Raleway", value: "Raleway, sans-serif" },
  { name: "Roboto", value: "Roboto, sans-serif" },
  { name: "Rubik", value: "Rubik, sans-serif" },
  { name: "Source Sans Pro", value: "Source Sans Pro, sans-serif" },
  { name: "Ubuntu", value: "Ubuntu, sans-serif" },
  { name: "Work Sans", value: "Work Sans, sans-serif" },
]

const aspectRatios: AspectRatio[] = [
  { label: "Quadrado (1:1)", value: 1 / 1, name: "square" },
  { label: "Retrato (4:5)", value: 4 / 5, name: "portrait" },
  { label: "Paisagem (16:9)", value: 16 / 9, name: "landscape" },
  { label: "Story (9:16)", value: 9 / 16, name: "story" },
  { label: "Retângulo (3:2)", value: 3 / 2, name: "rectangle" },
]

export function EditingPanel({
  slides,
  currentSlideIndex,
  onSlidesChange,
  onReset,
  aspectRatio,
  onAspectRatioChange,
  slideRefs,
  slideCount,
  onSlideCountChange,
}: EditingPanelProps) {
  const activeSlide = slides[currentSlideIndex]
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      text: "",
      imageUrl: "",
      fontFamily: "Inter, sans-serif",
      fontSize: 48,
      textAlign: "center",
      color: "#FFFFFF",
      backgroundColor: "#000000",
      backgroundOpacity: 0.5,
      imageScale: 1,
      imageX: 0,
      imageY: 0,
      imageRotation: 0,
    },
  })

  const watchedValues = form.watch()

  useEffect(() => {
    if (activeSlide) {
      form.reset({
        text: activeSlide.text,
        imageUrl: activeSlide.imageUrl,
        fontFamily: activeSlide.fontFamily,
        fontSize: activeSlide.fontSize,
        textAlign: activeSlide.textAlign,
        color: activeSlide.color,
        backgroundColor: activeSlide.backgroundColor,
        backgroundOpacity: activeSlide.backgroundOpacity,
        imageScale: activeSlide.imageScale || 1,
        imageX: activeSlide.imageX || 0,
        imageY: activeSlide.imageY || 0,
        imageRotation: activeSlide.imageRotation || 0,
      })
    }
  }, [activeSlide, form.reset])

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (activeSlide && name) {
        const newSlides = slides.map((slide, index) => {
          if (index === currentSlideIndex) {
            const updatedSlide = { ...slide, ...value }
            if (name === "backgroundOpacity") {
              updatedSlide.backgroundOpacity = Array.isArray(value.backgroundOpacity)
                ? value.backgroundOpacity[0]
                : value.backgroundOpacity
            }
            return updatedSlide
          }
          return slide
        })
        onSlidesChange(newSlides)
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch, slides, onSlidesChange, currentSlideIndex, activeSlide])

  const handleImageSelect = (url: string) => {
    form.setValue("imageUrl", url, { shouldDirty: true, shouldValidate: true })
    setIsImagePickerOpen(false)
  }

  const handleExportAllSlides = async () => {
    if (!slideRefs || slideRefs.length === 0) {
      console.error("Nenhuma referência de slide encontrada")
      return
    }

    setIsExporting(true)
    try {
      const zipFile = new JSZip()
      let successCount = 0

      console.log(`Tentando exportar ${slides.length} slides...`)

      for (let i = 0; i < slides.length; i++) {
        const slideRef = slideRefs[i]
        console.log(`Processando slide ${i + 1}:`, slideRef?.current)

        if (slideRef?.current) {
          try {
            // Aguardar um pouco para garantir que o DOM esteja renderizado
            await new Promise((resolve) => setTimeout(resolve, 100))

            const canvas = await html2canvas(slideRef.current, {
              backgroundColor: null,
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: true,
            })

            console.log(`Canvas criado para slide ${i + 1}:`, canvas.width, "x", canvas.height)

            // Converter para blob ao invés de base64
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => {
                resolve(blob!)
              }, "image/png")
            })

            zipFile.file(`slide-${i + 1}.png`, blob)
            successCount++
            console.log(`Slide ${i + 1} adicionado ao ZIP`)
          } catch (error) {
            console.error(`Erro ao processar slide ${i + 1}:`, error)
          }
        } else {
          console.warn(`Referência não encontrada para slide ${i + 1}`)
        }
      }

      console.log(`${successCount} slides processados com sucesso`)

      if (successCount === 0) {
        console.error("Nenhum slide foi processado com sucesso")
        return
      }

      console.log("Gerando arquivo ZIP...")
      const content = await zipFile.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6,
        },
      })

      console.log("ZIP gerado, tamanho:", content.size)

      const link = document.createElement("a")
      link.href = URL.createObjectURL(content)
      link.download = "carrossel-slides.zip"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      console.log("Download iniciado")
    } catch (error) {
      console.error("Erro ao exportar slides:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center space-x-2 mb-6">
        <Palette className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Painel de Edição</h1>
      </header>
      <Separator className="mb-6" />
      <div className="flex-grow overflow-y-auto pr-4 -mr-4">
        <div className="space-y-6">
          <div>
            <Label className="text-lg font-semibold">Proporção do Slide</Label>
            <Select
              value={aspectRatio.name}
              onValueChange={(value) => {
                const selectedRatio = aspectRatios.find((r) => r.name === value)
                if (selectedRatio) {
                  onAspectRatioChange(selectedRatio)
                }
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione a proporção" />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ratio) => (
                  <SelectItem key={ratio.name} value={ratio.name}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-lg font-semibold">Quantidade de Slides</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min="1"
                max="10"
                value={slideCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (value >= 1 && value <= 10) {
                    onSlideCountChange(value)
                  }
                }}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                (máximo 10 slides)
              </span>
            </div>
          </div>

          <Separator />

          {activeSlide ? (
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-lg">
                        <Text className="mr-2 h-5 w-5" />
                        Texto do Slide
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={5} className="resize-none" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Type className="mr-2 h-4 w-4" /> Fonte
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma fonte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {fonts.map((font) => (
                               <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                 {font.name}
                               </SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fontSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <CaseSensitive className="mr-2 h-4 w-4" /> Tamanho
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel className="flex items-center">Alinhamento</FormLabel>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={watchedValues.textAlign === "left" ? "secondary" : "outline"}
                        size="icon"
                        onClick={() => form.setValue("textAlign", "left")}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={watchedValues.textAlign === "center" ? "secondary" : "outline"}
                        size="icon"
                        onClick={() => form.setValue("textAlign", "center")}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={watchedValues.textAlign === "right" ? "secondary" : "outline"}
                        size="icon"
                        onClick={() => form.setValue("textAlign", "right")}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Sparkles className="mr-2 h-4 w-4" /> Cor do Texto
                        </FormLabel>
                        <FormControl>
                          <Input type="color" {...field} className="p-0 h-10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <PaintBucket className="mr-2 h-4 w-4" /> Cor do Fundo
                        </FormLabel>
                        <FormControl>
                          <Input type="color" {...field} className="p-0 h-10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="backgroundOpacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opacidade do Fundo</FormLabel>
                        <FormControl>
                          <Slider
                            defaultValue={[field.value]}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={1}
                            step={0.05}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center text-lg">
                      <ImageIcon className="mr-2 h-5 w-5" />
                      Imagem de Fundo
                      </FormLabel>
                      <div className="flex gap-2">
                      <Dialog open={isImagePickerOpen} onOpenChange={setIsImagePickerOpen}>
                      <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Replace className="mr-2 h-4 w-4" />
                          Trocar
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                          <ImagePicker onImageSelect={handleImageSelect} />
                          </DialogContent>
                          </Dialog>
                           <ImageUrlExtractor 
                             onImagesExtracted={(images) => {
                               // Add all extracted images to available slides
                               const newSlides = [...slides];
                               images.forEach((imageUrl, index) => {
                                 if (index < newSlides.length) {
                                   newSlides[index] = { ...newSlides[index], imageUrl };
                                 }
                               });
                               onSlidesChange(newSlides);
                             }}
                           />
                         </div>
                       </div>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Cole uma URL ou use o botão "Trocar".</FormDescription>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Manipulação da Imagem</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="imageScale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escala</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={0.1}
                                max={5}
                                step={0.1}
                              />
                              <div className="text-sm text-muted-foreground text-center">
                                {field.value.toFixed(1)}x
                              </div>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageRotation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rotação</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={-180}
                                max={180}
                                step={1}
                              />
                              <div className="text-sm text-muted-foreground text-center">
                                {field.value}°
                              </div>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="imageX"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posição X</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={-200}
                                max={200}
                                step={1}
                              />
                              <div className="text-sm text-muted-foreground text-center">
                                {field.value}px
                              </div>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageY"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posição Y</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={-200}
                                max={200}
                                step={1}
                              />
                              <div className="text-sm text-muted-foreground text-center">
                                {field.value}px
                              </div>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("imageScale", 1)
                        form.setValue("imageX", 0)
                        form.setValue("imageY", 0)
                        form.setValue("imageRotation", 0)
                      }}
                    >
                      Resetar Posição
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentScale = form.getValues("imageScale")
                        const currentX = form.getValues("imageX")
                        const currentY = form.getValues("imageY")
                        
                        // Calcular snap-back para que a imagem fique dentro do container
                        const maxOffset = 50 // Limite para snap-back
                        const newX = Math.max(-maxOffset, Math.min(maxOffset, currentX))
                        const newY = Math.max(-maxOffset, Math.min(maxOffset, currentY))
                        const newScale = Math.max(0.8, Math.min(1.2, currentScale))
                        
                        form.setValue("imageX", newX)
                        form.setValue("imageY", newY)
                        form.setValue("imageScale", newScale)
                      }}
                    >
                      Ajustar ao Container
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          ) : (
            <p className="text-muted-foreground">Selecione um slide para editar.</p>
          )}
        </div>
      </div>
      <Separator className="my-6" />
      <div className="flex gap-4">
        <Button onClick={onReset} variant="outline" className="flex-1">
          <Undo2 className="mr-2 h-4 w-4" />
          Criar Novo Carrossel
        </Button>
        <Button
          onClick={handleExportAllSlides}
          disabled={isExporting || !slideRefs || slideRefs.length === 0}
          className="flex-1"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exportando..." : "Exportar"}
        </Button>
      </div>
    </div>
  )
}
