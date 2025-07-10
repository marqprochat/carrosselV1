import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useImageExtractor, ExtractedImage } from '@/hooks/useImageExtractor';
import { Loader2, Link, Image, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUrlExtractorProps {
  onImagesExtracted: (images: string[]) => void;
}

export const ImageUrlExtractor: React.FC<ImageUrlExtractorProps> = ({ onImagesExtracted }) => {
  const [url, setUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  
  const { extractImages, loading, error } = useImageExtractor();

  const handleExtract = async () => {
    if (!url.trim()) {
      toast.error('Por favor, insira uma URL válida');
      return;
    }

    try {
      const images = await extractImages(url);
      
      if (images.length === 0) {
        toast.warning('Nenhuma imagem encontrada nesta página');
        return;
      }

      setExtractedImages(images);
      setSelectedImages(new Set(images.map(img => img.src)));
      toast.success(`${images.length} imagens encontradas`);
    } catch (err) {
      toast.error('Erro ao extrair imagens da página');
    }
  };

  const toggleImageSelection = (src: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(src)) {
      newSelected.delete(src);
    } else {
      newSelected.add(src);
    }
    setSelectedImages(newSelected);
  };

  const handleAddImages = () => {
    if (selectedImages.size === 0) {
      toast.error('Selecione pelo menos uma imagem');
      return;
    }

    onImagesExtracted(Array.from(selectedImages));
    toast.success(`${selectedImages.size} imagens adicionadas ao carrossel`);
    
    // Reset state
    setUrl('');
    setExtractedImages([]);
    setSelectedImages(new Set());
    setIsOpen(false);
  };

  const selectAll = () => {
    setSelectedImages(new Set(extractedImages.map(img => img.src)));
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link className="w-4 h-4 mr-2" />
          Extrair de URL
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extrair Imagens de Página Web</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL da Página ou Imagem</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                placeholder="https://exemplo.com/reportagem ou imagem.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <Button 
                onClick={handleExtract} 
                disabled={loading || !url.trim()}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Extrair'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              💡 Dica: Cole URLs de páginas web ou links diretos de imagens (.jpg, .png, .webp)
            </p>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          {extractedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">{extractedImages.length} imagens de qualidade</span> encontradas
                  <span className="ml-2 text-xs text-gray-500">(min. 300×200px)</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Selecionar Todas
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Desmarcar Todas
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {extractedImages.map((img, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                      selectedImages.has(img.src)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleImageSelection(img.src)}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-24 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {selectedImages.has(img.src) && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 py-0.5 rounded-bl">
                      {img.width && img.height ? `${img.width}×${img.height}` : 'HD'}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                      {img.alt || 'Sem título'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  {selectedImages.size} imagens selecionadas
                </p>
                <Button onClick={handleAddImages} disabled={selectedImages.size === 0}>
                  <Image className="w-4 h-4 mr-2" />
                  Adicionar ao Carrossel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
