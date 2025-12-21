import { useTheme } from "next-themes";
import grankLogoDark from "@/assets/grank-logo-dark.png";
import grankLogoLight from "@/assets/grank-logo-light.png";
import { cn } from "@/lib/utils";

interface ThemeLogoProps {
  className?: string;
  alt?: string;
}

/**
 * Logo component that switches between dark and light versions based on theme
 * - Dark theme (fundo escuro) → Logo com texto branco (grank-logo-light.png)
 * - Light theme (fundo claro) → Logo com texto preto (grank-logo-dark.png)
 */
export function ThemeLogo({ className, alt = "GRank CRM" }: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  
  // For dark backgrounds, use the light logo (white text)
  // For light backgrounds, use the dark logo (black text)
  const logoSrc = resolvedTheme === "dark" ? grankLogoLight : grankLogoDark;
  
  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={cn("w-auto", className)} 
    />
  );
}
