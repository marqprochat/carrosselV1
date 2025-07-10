import { fetchWithCorsProxy, getWorkingImageUrl } from '@/lib/corsProxy';
import { imageDimensionsCache } from '@/lib/cache';

export interface ImageSource {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  source?: 'unsplash' | 'upload' | 'url' | 'web-extraction';
}

export interface ImageSearchOptions {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
}

export interface ImageExtractionOptions {
  url: string;
  minWidth?: number;
  minHeight?: number;
  maxResults?: number;
}

export interface ImageUploadOptions {
  file: File;
  maxSize?: number; // em bytes
  allowedTypes?: string[];
}

class ImageService {
  private readonly UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  private readonly DEFAULT_MIN_WIDTH = 300;
  private readonly DEFAULT_MIN_HEIGHT = 200;
  private readonly DEFAULT_MAX_RESULTS = 15;
  private readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Busca imagens no Unsplash
   */
  async searchUnsplash(options: ImageSearchOptions): Promise<ImageSource[]> {
    if (!this.UNSPLASH_ACCESS_KEY) {
      throw new Error('Chave de acesso do Unsplash não configurada');
    }

    const { query, page = 1, perPage = 30, orientation } = options;
    const params = new URLSearchParams({
      query: query.trim(),
      page: page.toString(),
      per_page: perPage.toString(),
      client_id: this.UNSPLASH_ACCESS_KEY,
    });

    if (orientation) {
      params.append('orientation', orientation);
    }

    const response = await fetch(`https://api.unsplash.com/search/photos?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erro na API do Unsplash: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results.map((img: any): ImageSource => ({
      src: img.urls.regular,
      alt: img.alt_description || img.description || 'Imagem do Unsplash',
      width: img.width,
      height: img.height,
      source: 'unsplash'
    }));
  }

  /**
   * Faz upload de uma imagem local
   */
  async uploadImage(options: ImageUploadOptions): Promise<ImageSource> {
    const { 
      file, 
      maxSize = this.DEFAULT_MAX_FILE_SIZE, 
      allowedTypes = this.DEFAULT_ALLOWED_TYPES 
    } = options;

    // Validação de tipo
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
    }

    // Validação de tamanho
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: ${maxSize / 1024 / 1024}MB`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          resolve({
            src: reader.result as string,
            alt: file.name.replace(/\.[^/.]+$/, ''),
            width: img.naturalWidth,
            height: img.naturalHeight,
            source: 'upload'
          });
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = reader.result as string;
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Processa uma URL de imagem direta
   */
  async processImageUrl(url: string): Promise<ImageSource> {
    try {
      new URL(url); // Valida a URL
    } catch {
      throw new Error('URL inválida');
    }

    // Verifica se é uma URL de imagem válida
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
    const hasImageExtension = imageExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );

    if (!hasImageExtension) {
      throw new Error('URL não parece ser uma imagem válida');
    }

    const workingUrl = await getWorkingImageUrl(url);
    if (!workingUrl) {
      throw new Error('Imagem não acessível');
    }

    const dimensions = await this.loadImageDimensions(workingUrl);
    
    return {
      src: workingUrl,
      alt: url.split('/').pop()?.split('.')[0] || 'Imagem',
      width: dimensions?.width,
      height: dimensions?.height,
      source: 'url'
    };
  }

  /**
   * Extrai imagens de uma página web
   */
  async extractImagesFromPage(options: ImageExtractionOptions): Promise<ImageSource[]> {
    const { 
      url, 
      minWidth = this.DEFAULT_MIN_WIDTH, 
      minHeight = this.DEFAULT_MIN_HEIGHT,
      maxResults = this.DEFAULT_MAX_RESULTS 
    } = options;

    try {
      new URL(url); // Valida a URL
    } catch {
      throw new Error('URL inválida');
    }

    // Verifica se é uma URL de imagem direta
    if (this.isDirectImageUrl(url)) {
      const imageResult = await this.processImageUrl(url);
      return [imageResult];
    }

    // Extrai HTML da página
    const htmlContent = await fetchWithCorsProxy(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const baseUrl = new URL(url);
    const foundUrls = new Set<string>();
    const candidateImages: ImageSource[] = [];

    // Extrai imagens de diferentes fontes
    await this.extractFromImgTags(doc, baseUrl, foundUrls, candidateImages);
    await this.extractFromBackgroundImages(doc, baseUrl, foundUrls, candidateImages);
    await this.extractFromMetaTags(doc, baseUrl, foundUrls, candidateImages);
    await this.extractFromStructuredData(doc, baseUrl, foundUrls, candidateImages);

    // Filtra imagens de qualidade
    const qualityImages: ImageSource[] = [];
    
    for (const img of candidateImages) {
      const workingUrl = await getWorkingImageUrl(img.src);
      if (!workingUrl) continue;

      img.src = workingUrl;
      
      // Carrega dimensões se não estiverem disponíveis
      if (!img.width || !img.height) {
        const dimensions = await this.loadImageDimensions(img.src);
        if (dimensions) {
          img.width = dimensions.width;
          img.height = dimensions.height;
        }
      }

      // Verifica qualidade
      if (this.isQualityImage(img, minWidth, minHeight)) {
        img.source = 'web-extraction';
        qualityImages.push(img);
      }

      if (qualityImages.length >= maxResults) break;
    }

    return qualityImages;
  }

  /**
   * Carrega dimensões de uma imagem
   */
  private async loadImageDimensions(src: string): Promise<{width: number, height: number} | null> {
    const cached = imageDimensionsCache.get(src);
    if (cached) {
      return cached;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
        imageDimensionsCache.set(src, dimensions);
        resolve(dimensions);
      };
      img.onerror = () => resolve(null);
      img.src = src;
      setTimeout(() => resolve(null), 5000);
    });
  }

  /**
   * Verifica se uma URL é uma imagem direta
   */
  private isDirectImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  /**
   * Verifica se uma imagem atende aos critérios de qualidade
   */
  private isQualityImage(img: ImageSource, minWidth: number, minHeight: number): boolean {
    const srcLower = img.src.toLowerCase();
    const altLower = img.alt.toLowerCase();
    
    // Verifica formato de qualidade
    const qualityFormats = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasQualityFormat = qualityFormats.some(ext => srcLower.includes(ext));
    
    // Exclui indicadores de baixa qualidade
    const lowQualityKeywords = [
      'thumb', 'thumbnail', 'icon', 'logo', 'sprite', 'avatar',
      'banner', 'ads', 'tracking', 'pixel', 'beacon', 'button',
      'social', 'widget', 'placeholder', 'loading', 'spinner'
    ];
    
    const hasLowQualityKeyword = lowQualityKeywords.some(keyword => 
      srcLower.includes(keyword) || altLower.includes(keyword)
    );

    // Verifica dimensões
    const meetsSize = img.width && img.height 
      ? img.width >= minWidth && img.height >= minHeight
      : true; // Se não temos dimensões, assumimos que está ok

    return hasQualityFormat && !hasLowQualityKeyword && meetsSize;
  }

  /**
   * Converte URL relativa para absoluta
   */
  private convertToAbsoluteUrl(src: string, baseUrl: URL): string | null {
    try {
      if (src.startsWith('//')) {
        return `https:${src}`;
      } else if (src.startsWith('/')) {
        return `${baseUrl.protocol}//${baseUrl.host}${src}`;
      } else if (!src.startsWith('http')) {
        return `${baseUrl.protocol}//${baseUrl.host}/${src}`;
      }
      return src;
    } catch {
      return null;
    }
  }

  /**
   * Extrai imagens de tags img
   */
  private async extractFromImgTags(doc: Document, baseUrl: URL, foundUrls: Set<string>, candidateImages: ImageSource[]): Promise<void> {
    const images = Array.from(doc.querySelectorAll('img'));
    
    images.forEach((img) => {
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || 
                 img.getAttribute('data-original') || img.getAttribute('data-srcset')?.split(',')[0]?.trim().split(' ')[0];
      const alt = img.alt || img.getAttribute('title') || img.getAttribute('data-alt') || '';
      
      if (src) {
        const absoluteSrc = this.convertToAbsoluteUrl(src, baseUrl);
        if (absoluteSrc && !foundUrls.has(absoluteSrc)) {
          foundUrls.add(absoluteSrc);
          candidateImages.push({
            src: absoluteSrc,
            alt: alt,
            width: img.naturalWidth || parseInt(img.getAttribute('width') || '0') || undefined,
            height: img.naturalHeight || parseInt(img.getAttribute('height') || '0') || undefined,
          });
        }
      }
    });
  }

  /**
   * Extrai imagens de background-image CSS
   */
  private async extractFromBackgroundImages(doc: Document, baseUrl: URL, foundUrls: Set<string>, candidateImages: ImageSource[]): Promise<void> {
    const elementsWithBg = Array.from(doc.querySelectorAll('*')).filter(el => {
      const style = el.getAttribute('style');
      return style && style.includes('background-image');
    });
    
    elementsWithBg.forEach((el) => {
      const style = el.getAttribute('style') || '';
      const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"()]+)['"]?\)/);
      if (bgMatch && bgMatch[1]) {
        const absoluteSrc = this.convertToAbsoluteUrl(bgMatch[1], baseUrl);
        if (absoluteSrc && !foundUrls.has(absoluteSrc)) {
          foundUrls.add(absoluteSrc);
          candidateImages.push({
            src: absoluteSrc,
            alt: el.getAttribute('alt') || el.getAttribute('title') || 'Background Image',
          });
        }
      }
    });
  }

  /**
   * Extrai imagens de meta tags
   */
  private async extractFromMetaTags(doc: Document, baseUrl: URL, foundUrls: Set<string>, candidateImages: ImageSource[]): Promise<void> {
    const metaTags = Array.from(doc.querySelectorAll('meta[property^="og:image"], meta[name="twitter:image"], meta[property="twitter:image"]'));
    
    metaTags.forEach((meta) => {
      const content = meta.getAttribute('content');
      if (content) {
        const absoluteSrc = this.convertToAbsoluteUrl(content, baseUrl);
        if (absoluteSrc && !foundUrls.has(absoluteSrc)) {
          foundUrls.add(absoluteSrc);
          candidateImages.push({
            src: absoluteSrc,
            alt: 'Social Media Image',
          });
        }
      }
    });
  }

  /**
   * Extrai imagens de dados estruturados JSON-LD
   */
  private async extractFromStructuredData(doc: Document, baseUrl: URL, foundUrls: Set<string>, candidateImages: ImageSource[]): Promise<void> {
    const jsonLdScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    
    jsonLdScripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || '');
        this.extractImagesFromJson(data, baseUrl, foundUrls, candidateImages);
      } catch {
        // Ignora JSON inválido
      }
    });
  }

  /**
   * Extrai imagens de objetos JSON recursivamente
   */
  private extractImagesFromJson(obj: any, baseUrl: URL, foundUrls: Set<string>, candidateImages: ImageSource[]): void {
    if (typeof obj === 'string' && this.isDirectImageUrl(obj)) {
      const absoluteSrc = this.convertToAbsoluteUrl(obj, baseUrl);
      if (absoluteSrc && !foundUrls.has(absoluteSrc)) {
        foundUrls.add(absoluteSrc);
        candidateImages.push({
          src: absoluteSrc,
          alt: 'Structured Data Image',
        });
      }
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (key.toLowerCase().includes('image') || key === 'url' || key === 'contentUrl') {
          this.extractImagesFromJson(obj[key], baseUrl, foundUrls, candidateImages);
        }
      });
    }
  }
}

export const imageService = new ImageService();
