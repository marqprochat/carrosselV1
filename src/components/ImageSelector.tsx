import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UploadCloud, 
  Link, 
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageSource } from '@/services/imageService';
import { useImageService } from '@/hooks/useImageService';

interface ImageSelectorProps {
  onImageSelect: (image: ImageSource) => void;
  trigger?: React.ReactNode;
  defaultTab?: 'unsplash' | 'upload' | 'url' | 'web-extraction';
  allowedSources?: ('unsplash' | 'upload' | 'url' | 'web-extraction')[];
  currentSlide?: number;
  totalSlides?: number;
}

export function ImageSelector({ 
  onImageSelect, 
  trigger,
  defaultTab = 'unsplash',
  allowedSources = ['unsplash', 'upload', 'url', 'web-extraction'],
  currentSlide,
  totalSlides
}: ImageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('business');
  const [extractionUrl, setExtractionUrl] = useState('');

  const {
    searchResults,
    isSearching,
    searchError,
    searchUnsplash,
    clearSearchResults,
    extractedImages,
    isExtracting,
    extractionError,
    extractFromPage,
    processImageUrl,
    clearExtractedImages,
    isUploading,
    uploadError,
    uploadImage
  } = useImageService();

  const handleUnsplashSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      clearSearchResults();
      return;
    }

    await searchUnsplash({ 
      query: searchTerm,
      perPage: 30
    });
  }, [searchTerm, searchUnsplash, clearSearchResults]);

  const handleUrlExtraction = useCallback(async () => {
    if (!extractionUrl.trim()) {
      clearExtractedImages();
      return;
    }

    await extractFromPage({ 
      url: extractionUrl,
      maxResults: 20
    });
    
    if (extractedImages.length > 0) {
      toast.success(`${extractedImages.length} imagens encontradas`);
    }
  }, [extractionUrl, extractFromPage, clearExtractedImages, extractedImages.length]);

  const handleDirectUrl = useCallback(async () => {
    if (!extractionUrl.trim()) return;

    const result = await processImageUrl(extractionUrl);
    if (result) {
      handleImageSelect(result);
    }
  }, [extractionUrl, processImageUrl]);

  const handleFileUpload = useCallback(async (file: File) => {
    const result = await uploadImage({ file });
    if (result) {
      handleImageSelect(result);
    } else if (uploadError) {
      toast.error(uploadError);
    }
  }, [uploadImage, uploadError]);

  const handleImageSelect = useCallback((image: ImageSource) => {
    onImageSelect(image);
    setIsOpen(false);
    
    // Reset states
    clearSearchResults();
    clearExtractedImages();
    toast.success('Imagem selecionada com sucesso');
  }, [onImageSelect, clearSearchResults, clearExtractedImages]);

  const isDirectImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const renderImageGrid = (images: ImageSource[], showSource = true) => (
    <div className="grid grid-cols-3 gap-4 h-96 overflow-y-auto pr-2">
      {images.map((img, index) => (
        <div
          key={`${img.src}-${index}`}
          className="cursor-pointer group relative border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden transition-all"
          onClick={() => handleImageSelect(img)}
        >
          <AspectRatio ratio={1 / 1}>
            <img
              src={img.src}
              alt={img.alt}
              className="object-cover w-full h-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
          </AspectRatio>
          
          {showSource && img.source && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                {img.source === 'unsplash' && 'Unsplash'}
                {img.source === 'upload' && 'Upload'}
                {img.source === 'url' && 'URL'}
                {img.source === 'web-extraction' && 'Web'}
              </Badge>
            </div>
          )}
          
          {img.width && img.height && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline" className="text-xs">
                {img.width}×{img.height}
              </Badge>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ImageIcon className="w-4 h-4 mr-2" />
            Selecionar Imagem
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Selecionar Imagem
            {currentSlide !== undefined && totalSlides && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                • Slide {currentSlide + 1} de {totalSlides}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {allowedSources.includes('unsplash') && (
              <TabsTrigger value="unsplash">
                <Search className="w-4 h-4 mr-2" />
                Unsplash
              </TabsTrigger>
            )}
            {allowedSources.includes('upload') && (
              <TabsTrigger value="upload">
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
            )}
            {allowedSources.includes('url') && (
              <TabsTrigger value="url">
                <Link className="w-4 h-4 mr-2" />
                URL
              </TabsTrigger>
            )}
            {allowedSources.includes('web-extraction') && (
              <TabsTrigger value="web-extraction">
                <ExternalLink className="w-4 h-4 mr-2" />
                Web
              </TabsTrigger>
            )}
          </TabsList>

          {/* Unsplash Tab */}
          {allowedSources.includes('unsplash') && (
            <TabsContent value="unsplash">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Buscar por 'tecnologia', 'escritório'..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUnsplashSearch();
                      }
                    }}
                    disabled={isSearching}
                  />
                  <Button onClick={handleUnsplashSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                  </Button>
                </div>
                
                {searchError && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{searchError}</span>
                  </div>
                )}
                
                {searchResults.length > 0 ? (
                  renderImageGrid(searchResults, false)
                ) : (
                  !isSearching && (
                    <div className="text-center text-muted-foreground py-8">
                      Digite um termo de busca para encontrar imagens no Unsplash
                    </div>
                  )
                )}
              </div>
            </TabsContent>
          )}

          {/* Upload Tab */}
          {allowedSources.includes('upload') && (
            <TabsContent value="upload">
              <div className="relative flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center">
                <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">
                  Arraste e solte ou clique para enviar
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  PNG, JPG, GIF, WebP até 10MB
                </p>
                {isUploading && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </div>
                )}
                <Input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  disabled={isUploading}
                />
              </div>
            </TabsContent>
          )}

          {/* URL Tab */}
          {allowedSources.includes('url') && (
            <TabsContent value="url">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="direct-url">URL da Imagem</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="direct-url"
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={extractionUrl}
                      onChange={(e) => setExtractionUrl(e.target.value)}
                      disabled={isExtracting}
                    />
                    <Button 
                      onClick={handleDirectUrl}
                      disabled={isExtracting || !extractionUrl.trim()}
                    >
                      {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Usar'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cole um link direto para uma imagem (.jpg, .png, .webp, etc.)
                  </p>
                </div>
                
                {extractionError && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{extractionError}</span>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Web Extraction Tab */}
          {allowedSources.includes('web-extraction') && (
            <TabsContent value="web-extraction">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="web-url">URL da Página Web</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="web-url"
                      placeholder="https://exemplo.com/artigo"
                      value={extractionUrl}
                      onChange={(e) => setExtractionUrl(e.target.value)}
                      disabled={isExtracting}
                    />
                    <Button 
                      onClick={handleUrlExtraction}
                      disabled={isExtracting || !extractionUrl.trim()}
                    >
                      {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Extrair'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Extrai imagens de qualidade de páginas web, blogs e artigos
                  </p>
                </div>
                
                {extractionError && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{extractionError}</span>
                  </div>
                )}
                
                {extractedImages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {extractedImages.length} imagens encontradas
                      </Badge>
                    </div>
                    {renderImageGrid(extractedImages, false)}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
