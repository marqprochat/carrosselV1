import { useState } from 'react';
import { fetchWithCorsProxy, getWorkingImageUrl } from '@/lib/corsProxy';
import { imageDimensionsCache } from '@/lib/cache';

export interface ExtractedImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export const useImageExtractor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isQualityImage = (img: ExtractedImage): boolean => {
    const srcLower = img.src.toLowerCase();
    const altLower = img.alt.toLowerCase();
    
    console.log(`🔍 Analisando imagem: ${img.src.substring(0, 80)}...`);
    console.log(`📐 Dimensões: ${img.width}x${img.height}`);
    
    // Check for high-quality image formats
    const qualityFormats = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasQualityFormat = qualityFormats.some(ext => srcLower.includes(ext));
    console.log(`📄 Formato válido: ${hasQualityFormat} (${qualityFormats.find(ext => srcLower.includes(ext)) || 'nenhum'})`);
    
    // Exclude low-quality indicators (mais específicos)
    const lowQualityKeywords = [
      'thumb-', 'thumbnail', 'icon-', 'logo-', 'sprite-', 'avatar-',
      'banner-', 'ads-', 'tracking-', 'pixel-', 'beacon-', 'button-',
      'social-', 'widget-', 'placeholder-', 'loading-', 'spinner-',
      'separator-', 'divider-', 'watermark-', 'copyright-', 'signature-',
      'badge-', 'medal-', 'flag-', 'emoji-', 'emoticon-', 'smiley-'
    ];
    
    const matchedKeywords = lowQualityKeywords.filter(keyword => 
      srcLower.includes(keyword) || altLower.includes(keyword)
    );
    const hasLowQualityKeyword = matchedKeywords.length > 0;
    console.log(`🚫 Palavras-chave negativas: ${hasLowQualityKeyword} (${matchedKeywords.join(', ') || 'nenhuma'})`);
    
    // Check size constraints for slides
    const minWidth = 300;
    const minHeight = 200;
    
    let meetsSize = true;
    
    if (img.width && img.height) {
      meetsSize = img.width >= minWidth && img.height >= minHeight;
      console.log(`📏 Tamanho adequado: ${meetsSize} (min: ${minWidth}x${minHeight}, atual: ${img.width}x${img.height})`);
    } else {
      console.log(`📏 Dimensões não disponíveis, assumindo tamanho adequado`);
      // Se não temos dimensões, assumimos que está ok (será verificado depois)
      meetsSize = true;
    }
    
    const isQuality = hasQualityFormat && !hasLowQualityKeyword && meetsSize;
    console.log(`✅ Resultado final: ${isQuality ? 'APROVADA' : 'REJEITADA'}`);
    
    return isQuality;
  };

  const loadImageDimensions = async (src: string): Promise<{width: number, height: number} | null> => {
    // Verifica cache primeiro
    const cached = imageDimensionsCache.get(src);
    if (cached) {
      console.log(`🎯 Cache hit para dimensões: ${src.substring(0, 60)}...`);
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
      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  };

  const isDirectImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext));
  };

  const extractImages = async (url: string): Promise<ExtractedImage[]> => {
    setLoading(true);
    setError(null);

    try {
      // Validate URL
      new URL(url);
      
      console.log('🚀 Iniciando extração de imagens para:', url);
      
      // Check if the URL is a direct image
      if (isDirectImageUrl(url)) {
        console.log('📸 URL detectada como imagem direta!');
        
        // Load image to get dimensions
        const dimensions = await loadImageDimensions(url);
        
        const directImage: ExtractedImage = {
          src: url,
          alt: url.split('/').pop()?.split('.')[0] || 'Direct Image',
          width: dimensions?.width,
          height: dimensions?.height,
        };

        // Apply quality check
        if (isQualityImage(directImage)) {
          console.log(`✅ Imagem direta aprovada: ${directImage.src.substring(0, 60)}... (${directImage.width}x${directImage.height})`);
          return [directImage];
        } else {
          console.log(`❌ Imagem direta rejeitada: ${directImage.src.substring(0, 60)}... (${directImage.width}x${directImage.height})`);
          setError('A imagem não atende aos critérios de qualidade (mínimo 300x200px, formato JPG/PNG/WebP)');
          return [];
        }
      }
      
      // Use the CORS proxy service for web pages
      const htmlContent = await fetchWithCorsProxy(url);

      // Parse HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      const convertToAbsoluteUrl = (src: string, baseUrl: URL): string | null => {
        try {
          if (src.startsWith('//')) {
            return `https:${src}`;
          } else if (src.startsWith('/')) {
            return `${baseUrl.protocol}//${baseUrl.host}${src}`;
          } else if (!src.startsWith('http')) {
            return `${baseUrl.protocol}//${baseUrl.host}/${src}`;
          }
          return src;
        } catch (e) {
          console.warn('❌ Falha ao converter URL relativa:', src);
          return null;
        }
      };

      const baseUrl = new URL(url);
      const foundUrls = new Set<string>();
      const candidateImages: ExtractedImage[] = [];

      // 1. Extract from img tags
      const images = Array.from(doc.querySelectorAll('img'));
      console.log(`📸 Encontradas ${images.length} tags img na página`);
      
      images.forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || 
                   img.getAttribute('data-original') || img.getAttribute('data-srcset')?.split(',')[0]?.trim().split(' ')[0];
        const alt = img.alt || img.getAttribute('title') || img.getAttribute('data-alt') || '';
        
        if (src) {
          const absoluteSrc = convertToAbsoluteUrl(src, baseUrl);
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

      // 2. Extract from CSS background-image properties
      const elementsWithBg = Array.from(doc.querySelectorAll('*')).filter(el => {
        const style = el.getAttribute('style');
        return style && style.includes('background-image');
      });
      
      console.log(`🎨 Encontrados ${elementsWithBg.length} elementos com background-image`);
      
      elementsWithBg.forEach((el) => {
        const style = el.getAttribute('style') || '';
        const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"()]+)['"]?\)/);
        if (bgMatch && bgMatch[1]) {
          const absoluteSrc = convertToAbsoluteUrl(bgMatch[1], baseUrl);
          if (absoluteSrc && !foundUrls.has(absoluteSrc)) {
            foundUrls.add(absoluteSrc);
            candidateImages.push({
              src: absoluteSrc,
              alt: el.getAttribute('alt') || el.getAttribute('title') || 'Background Image',
              width: undefined,
              height: undefined,
            });
          }
        }
      });

      // 3. Extract from meta tags (OpenGraph, Twitter Cards)
      const metaTags = Array.from(doc.querySelectorAll('meta[property^="og:image"], meta[name="twitter:image"], meta[property="twitter:image"]'));
      console.log(`🏷️ Encontradas ${metaTags.length} meta tags de imagem`);
      
      metaTags.forEach((meta) => {
        const content = meta.getAttribute('content');
        if (content) {
          const absoluteSrc = convertToAbsoluteUrl(content, baseUrl);
          if (absoluteSrc && !foundUrls.has(absoluteSrc)) {
            foundUrls.add(absoluteSrc);
            candidateImages.push({
              src: absoluteSrc,
              alt: 'Social Media Image',
              width: undefined,
              height: undefined,
            });
          }
        }
      });

      // 4. Extract from JSON-LD structured data
      const jsonLdScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
      console.log(`📊 Encontrados ${jsonLdScripts.length} scripts JSON-LD`);
      
      jsonLdScripts.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '');
          const extractImagesFromJson = (obj: any, path: string = '') => {
            if (typeof obj === 'string' && (obj.includes('.jpg') || obj.includes('.jpeg') || obj.includes('.png') || obj.includes('.webp'))) {
              const absoluteSrc = convertToAbsoluteUrl(obj, baseUrl);
              if (absoluteSrc && !foundUrls.has(absoluteSrc)) {
                foundUrls.add(absoluteSrc);
                candidateImages.push({
                  src: absoluteSrc,
                  alt: `Structured Data Image (${path})`,
                  width: undefined,
                  height: undefined,
                });
              }
            } else if (typeof obj === 'object' && obj !== null) {
              Object.keys(obj).forEach(key => {
                if (key.toLowerCase().includes('image') || key === 'url' || key === 'contentUrl') {
                  extractImagesFromJson(obj[key], key);
                }
              });
            }
          };
          extractImagesFromJson(data);
        } catch (e) {
          // Ignore invalid JSON
        }
      });

      // 5. Extract from specific e-commerce selectors
      const ecommerceSelectors = [
        'picture img', // Modern picture elements
        '[data-src]', // Lazy loaded elements
        '.product-image img',
        '.gallery-image img',
        '.carousel-item img',
        '.slider-item img',
        '.zoom-image',
        '[class*="image"] img',
        '[id*="image"] img'
      ];

      ecommerceSelectors.forEach(selector => {
        const elements = Array.from(doc.querySelectorAll(selector));
        elements.forEach((el: any) => {
          const src = el.src || el.getAttribute('data-src') || el.getAttribute('data-original');
          if (src) {
            const absoluteSrc = convertToAbsoluteUrl(src, baseUrl);
            if (absoluteSrc && !foundUrls.has(absoluteSrc)) {
              foundUrls.add(absoluteSrc);
              candidateImages.push({
                src: absoluteSrc,
                alt: el.alt || el.getAttribute('title') || 'Product Image',
                width: el.naturalWidth || parseInt(el.getAttribute('width') || '0') || undefined,
                height: el.naturalHeight || parseInt(el.getAttribute('height') || '0') || undefined,
              });
            }
          }
        });
      });

      console.log(`🔍 Total de ${candidateImages.length} imagens únicas encontradas de múltiplas fontes`);

      console.log(`🔍 Verificando qualidade de ${candidateImages.length} imagens...`);
      
      // Load actual dimensions for images without them and apply quality filters
      const qualityImages: ExtractedImage[] = [];
      
      for (const img of candidateImages) {
        // Primeiro, tenta encontrar uma URL que funcione
        const workingUrl = await getWorkingImageUrl(img.src);
        if (!workingUrl) {
          console.log(`❌ Imagem inacessível: ${img.src.substring(0, 60)}...`);
          continue;
        }
        
        // Atualiza a URL com a versão que funciona
        img.src = workingUrl;
        
        // If dimensions are missing, try to load them
        if (!img.width || !img.height) {
          const dimensions = await loadImageDimensions(img.src);
          if (dimensions) {
            img.width = dimensions.width;
            img.height = dimensions.height;
          }
        }
        
        // Apply quality check
        if (isQualityImage(img)) {
          qualityImages.push(img);
          console.log(`✅ Imagem aprovada: ${img.src.substring(0, 60)}... (${img.width}x${img.height})`);
        } else {
          console.log(`❌ Imagem rejeitada: ${img.src.substring(0, 60)}... (${img.width}x${img.height})`);
        }
        
        // Limit to prevent too many requests
        if (qualityImages.length >= 15) break;
      }

      console.log(`✅ ${qualityImages.length} imagens de qualidade encontradas`);
      return qualityImages;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    extractImages,
    loading,
    error,
  };
};
