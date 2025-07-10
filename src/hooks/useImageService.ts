import { useState, useCallback } from 'react';
import { imageService, ImageSource, ImageSearchOptions, ImageExtractionOptions, ImageUploadOptions } from '@/services/imageService';

export interface UseImageServiceResult {
  // Estado de busca Unsplash
  searchResults: ImageSource[];
  isSearching: boolean;
  searchError: string | null;
  searchUnsplash: (options: ImageSearchOptions) => Promise<void>;
  clearSearchResults: () => void;

  // Estado de extração de URL/Web
  extractedImages: ImageSource[];
  isExtracting: boolean;
  extractionError: string | null;
  extractFromPage: (options: ImageExtractionOptions) => Promise<void>;
  processImageUrl: (url: string) => Promise<ImageSource | null>;
  clearExtractedImages: () => void;

  // Estado de upload
  isUploading: boolean;
  uploadError: string | null;
  uploadImage: (options: ImageUploadOptions) => Promise<ImageSource | null>;
}

export function useImageService(): UseImageServiceResult {
  // Estado para Unsplash
  const [searchResults, setSearchResults] = useState<ImageSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Estado para extração
  const [extractedImages, setExtractedImages] = useState<ImageSource[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Estado para upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const searchUnsplash = useCallback(async (options: ImageSearchOptions) => {
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const results = await imageService.searchUnsplash(options);
      setSearchResults(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar imagens';
      setSearchError(errorMessage);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const extractFromPage = useCallback(async (options: ImageExtractionOptions) => {
    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      const results = await imageService.extractImagesFromPage(options);
      setExtractedImages(results);
      
      if (results.length === 0) {
        setExtractionError('Nenhuma imagem de qualidade encontrada nesta página');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao extrair imagens';
      setExtractionError(errorMessage);
      setExtractedImages([]);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const processImageUrl = useCallback(async (url: string): Promise<ImageSource | null> => {
    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      const result = await imageService.processImageUrl(url);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar URL da imagem';
      setExtractionError(errorMessage);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const uploadImage = useCallback(async (options: ImageUploadOptions): Promise<ImageSource | null> => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const result = await imageService.uploadImage(options);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem';
      setUploadError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  const clearExtractedImages = useCallback(() => {
    setExtractedImages([]);
    setExtractionError(null);
  }, []);

  return {
    // Unsplash
    searchResults,
    isSearching,
    searchError,
    searchUnsplash,
    clearSearchResults,

    // Extração
    extractedImages,
    isExtracting,
    extractionError,
    extractFromPage,
    processImageUrl,
    clearExtractedImages,

    // Upload
    isUploading,
    uploadError,
    uploadImage,
  };
}
