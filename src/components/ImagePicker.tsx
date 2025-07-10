import { ImageSelector } from '@/components/ImageSelector';
import { ImageSource } from '@/services/imageService';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ImagePickerProps {
  onImageSelect: (url: string) => void;
  currentSlide?: number;
  totalSlides?: number;
}

export function ImagePicker({ onImageSelect, currentSlide, totalSlides }: ImagePickerProps) {
  const handleImageSelect = (image: ImageSource) => {
    onImageSelect(image.src);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Trocar Imagem</DialogTitle>
        <DialogDescription>
          Busque uma nova imagem no Unsplash, envie do seu computador ou extraia de páginas web.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4">
        <ImageSelector
          onImageSelect={handleImageSelect}
          trigger={null}
          defaultTab="unsplash"
          allowedSources={['unsplash', 'upload', 'url', 'web-extraction']}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
        />
      </div>
    </>
  );
}
