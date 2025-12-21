import { cn } from "@/lib/utils";

interface SectionDividerProps {
  variant?: "wave" | "curve" | "diagonal" | "arrow" | "tilt";
  fill?: string;
  className?: string;
  flip?: boolean;
}

export const SectionDivider = ({
  variant = "wave",
  fill = "fill-background",
  className,
  flip = false,
}: SectionDividerProps) => {
  const baseClass = cn(
    "absolute left-0 right-0 w-full h-auto pointer-events-none",
    flip ? "rotate-180" : "",
    className
  );

  if (variant === "wave") {
    return (
      <svg
        className={baseClass}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className={fill}
          d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,70 L1440,120 L0,120 Z"
        />
      </svg>
    );
  }

  if (variant === "curve") {
    return (
      <svg
        className={baseClass}
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className={fill}
          d="M0,100 C480,0 960,0 1440,100 L1440,100 L0,100 Z"
        />
      </svg>
    );
  }

  if (variant === "diagonal") {
    return (
      <svg
        className={baseClass}
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon className={fill} points="0,80 1440,0 1440,80" />
      </svg>
    );
  }

  if (variant === "arrow") {
    return (
      <svg
        className={baseClass}
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon className={fill} points="0,100 720,20 1440,100" />
      </svg>
    );
  }

  if (variant === "tilt") {
    return (
      <svg
        className={baseClass}
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon className={fill} points="0,60 1440,0 1440,60" />
      </svg>
    );
  }

  return null;
};

export default SectionDivider;
