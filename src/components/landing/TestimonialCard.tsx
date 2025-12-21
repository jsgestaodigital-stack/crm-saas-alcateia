import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  delay?: number;
}

export const TestimonialCard = ({ quote, author, role, delay = 0 }: TestimonialCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
      
      <div className="relative bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 p-6 h-full transition-all duration-300 group-hover:border-primary/30">
        <Quote className="h-8 w-8 text-primary/30 mb-4" />
        
        <p className="text-foreground mb-6 italic leading-relaxed">"{quote}"</p>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
            {author.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-foreground">{author}</div>
            <div className="text-sm text-muted-foreground">{role}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
