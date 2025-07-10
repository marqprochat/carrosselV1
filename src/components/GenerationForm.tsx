import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bot,
  Cpu,
  Loader2,
  Paintbrush,
  Sparkles,
  Layers,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  carouselTheme: z
    .string()
    .min(10, {
      message: 'O tema do carrossel deve ter pelo menos 10 caracteres.',
    })
    .max(800, {
      message: 'O tema do carrossel não pode exceder 800 caracteres.',
    }),
  model: z.string({
    required_error: 'Por favor, selecione um modelo de IA.',
  }),
  slideCount: z.coerce.number().min(1, 'Mínimo 1 slide').max(10, 'Máximo 10 slides'),
});

interface GenerationFormProps {
  isLoading: boolean;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

export function GenerationForm({ isLoading, onSubmit }: GenerationFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carouselTheme: '',
      slideCount: 5,
    },
  });

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center space-x-2 mb-6">
        <Paintbrush className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Gerador de Carrossel IA</h1>
      </header>
      <Separator className="mb-6" />
      <div className="flex-grow overflow-y-auto pr-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <FormField
              control={form.control}
              name="carouselTheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-lg">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Tema do Carrossel
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: 'Quero um carrossel sobre estratégias de marketing digital para pequenas empresas. Inclua dicas práticas, ferramentas gratuitas, métricas importantes e como começar do zero. Foque em resultados rápidos e acionáveis.'..."
                      className="resize-none"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Seja detalhado sobre o que quer no carrossel. Quanto mais específico, melhor será o resultado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slideCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-lg">
                    <Layers className="mr-2 h-5 w-5" />
                    Quantidade de Slides
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      {...field}
                      className="w-32"
                    />
                  </FormControl>
                  <FormDescription>
                    Escolha quantos slides quer gerar (máximo 10).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-lg">
                    <Cpu className="mr-2 h-5 w-5" />
                    Modelo de IA
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo de IA" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Gemini">Gemini (Google)</SelectItem>
                      <SelectItem value="OpenAI">OpenAI (GPT-4)</SelectItem>
                      <SelectItem value="Groq">Groq (Llama 3)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Escolha qual motor de IA irá gerar o conteúdo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-2 h-4 w-4" />
              )}
              Gerar Carrossel
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
