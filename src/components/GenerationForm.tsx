import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bot,
  Building,
  Cpu,
  Loader2,
  Paintbrush,
  Sparkles,
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
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  companyInfo: z
    .string()
    .min(10, {
      message: 'A informação da empresa deve ter pelo menos 10 caracteres.',
    })
    .max(500, {
      message: 'A informação da empresa não pode exceder 500 caracteres.',
    }),
  carouselTheme: z
    .string()
    .min(5, {
      message: 'O tema do carrossel deve ter pelo menos 5 caracteres.',
    })
    .max(100, {
      message: 'O tema do carrossel não pode exceder 100 caracteres.',
    }),
  model: z.string({
    required_error: 'Por favor, selecione um modelo de IA.',
  }),
});

interface GenerationFormProps {
  isLoading: boolean;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

export function GenerationForm({ isLoading, onSubmit }: GenerationFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyInfo: '',
      carouselTheme: '',
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
              name="companyInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-lg">
                    <Building className="mr-2 h-5 w-5" />
                    Sobre sua Empresa
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva sua empresa, seus valores e o que a torna única..."
                      className="resize-none"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A IA usará isso para personalizar o tom e a mensagem.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      placeholder="Ex: 'Lançamento de novo produto', 'Dicas de marketing digital', 'Benefícios do nosso serviço X'..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Seja específico para obter os melhores resultados.
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
