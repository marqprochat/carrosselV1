import { useState } from 'react';
import { Search, UploadCloud } from 'lucide-react';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AspectRatio } from './ui/aspect-ratio';

interface ImagePickerProps {
  onImageSelect: (url: string) => void;
}

interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
  };
  alt_description: string | null;
}

export function ImagePicker({ onImageSelect }: ImagePickerProps) {
  const [searchTerm, setSearchTerm] = useState('business');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchImages = async (query: string) => {
    if (!UNSPLASH_ACCESS_KEY) {
      setError('Chave de acesso do Unsplash não configurada.');
      setImages([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&per_page=30&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }
      const data = await response.json();
      setImages(data.results);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao buscar imagens.');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    const term = searchTerm.trim();
    if (term === '') {
      setImages([]);
      return;
    }
    fetchImages(term);
  };

  // Optionally, fetch default images on mount
  // React.useEffect(() => {
  //   fetchImages(searchTerm);
  // }, []);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Trocar Imagem</DialogTitle>
        <DialogDescription>
          Busque uma nova imagem no Unsplash ou envie do seu computador.
        </DialogDescription>
      </DialogHeader>
      <Tabs defaultValue="unsplash" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unsplash">
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </TabsTrigger>
          <TabsTrigger value="upload">
            <UploadCloud className="mr-2 h-4 w-4" />
            Enviar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="unsplash">
          <div className="flex items-center space-x-2 py-4">
            <Input
              placeholder="Buscar por 'tecnologia', 'escritório'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              disabled={isLoading}
            />
            <Button type="button" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
          {error && (
            <p className="text-red-600 text-center mb-4">{error}</p>
          )}
          <div className="grid grid-cols-3 gap-4 h-96 overflow-y-auto pr-2">
            {images.length > 0 ? (
              images.map((img) => (
                <div
                  key={img.id}
                  className="cursor-pointer group relative"
                  onClick={() => onImageSelect(img.urls.regular)}
                >
                  <AspectRatio ratio={1 / 1}>
                    <img
                      src={img.urls.small}
                      alt={img.alt_description ?? 'Imagem do Unsplash'}
                      className="rounded-md object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" />
                  </AspectRatio>
                </div>
              ))
            ) : (
              !isLoading && (
                <p className="col-span-3 text-center text-muted-foreground mt-8">
                  Nenhuma imagem encontrada para &quot;{searchTerm}&quot;.
                </p>
              )
            )}
          </div>
        </TabsContent>
        <TabsContent value="upload">
          <div className="relative flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center">
            <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              Arraste e solte ou clique para enviar
            </h3>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, GIF até 10MB
            </p>
            <Input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/gif"
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
