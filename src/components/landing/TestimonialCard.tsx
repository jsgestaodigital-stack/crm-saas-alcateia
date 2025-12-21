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
      <div className="relative bg-card rounded-2xl border border-border p-6 h-full transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
        <Quote className="h-8 w-8 text-primary/40 mb-4" />
        
        <p className="text-foreground mb-6 italic leading-relaxed">"{quote}"</p>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-primary-foreground font-bold">
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
