import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ImagePicker } from './ImagePicker';
import { Slide } from '@/types/slide';
import { Slider } from './ui/slider';

interface EditingPanelProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSlidesChange: (slides: Slide[]) => void;
  onReset: () => void;
}

const editFormSchema = z.object({
  text: z.string().min(1, 'O texto não pode estar vazio.'),
  imageUrl: z.string().url('Por favor, insira uma URL de imagem válida.'),
  fontFamily: z.string(),
  fontSize: z.coerce.number().min(8, 'Fonte muito pequena').max(128, 'Fonte muito grande'),
  textAlign: z.enum(['left', 'center', 'right']),
  color: z.string(),
  backgroundColor: z.string(),
  backgroundOpacity: z.coerce.number().min(0).max(1),
});

const fonts = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display, serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
];

export function EditingPanel({
  slides,
  currentSlideIndex,
  onSlidesChange,
  onReset,
}: EditingPanelProps) {
  const activeSlide = slides[currentSlideIndex];
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      text: '',
      imageUrl: '',
      fontFamily: 'Inter, sans-serif',
      fontSize: 48,
      textAlign: 'center',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      backgroundOpacity: 0.5,
    },
  });

  const watchedValues = form.watch();

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
      });
    }
  }, [activeSlide, form.reset]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (activeSlide && name) {
        const newSlides = slides.map((slide, index) => {
          if (index === currentSlideIndex) {
            const updatedSlide = { ...slide, ...value };
            if (name === 'backgroundOpacity') {
              updatedSlide.backgroundOpacity = Array.isArray(value.backgroundOpacity) ? value.backgroundOpacity[0] : value.backgroundOpacity;
            }
            return updatedSlide;
          }
          return slide;
        });
        onSlidesChange(newSlides);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, slides, onSlidesChange, currentSlideIndex, activeSlide]);

  const handleImageSelect = (url: string) => {
    form.setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
    setIsImagePickerOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center space-x-2 mb-6">
        <Palette className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Painel de Edição</h1>
      </header>
      <Separator className="mb-6" />
      <div className="flex-grow overflow-y-auto pr-4 -mr-4">
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma fonte" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fonts.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
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
                  <FormLabel className="flex items-center">
                    Alinhamento
                  </FormLabel>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={
                        watchedValues.textAlign === 'left'
                          ? 'secondary'
                          : 'outline'
                      }
                      size="icon"
                      onClick={() => form.setValue('textAlign', 'left')}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={
                        watchedValues.textAlign === 'center'
                          ? 'secondary'
                          : 'outline'
                      }
                      size="icon"
                      onClick={() => form.setValue('textAlign', 'center')}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={
                        watchedValues.textAlign === 'right'
                          ? 'secondary'
                          : 'outline'
                      }
                      size="icon"
                      onClick={() => form.setValue('textAlign', 'right')}
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
                      <Dialog
                        open={isImagePickerOpen}
                        onOpenChange={setIsImagePickerOpen}
                      >
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
                    </div>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Cole uma URL ou use o botão "Trocar".
                    </FormDescription>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (
          <p className="text-muted-foreground">
            Selecione um slide para editar.
          </p>
        )}
      </div>
      <Separator className="my-6" />
      <Button onClick={onReset} variant="outline">
        <Undo2 className="mr-2 h-4 w-4" />
        Criar Novo Carrossel
      </Button>
    </div>
  );
}
