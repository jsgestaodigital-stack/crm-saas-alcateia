import { motion } from "framer-motion";
import { MapPin, Star, Phone, Camera, MessageCircle, Clock, TrendingUp, CheckCircle2 } from "lucide-react";

// Floating Map Pins Component
export const FloatingMapPins = () => {
  const pins = [
    { x: 10, y: 20, delay: 0, size: "lg" },
    { x: 85, y: 15, delay: 0.5, size: "md" },
    { x: 25, y: 70, delay: 1, size: "sm" },
    { x: 75, y: 65, delay: 1.5, size: "md" },
    { x: 50, y: 35, delay: 0.8, size: "lg" },
    { x: 15, y: 45, delay: 1.2, size: "sm" },
    { x: 90, y: 50, delay: 0.3, size: "sm" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pins.map((pin, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: pin.delay, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={`
              ${pin.size === "lg" ? "w-10 h-10" : pin.size === "md" ? "w-8 h-8" : "w-6 h-6"}
              rounded-full bg-google-red/20 flex items-center justify-center
            `}>
              <MapPin className={`
                ${pin.size === "lg" ? "h-6 w-6" : pin.size === "md" ? "h-5 w-5" : "h-4 w-4"}
                text-google-red
              `} />
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

// Google Stars Rating Component
export const GoogleStars = ({ rating = 5, size = "md", showText = true }: { 
  rating?: number; 
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}) => {
  const starSize = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-sm";
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${star <= rating ? "text-google-yellow fill-google-yellow" : "text-muted-foreground/30"}`}
        />
      ))}
      {showText && (
        <span className={`${textSize} font-semibold ml-1 text-foreground`}>{rating.toFixed(1)}</span>
      )}
    </div>
  );
};

// GMB Profile Mockup Card
export const GMBProfileMockup = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`bg-white rounded-2xl shadow-xl border border-border overflow-hidden max-w-sm ${className}`}
    >
      {/* Cover Image */}
      <div className="h-24 bg-gradient-to-r from-google-green via-google-blue to-google-green relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
      </div>
      
      {/* Profile Info */}
      <div className="p-4 -mt-8 relative">
        <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center mb-3">
          <MapPin className="h-8 w-8 text-google-red" />
        </div>
        
        <h3 className="font-bold text-lg text-foreground mb-1">Seu Negócio Local</h3>
        <p className="text-sm text-muted-foreground mb-2">Marketing Digital • São Paulo, SP</p>
        
        <GoogleStars rating={4.8} size="sm" />
        
        <p className="text-xs text-muted-foreground mt-1">127 avaliações</p>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-google-blue text-white text-xs font-medium">
            <Phone className="h-3.5 w-3.5" />
            Ligar
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border border-google-blue text-google-blue text-xs font-medium">
            <MapPin className="h-3.5 w-3.5" />
            Rotas
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border border-border text-foreground text-xs font-medium">
            <MessageCircle className="h-3.5 w-3.5" />
            Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Stats Card with Google Style - Compact for 4-column layout
export const GMBStatsCard = ({ 
  icon: Icon, 
  value, 
  label, 
  color = "green",
  delay = 0 
}: { 
  icon: React.ElementType; 
  value: string | number; 
  label: string;
  color?: "green" | "blue" | "yellow" | "red";
  delay?: number;
}) => {
  const colorClasses = {
    green: "bg-google-green/10 text-google-green border-google-green/20",
    blue: "bg-google-blue/10 text-google-blue border-google-blue/20",
    yellow: "bg-google-yellow/10 text-google-yellow border-google-yellow/20",
    red: "bg-google-red/10 text-google-red border-google-red/20",
  };

  const iconBgClasses = {
    green: "bg-google-green/10",
    blue: "bg-google-blue/10",
    yellow: "bg-google-yellow/10",
    red: "bg-google-red/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={`p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border ${colorClasses[color]} bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-center`}
    >
      <div className={`w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-3 ${iconBgClasses[color]}`}>
        <Icon className="h-4 w-4 sm:h-6 sm:w-6 md:h-7 md:w-7" />
      </div>
      <div className="text-sm sm:text-2xl md:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">{value}</div>
      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-tight">{label}</div>
    </motion.div>
  );
};

// Checklist Visual Component
export const GMBChecklistPreview = ({ className = "" }: { className?: string }) => {
  const items = [
    { label: "Categorias principais e secundárias", checked: true },
    { label: "Descrição com palavras-chave", checked: true },
    { label: "Fotos (fachada, interna, produtos)", checked: true },
    { label: "Posts semanais", checked: false },
    { label: "Respostas de avaliações", checked: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`bg-white rounded-xl border-2 border-google-green/30 p-4 shadow-lg ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-google-green/10 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-google-green" />
        </div>
        <span className="font-semibold text-sm text-foreground">Checklist de Otimização GMB</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 text-sm"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              item.checked 
                ? "bg-google-green text-white" 
                : "border-2 border-muted-foreground/30"
            }`}>
              {item.checked && <CheckCircle2 className="h-3.5 w-3.5" />}
            </div>
            <span className={item.checked ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
            </span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold text-google-green">60%</span>
        </div>
        <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "60%" }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-google-green rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

// Google-style Badge
export const GMBBadge = ({ 
  children, 
  variant = "green" 
}: { 
  children: React.ReactNode; 
  variant?: "green" | "blue" | "yellow" | "red" | "dark";
}) => {
  const variants = {
    green: "bg-google-green/10 text-google-green border-google-green/20",
    blue: "bg-google-blue/10 text-google-blue border-google-blue/20",
    yellow: "bg-google-yellow/10 text-google-yellow border-google-yellow/20",
    red: "bg-google-red/10 text-google-red border-google-red/20",
    dark: "bg-slate-800 text-white border-slate-700",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Wave Divider with Google Green
export const GMBWaveDivider = ({ 
  position = "bottom", 
  color = "white" 
}: { 
  position?: "top" | "bottom"; 
  color?: "white" | "gray" | "green" | "dark";
}) => {
  const fillColors = {
    white: "#FFFFFF",
    gray: "#F8F9FA",
    green: "#E8F5E9",
    dark: "#0A1628",
  };

  return (
    <div className={`absolute left-0 right-0 w-full overflow-hidden pointer-events-none ${
      position === "bottom" ? "bottom-0" : "top-0 rotate-180"
    }`}>
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-16 md:h-24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill={fillColors[color]}
          d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,70 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
};

// Testimonial Card with Google Style
export const GMBTestimonialCard = ({
  quote,
  author,
  role,
  rating = 5,
  delay = 0,
}: {
  quote: string;
  author: string;
  role: string;
  rating?: number;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-gmb-light-green rounded-2xl p-6 relative group hover:shadow-lg transition-all duration-300"
    >
      {/* Quote mark */}
      <div className="absolute top-4 left-4 text-5xl text-google-green/30 font-serif leading-none">"</div>
      
      <div className="relative pt-6">
        <GoogleStars rating={rating} size="sm" showText={false} />
        
        <p className="mt-3 text-foreground leading-relaxed italic">"{quote}"</p>
        
        <div className="mt-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-google-green/20 flex items-center justify-center">
            <span className="text-google-green font-bold text-lg">{author.charAt(0)}</span>
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

// Feature Card with Google Styling
export const GMBFeatureCard = ({
  icon: Icon,
  title,
  description,
  highlight = false,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`rounded-2xl p-6 transition-all duration-300 ${
        highlight 
          ? "bg-white border-2 border-google-green shadow-lg shadow-google-green/10" 
          : "bg-white border-2 border-border hover:border-google-green/50 shadow-sm hover:shadow-md"
      }`}
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
        highlight ? "bg-google-green/15" : "bg-gmb-light-green"
      }`}>
        <Icon className={`h-7 w-7 ${highlight ? "text-google-green" : "text-google-green"}`} />
      </div>
      
      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-google-green transition-colors">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};
