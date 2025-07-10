import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ImageSelector } from '@/components/ImageSelector';
import { ImageSource } from '@/services/imageService';
import { Link, Image } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUrlExtractorProps {
  onImagesExtracted: (images: string[]) => void;
}

export const ImageUrlExtractor: React.FC<ImageUrlExtractorProps> = ({ onImagesExtracted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImageSource[]>([]);

  const handleImageSelect = (image: ImageSource) => {
    // Adiciona a imagem à lista de selecionadas
    setSelectedImages(prev => [...prev, image]);
    toast.success('Imagem adicionada à seleção');
  };

  const handleAddImages = () => {
    if (selectedImages.length === 0) {
      toast.error('Selecione pelo menos uma imagem');
      return;
    }

    onImagesExtracted(selectedImages.map(img => img.src));
    toast.success(`${selectedImages.length} imagens adicionadas ao carrossel`);
    
    // Reset state
    setSelectedImages([]);
    setIsOpen(false);
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
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
          <ImageSelector
            onImageSelect={handleImageSelect}
            trigger={null}
            defaultTab="web-extraction"
            allowedSources={['web-extraction', 'url']}
          />

          {selectedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">{selectedImages.length} imagens selecionadas</span>
                </p>
                <Button variant="outline" size="sm" onClick={() => setSelectedImages([])}>
                  Limpar Seleção
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {selectedImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative border-2 border-blue-500 bg-blue-50 rounded-lg overflow-hidden"
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
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0"
                      onClick={() => removeSelectedImage(index)}
                    >
                      ×
                    </Button>
                    {img.width && img.height && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1 py-0.5 rounded-br">
                        {img.width}×{img.height}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                      {img.alt || 'Sem título'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  {selectedImages.length} imagens prontas para adicionar
                </p>
                <Button onClick={handleAddImages}>
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
