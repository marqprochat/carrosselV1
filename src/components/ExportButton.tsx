import { forwardRef, useState } from 'react';
import { Download, Image as ImageIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportAsImage } from '@/lib/export';

interface ExportButtonProps {
  slideId: string;
}

export const ExportButton = forwardRef<HTMLDivElement, ExportButtonProps>(({ slideId }, ref) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'png' | 'jpeg') => {
    if (!ref || typeof ref === 'function' || !ref.current) {
      console.error('A referência para o slide não foi encontrada.');
      return;
    }

    setIsExporting(true);
    try {
      await exportAsImage(ref.current, `slide-${slideId}`, format);
    } catch (error) { 
      console.error('Erro ao exportar o slide:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="absolute top-4 right-4 z-10">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('png')}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Exportar como PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('jpeg')}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Exportar como JPG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
