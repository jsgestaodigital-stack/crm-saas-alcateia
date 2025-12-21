import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Star, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useNPSFeedback } from '@/hooks/useNPSFeedback';

const SCORE_LABELS: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Muito improvável', emoji: '😞' },
  1: { label: 'Muito improvável', emoji: '😞' },
  2: { label: 'Improvável', emoji: '😟' },
  3: { label: 'Improvável', emoji: '😟' },
  4: { label: 'Neutro', emoji: '😐' },
  5: { label: 'Neutro', emoji: '😐' },
  6: { label: 'Neutro', emoji: '😐' },
  7: { label: 'Provável', emoji: '🙂' },
  8: { label: 'Provável', emoji: '😊' },
  9: { label: 'Muito provável', emoji: '😄' },
  10: { label: 'Extremamente provável', emoji: '🤩' },
};

export function NPSModal() {
  const { isModalOpen, setIsModalOpen, submit, dismiss, isSubmitting } = useNPSFeedback();
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState<'score' | 'feedback'>('score');

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore);
    setStep('feedback');
  };

  const handleSubmit = () => {
    if (score !== null) {
      submit(score, feedback || undefined);
    }
  };

  const handleClose = () => {
    dismiss();
    setScore(null);
    setFeedback('');
    setStep('score');
  };

  const getScoreColor = (s: number) => {
    if (s >= 9) return 'bg-status-success text-white';
    if (s >= 7) return 'bg-amber-500 text-white';
    return 'bg-status-danger text-white';
  };

  const getScoreCategory = () => {
    if (score === null) return null;
    if (score >= 9) return { label: 'Promotor', icon: ThumbsUp, color: 'text-status-success' };
    if (score >= 7) return { label: 'Neutro', icon: Meh, color: 'text-amber-500' };
    return { label: 'Detrator', icon: ThumbsDown, color: 'text-status-danger' };
  };

  const category = getScoreCategory();

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Sua opinião importa!
          </DialogTitle>
          <DialogDescription>
            {step === 'score' 
              ? 'Em uma escala de 0 a 10, o quanto você recomendaria o Rankeia para um amigo ou colega?'
              : 'Obrigado! Gostaria de deixar um comentário?'
            }
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'score' ? (
            <motion.div
              key="score"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-4"
            >
              {/* Score selector */}
              <div className="grid grid-cols-11 gap-1 mb-4">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleScoreSelect(i)}
                    className={cn(
                      'h-10 rounded-lg font-medium text-sm transition-all hover:scale-110',
                      score === i
                        ? getScoreColor(i)
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Nada provável</span>
                <span>Muito provável</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-4 space-y-4"
            >
              {/* Score display */}
              {score !== null && category && (
                <div className="flex items-center justify-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-3xl">{SCORE_LABELS[score].emoji}</span>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{score}</p>
                    <p className={cn('text-sm font-medium', category.color)}>
                      {SCORE_LABELS[score].label}
                    </p>
                  </div>
                </div>
              )}

              {/* Feedback textarea */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  O que podemos melhorar? (opcional)
                </label>
                <Textarea
                  placeholder="Conte-nos sua experiência..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('score')}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 'score' && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Agora não
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
