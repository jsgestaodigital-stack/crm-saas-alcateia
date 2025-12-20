import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
}

const COLORS = [
  "hsl(142, 100%, 50%)", // neon green
  "hsl(45, 93%, 47%)",   // warning yellow
  "hsl(217, 91%, 60%)",  // info blue
  "hsl(280, 70%, 60%)",  // purple
  "hsl(0, 0%, 98%)",     // white
];

export function Confetti({ 
  active, 
  onComplete, 
  duration = 3000, 
  particleCount = 50 
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const newPieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 0.5,
      }));
      
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, particleCount, duration, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            animation: `confetti-fall ${duration}ms ease-out forwards`,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
          }}
        />
      ))}
    </div>
  );
}

// Hook for triggering confetti
export function useConfetti() {
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = () => {
    setShowConfetti(true);
  };

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  return {
    showConfetti,
    triggerConfetti,
    handleConfettiComplete,
  };
}
