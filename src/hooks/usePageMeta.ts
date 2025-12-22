import { useEffect } from "react";

interface PageMetaOptions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
}

/**
 * Hook to dynamically update page meta tags for SEO and social sharing
 * Restores original meta tags on unmount
 */
export function usePageMeta(options: PageMetaOptions) {
  useEffect(() => {
    // Store original values
    const originalTitle = document.title;
    const originalDescription = document.querySelector('meta[name="description"]')?.getAttribute("content");
    const originalOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const originalOgDescription = document.querySelector('meta[property="og:description"]')?.getAttribute("content");
    const originalOgImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    const originalOgType = document.querySelector('meta[property="og:type"]')?.getAttribute("content");

    // Update title
    if (options.title) {
      document.title = options.title;
    }

    // Helper to update or create meta tag
    const updateMeta = (selector: string, attribute: string, value: string | undefined, createName: string, createType: "name" | "property" = "name") => {
      if (!value) return;
      
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (meta) {
        meta.setAttribute(attribute, value);
      } else {
        meta = document.createElement("meta");
        meta.setAttribute(createType, createName);
        meta.setAttribute(attribute, value);
        document.head.appendChild(meta);
      }
    };

    // Update meta tags
    updateMeta('meta[name="description"]', "content", options.description, "description", "name");
    updateMeta('meta[property="og:title"]', "content", options.ogTitle || options.title, "og:title", "property");
    updateMeta('meta[property="og:description"]', "content", options.ogDescription || options.description, "og:description", "property");
    updateMeta('meta[property="og:image"]', "content", options.ogImage, "og:image", "property");
    updateMeta('meta[property="og:type"]', "content", options.ogType, "og:type", "property");
    updateMeta('meta[name="twitter:card"]', "content", options.twitterCard, "twitter:card", "name");

    // Cleanup: restore original values
    return () => {
      document.title = originalTitle;
      
      const restoreMeta = (selector: string, originalValue: string | null | undefined) => {
        const meta = document.querySelector(selector);
        if (meta && originalValue) {
          meta.setAttribute("content", originalValue);
        }
      };

      restoreMeta('meta[name="description"]', originalDescription);
      restoreMeta('meta[property="og:title"]', originalOgTitle);
      restoreMeta('meta[property="og:description"]', originalOgDescription);
      restoreMeta('meta[property="og:image"]', originalOgImage);
      restoreMeta('meta[property="og:type"]', originalOgType);
    };
  }, [options.title, options.description, options.ogTitle, options.ogDescription, options.ogImage, options.ogType, options.twitterCard]);
}

export default usePageMeta;
