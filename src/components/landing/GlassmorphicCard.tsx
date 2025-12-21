import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface GlassmorphicCardProps {
  children: ReactNode;
  className?: string;
  hover3D?: boolean;
  delay?: number;
}

export const GlassmorphicCard = ({
  children,
  className = "",
  hover3D = true,
  delay = 0,
}: GlassmorphicCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover3D ? { 
        rotateX: -2, 
        rotateY: 2, 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : undefined}
      style={{ transformStyle: "preserve-3d" }}
      className={`relative group ${className}`}
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
      
      {/* Card content */}
      <div className="relative bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 group-hover:border-primary/30">
        {/* Shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
        
        {children}
      </div>
    </motion.div>
  );
};

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => {
  return (
    <GlassmorphicCard delay={delay}>
      <div className="p-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </GlassmorphicCard>
  );
};
