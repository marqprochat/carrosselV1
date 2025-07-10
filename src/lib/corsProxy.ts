import { htmlCache, imageUrlCache } from './cache';

// Alternative CORS proxy service with multiple fallbacks
export interface CorsProxyService {
  name: string;
  url: (targetUrl: string) => string;
  parseResponse: (data: any) => string;
  headers?: HeadersInit;
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

export const corsProxyServices: CorsProxyService[] = [
  {
    name: 'AllOrigins',
    url: (targetUrl: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
    parseResponse: (data: any) => data.contents,
    headers: {
      'Accept': 'application/json',
      'User-Agent': getRandomUserAgent(),
      'Referer': 'https://google.com',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  },
  {
    name: 'CORS.SH',
    url: (targetUrl: string) => `https://cors.sh/${targetUrl}`,
    parseResponse: (data: any) => data,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'User-Agent': getRandomUserAgent(),
      'Referer': 'https://google.com',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  },
  {
    name: 'Proxy CORS',
    url: (targetUrl: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    parseResponse: (data: any) => data,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'User-Agent': getRandomUserAgent(),
      'Referer': 'https://google.com',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
    }
  },
  {
    name: 'CORS Proxy',
    url: (targetUrl: string) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    parseResponse: (data: any) => data,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'User-Agent': getRandomUserAgent(),
      'Referer': 'https://google.com',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'DNT': '1',
      'Connection': 'keep-alive'
    }
  },
  {
    name: 'Proxy.rs',
    url: (targetUrl: string) => `https://proxy.cors.sh/${targetUrl}`,
    parseResponse: (data: any) => data,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'User-Agent': getRandomUserAgent(),
      'Referer': 'https://google.com',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
    }
  },
  {
    name: 'Crossorigin.me',
    url: (targetUrl: string) => `https://crossorigin.me/${targetUrl}`,
    parseResponse: (data: any) => data,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': getRandomUserAgent(),
      'Referer': 'https://google.com',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
    }
  },
  {
    name: 'ThingProxy',
    url: (targetUrl: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(targetUrl)}`,
    parseResponse: (data: any) => data,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': getRandomUserAgent(),
      'Referer': 'https://google.com',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
    }
  }
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithCorsProxy = async (url: string, maxRetries = 3): Promise<string> => {
  // Verifica cache primeiro
  const cached = htmlCache.get(url);
  if (cached) {
    console.log(`🎯 Cache hit para: ${url}`);
    return cached;
  }

  let lastError: string | null = null;

  for (let serviceIndex = 0; serviceIndex < corsProxyServices.length; serviceIndex++) {
    const service = corsProxyServices[serviceIndex];
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        console.log(`🔄 Tentando ${service.name}${retry > 0 ? ` (tentativa ${retry + 1})` : ''}...`);
        const proxyUrl = service.url(url);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: service.headers || {},
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        
        if (!responseText) {
          throw new Error('Resposta vazia');
        }

        let htmlContent: string;
        
        try {
          // Try to parse as JSON first (for services like AllOrigins)
          const jsonData = JSON.parse(responseText);
          htmlContent = service.parseResponse(jsonData);
        } catch {
          // If not JSON, treat as HTML directly
          htmlContent = service.parseResponse(responseText);
        }
        
        if (htmlContent && htmlContent.length > 100) {
          console.log(`✅ Sucesso com ${service.name}${retry > 0 ? ` na tentativa ${retry + 1}` : ''}`);
          // Salva no cache
          htmlCache.set(url, htmlContent);
          return htmlContent;
        } else {
          throw new Error('Conteúdo HTML muito pequeno ou vazio');
        }
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        lastError = `${service.name}: ${errorMsg}`;
        console.warn(`❌ Falha com ${service.name}${retry > 0 ? ` (tentativa ${retry + 1})` : ''}:`, errorMsg);
        
        // Exponential backoff delay before retry
        if (retry < maxRetries - 1) {
          const delay = Math.pow(2, retry) * 1000 + Math.random() * 1000; // 1-2s, 2-3s, 4-5s
          console.log(`⏳ Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
          await sleep(delay);
        }
      }
    }
  }

  throw new Error(`Todos os serviços CORS falharam após ${maxRetries} tentativas. Último erro: ${lastError}`);
};

// Função para verificar se uma URL de imagem é acessível
export const testImageUrl = async (imageUrl: string): Promise<boolean> => {
  // Verifica cache primeiro
  const cached = imageUrlCache.get(imageUrl);
  if (cached !== null) {
    console.log(`🎯 Cache hit para URL da imagem: ${imageUrl.substring(0, 60)}...`);
    return cached;
  }

  try {
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      mode: 'no-cors'
    });
    const isAccessible = true;
    imageUrlCache.set(imageUrl, isAccessible);
    return isAccessible;
  } catch {
    const isAccessible = false;
    imageUrlCache.set(imageUrl, isAccessible);
    return isAccessible;
  }
};

// Função para tentar múltiplas variações de uma URL de imagem
export const getWorkingImageUrl = async (originalUrl: string): Promise<string | null> => {
  const urlVariations = [
    originalUrl,
    // Tenta versões sem parâmetros
    originalUrl.split('?')[0],
    // Tenta versões com diferentes tamanhos
    originalUrl.replace(/\/w_\d+,h_\d+/g, '/w_800,h_600'),
    originalUrl.replace(/\/resize\/\d+x\d+/g, '/resize/800x600'),
    originalUrl.replace(/&w=\d+&h=\d+/g, '&w=800&h=600'),
    // Tenta versões com diferentes formatos
    originalUrl.replace(/\.webp/g, '.jpg'),
    originalUrl.replace(/\.avif/g, '.jpg'),
    // Tenta versões com domínios CDN alternativos
    originalUrl.replace(/cdn\d+\./g, 'cdn.'),
    originalUrl.replace(/img\d+\./g, 'img.'),
    // Tenta versões HTTPS se for HTTP
    originalUrl.replace(/^http:\/\//g, 'https://'),
  ];

  for (const variation of urlVariations) {
    if (await testImageUrl(variation)) {
      console.log(`✅ URL de imagem funcional encontrada: ${variation}`);
      return variation;
    }
  }

  console.log(`❌ Nenhuma variação da URL funcionou: ${originalUrl}`);
  return null;
};
