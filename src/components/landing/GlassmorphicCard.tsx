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
        y: -4,
        transition: { duration: 0.2 }
      } : undefined}
      className={`relative group ${className}`}
    >
      {/* Card content */}
      <div className="relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
        {/* Shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </GlassmorphicCard>
  );
};
