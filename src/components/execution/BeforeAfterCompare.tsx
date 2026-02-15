import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageIcon, ArrowLeftRight } from "lucide-react";

interface BeforeAfterCompareProps {
  beforeSrc?: string;
  afterSrc?: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BeforeAfterCompare({
  beforeSrc,
  afterSrc,
  beforeLabel = "Antes",
  afterLabel = "Depois",
  className,
}: BeforeAfterCompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  if (!beforeSrc || !afterSrc) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            Comparação Antes/Depois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3 border-2 border-dashed border-border rounded-lg">
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm text-center">
              Adicione imagens de antes e depois para comparar
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Upload "Antes"</Button>
              <Button variant="outline" size="sm">Upload "Depois"</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          Comparação Antes/Depois
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative w-full aspect-[16/9] overflow-hidden cursor-col-resize select-none rounded-b-lg"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          {/* After image (full) */}
          <img
            src={afterSrc}
            alt={afterLabel}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          
          {/* Before image (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={beforeSrc}
              alt={beforeLabel}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ width: containerRef.current?.offsetWidth || "100%" }}
              draggable={false}
            />
          </div>

          {/* Slider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4 text-foreground" />
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 z-20">
            <span className="px-2 py-1 text-xs font-bold bg-black/60 text-white rounded">
              {beforeLabel}
            </span>
          </div>
          <div className="absolute top-3 right-3 z-20">
            <span className="px-2 py-1 text-xs font-bold bg-black/60 text-white rounded">
              {afterLabel}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
