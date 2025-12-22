import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, X, ArrowRight, Lock, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import alcateiaLogo from "@/assets/alcateia-logo.png";

interface AlcateiaQuizProps {
  onComplete: () => void;
}

const questions = [
  {
    id: 1,
    question: "Você faz parte da Alcateia?",
    emoji: "🐺",
    yesText: "Sim, sou da Alcateia!",
    noText: "Não faço parte"
  },
  {
    id: 2,
    question: "Você estava na última live de quinta-feira?",
    emoji: "📺",
    yesText: "Sim, estava lá!",
    noText: "Não consegui assistir"
  },
  {
    id: 3,
    question: "Quer fazer parte da construção de algo grandioso que está acontecendo?",
    emoji: "🚀",
    yesText: "Com certeza, quero participar!",
    noText: "Agora não"
  }
];

export const AlcateiaQuiz = ({ onComplete }: AlcateiaQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isEligible, setIsEligible] = useState(false);

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      // Move to next question
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      // Quiz complete - check if all answers are "yes"
      const allYes = newAnswers.every(a => a === true);
      setIsEligible(allYes);
      setTimeout(() => {
        setShowResult(true);
      }, 300);
    }
  };

  const handleContinue = () => {
    if (isEligible) {
      onComplete();
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <img src={alcateiaLogo} alt="Alcateia" className="h-16 mx-auto mb-2" />
          <p className="text-amber-200/80 text-sm">Verificação de Acesso</p>
        </motion.div>

        {/* Progress bar */}
        {!showResult && (
          <div className="mb-6">
            <div className="h-2 bg-amber-950/50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-center text-amber-200/60 text-xs mt-2">
              Pergunta {currentQuestion + 1} de {questions.length}
            </p>
          </div>
        )}

        {/* Question Card */}
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
            >
              {/* Question emoji */}
              <div className="text-center mb-4">
                <span className="text-5xl">{questions[currentQuestion].emoji}</span>
              </div>

              {/* Question text */}
              <h2 className="text-xl sm:text-2xl font-bold text-center text-slate-800 mb-6">
                {questions[currentQuestion].question}
              </h2>

              {/* Answer buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleAnswer(true)}
                  className="w-full h-14 text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-lg"
                >
                  <Check className="mr-2 h-5 w-5" />
                  {questions[currentQuestion].yesText}
                </Button>
                <Button
                  onClick={() => handleAnswer(false)}
                  variant="outline"
                  className="w-full h-14 text-base border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  <X className="mr-2 h-5 w-5" />
                  {questions[currentQuestion].noText}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center"
            >
              {isEligible ? (
                <>
                  {/* Success state */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                  >
                    <Crown className="h-10 w-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Bem-vindo, Alfa! 🐺
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Você está qualificado para o acesso vitalício exclusivo.
                  </p>
                  <Button
                    onClick={handleContinue}
                    className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-lg"
                  >
                    <Gift className="mr-2 h-5 w-5" />
                    Receber Meu Presente
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  {/* Not eligible state */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Lock className="h-10 w-10 text-slate-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Acesso Exclusivo
                  </h2>
                  <p className="text-slate-600 mb-4">
                    Esta oferta é exclusiva para membros da Alcateia que participaram da última live.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <p className="text-amber-800 text-sm">
                      <strong>Quer fazer parte?</strong> Procure sobre a Alcateia do João Lobo e participe das próximas lives para ter acesso a ofertas como esta.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="w-full h-12"
                  >
                    Conhecer o GRank CRM
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AlcateiaQuiz;
