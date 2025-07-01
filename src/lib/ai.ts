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

const aiResponseSchema = z.object({
  slides: z.array(aiSlideSchema).min(5).max(5),
});

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

async function fetchImageForQuery(query: string): Promise<string> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('Unsplash API key is missing.');
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
  companyInfo: string,
  carouselTheme: string,
  model: string
) {
  const prompt = `
    Você é um especialista em marketing de mídia social. Com base nas seguintes informações sobre uma empresa e um tema desejado, gere o conteúdo para um carrossel de 5 slides para redes sociais.

    Informações da Empresa:
    "${companyInfo}"

    Tema do Carrossel:
    "${carouselTheme}"

    Sua resposta DEVE ser um objeto JSON válido. O objeto JSON deve conter uma única chave "slides", que é um array de 5 objetos. Cada objeto no array deve ter duas propriedades:
    1. "text": Um texto curto e envolvente para o slide (máximo de 150 caracteres).
    2. "imageQuery": Uma consulta de pesquisa concisa de 2 a 3 palavras para uma imagem de fundo relevante para este slide.

    Exemplo de formato de resposta:
    {
      "slides": [
        {
          "text": "Este é o texto para o slide 1.",
          "imageQuery": "reunião de negócios"
        },
        {
          "text": "Este é o texto para o slide 2.",
          "imageQuery": "tecnologia inovadora"
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

  const parsedAiResponse = aiResponseSchema.safeParse(content);

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
