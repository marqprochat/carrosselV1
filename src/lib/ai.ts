import { z } from 'zod';

const unsplashImageSchema = z.object({
  urls: z.object({
    regular: z.string().url(),
  }),
});

const unsplashResponseSchema = z.object({
  results: z.array(unsplashImageSchema),
});

const aiSlideSchema = z.object({
  text: z.string(),
  imageQuery: z.string(),
});

const aiResponseSchema = (slideCount: number) => z.object({
  slides: z.array(aiSlideSchema).min(slideCount).max(slideCount),
});

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

async function fetchImageForQuery(query: string): Promise<string> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('Unsplash API key is missing. Please set VITE_UNSPLASH_ACCESS_KEY in your .env.local file.');
    // Return a placeholder image if the key is missing
    return `https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2`;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status} - ${response.statusText}`);
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }
    const data = await response.json();
    const parsedData = unsplashResponseSchema.safeParse(data);

    if (parsedData.success && parsedData.data.results.length > 0) {
      return parsedData.data.results[0].urls.regular;
    } else {
      // Fallback image if no results found
      return `https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2`;
    }
  } catch (error) {
    console.error('Failed to fetch image from Unsplash:', error);
    // Fallback image on error
    return `https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2`;
  }
}

function getApiConfig(
  model: string,
  prompt: string
): { url: string; options: RequestInit } | null {
  switch (model) {
    case 'OpenAI': {
      const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      if (!OPENAI_API_KEY) return null;
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        },
      };
    }
    case 'Groq': {
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      if (!GROQ_API_KEY) return null;
      return {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        },
      };
    }
    case 'Gemini': {
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      if (!GEMINI_API_KEY) return null;
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: 'application/json',
            },
          }),
        },
      };
    }
    default:
      return null;
  }
}

export async function generateCarouselContent(
  carouselTheme: string,
  model: string,
  slideCount: number = 5
) {
  const prompt = `
    Você é um especialista em marketing digital e criação de conteúdo para redes sociais. Sua missão é criar carrosséis altamente engajadores e otimizados para plataformas como Instagram, LinkedIn e Facebook.

    Tema do Carrossel:
    "${carouselTheme}"

    INSTRUÇÕES ESPECÍFICAS:
    1. O PRIMEIRO SLIDE deve SEMPRE ser uma CAPA atrativa que desperte curiosidade e faça as pessoas quererem deslizar para ver o resto do carrossel.
    2. Use ganchos poderosos no primeiro slide: "Você sabia que...", "5 segredos para...", "A verdade sobre...", "Como eu descobri...", etc.
    3. Para os SLIDES 2-${slideCount}, crie textos mais explicativos e detalhados que desenvolvam o conteúdo.
    4. Use elementos visuais que chamem atenção (emojis quando relevantes).
    5. Estruture o carrossel de forma lógica: Capa → Desenvolvimento → Conclusão/CTA.
    6. Cada slide deve ter valor individual, mas formar uma narrativa coesa.
    7. Use técnicas de copywriting para manter o interesse.

    Sua resposta DEVE ser um objeto JSON válido. O objeto JSON deve conter uma única chave "slides", que é um array de ${slideCount} objetos. Cada objeto no array deve ter duas propriedades:
    1. "text": Para o SLIDE 1 (capa): máximo de 80 caracteres. Para os SLIDES 2-${slideCount}: máximo de 300 caracteres com conteúdo explicativo e detalhado.
    2. "imageQuery": Uma consulta de pesquisa concisa de 2 a 3 palavras em inglês para uma imagem de fundo relevante.

    Exemplo de formato de resposta:
    {
      "slides": [
        {
          "text": "🚀 5 Segredos de Marketing Digital",
          "imageQuery": "digital marketing"
        },
        {
          "text": "Segredo #1: Conheça profundamente seu público-alvo. Use ferramentas como Google Analytics e redes sociais para entender comportamentos, interesses e dores. Crie personas detalhadas para direcionar melhor sua estratégia.",
          "imageQuery": "target audience"
        },
        {
          "text": "Segredo #2: Invista em conteúdo de valor. Eduque, entretenha e solucione problemas do seu público. Conteúdo relevante gera confiança, autoridade e relacionamento duradouro com potenciais clientes.",
          "imageQuery": "content creation"
        }
      ]
    }
  `;

  const config = getApiConfig(model, prompt);
  if (!config) {
    throw new Error(`A chave de API para o modelo ${model} não foi encontrada.`);
  }

  const response = await fetch(config.url, config.options);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Erro na API de IA (${model}): ${response.statusText} - ${errorBody}`
    );
  }

  const json = await response.json();

  let content;
  if (model === 'Gemini') {
    content = JSON.parse(json.candidates[0].content.parts[0].text);
  } else {
    content = JSON.parse(json.choices[0].message.content);
  }

  const parsedAiResponse = aiResponseSchema(slideCount).safeParse(content);

  if (!parsedAiResponse.success) {
    console.error('Erro de validação Zod:', parsedAiResponse.error);
    throw new Error('A resposta da IA não corresponde ao formato esperado.');
  }

  const generatedSlides = parsedAiResponse.data.slides;

  const slidesWithImages = await Promise.all(
    generatedSlides.map(async (slide, index) => {
      const imageUrl = await fetchImageForQuery(slide.imageQuery);
      return {
        id: index + 1,
        text: slide.text,
        imageUrl: imageUrl,
      };
    })
  );

  return slidesWithImages;
}
