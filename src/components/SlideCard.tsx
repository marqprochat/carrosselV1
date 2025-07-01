import { Rnd } from 'react-rnd';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from './ui/aspect-ratio';
import { Slide } from '@/types/slide';

interface SlideCardProps {
  slide: Slide;
  onUpdate: (slideId: number, newProps: Partial<Slide>) => void;
}

function hexToRgba(hex: string, opacity: number): string {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    return `rgba(0,0,0,${opacity})`;
  }
  let c: any = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c = '0x' + c.join('');
  return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(
    ','
  )},${opacity})`;
}

export function SlideCard({ slide, onUpdate }: SlideCardProps) {
  const textBackground = hexToRgba(
    slide.backgroundColor,
    slide.backgroundOpacity
  );

  return (
    <Card className="overflow-hidden h-full shadow-lg border-0">
      <CardContent className="p-0 h-full">
        <AspectRatio ratio={1 / 1} className="bg-muted relative">
          <img
            src={slide.imageUrl}
            alt={slide.text}
            className="object-cover w-full h-full absolute inset-0 pointer-events-none"
          />
          <Rnd
            size={{ width: slide.size.width, height: slide.size.height }}
            position={{ x: slide.position.x, y: slide.position.y }}
            onDragStop={(e, d) => {
              onUpdate(slide.id, { position: { x: d.x, y: d.y } });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              onUpdate(slide.id, {
                size: { width: ref.style.width, height: ref.style.height },
                position,
              });
            }}
            bounds="parent"
            className="flex items-center justify-center border-2 border-dashed border-transparent hover:border-primary transition-colors"
            disableUserSelect
          >
            <div
              style={{
                backgroundColor: textBackground,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              <p
                style={{
                  fontFamily: slide.fontFamily,
                  fontSize: `${slide.fontSize}px`,
                  color: slide.color,
                  textAlign: slide.textAlign,
                  lineHeight: 1.2,
                }}
                className="w-full font-bold p-2"
              >
                {slide.text}
              </p>
            </div>
          </Rnd>
        </AspectRatio>
      </CardContent>
    </Card>
  );
}
