/**
 * Visual PDF Export Utility - G-Rank CRM
 * Generates professional PDF with white background, clean layout
 * 
 * PERFORMANCE OPTIMIZATIONS FOR MOBILE:
 * - Reduced scale on mobile devices (1.5x vs 2x)
 * - Progressive section rendering with garbage collection
 * - Memory cleanup between sections
 * - Abort capability for long operations
 * - Chunked processing to prevent UI freezing
 * 
 * @param {Object} options
 * @param {HTMLElement} options.rootEl - Root element to capture (#print-report-root)
 * @param {string} options.filename - Output filename
 * @param {function} options.onProgress - Progress callback (0-100)
 * @param {AbortSignal} options.signal - AbortSignal for cancellation
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function exportVisualPdf(options) {
  const { rootEl, filename, onProgress, signal } = options;

  if (!rootEl) {
    console.error('Visual PDF Export: No root element provided');
    return { success: false, error: 'No root element provided' };
  }

  let cloneWrapper = null;

  // Detect mobile device for performance adjustments
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  const isLowMemory = navigator.deviceMemory ? navigator.deviceMemory < 4 : isMobile;

  try {
    // Check for abort before starting
    if (signal?.aborted) {
      return { success: false, error: 'Export cancelled' };
    }

    onProgress?.(5);

    // Dynamic imports
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).jsPDF;

    onProgress?.(10);

    // ========================================
    // 1. PREPARE DOM - scroll to top & stabilize
    // ========================================
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('resize'));
    await yieldToMain(100);

    // ========================================
    // 2. CREATE OFFSCREEN CLONE WITH A4 WIDTH
    // ========================================
    // Reduced width for mobile to lower memory usage
    const A4_WIDTH_PX = isMobile ? 794 : 1123; // Lower for mobile
    
    cloneWrapper = document.createElement('div');
    cloneWrapper.id = 'pdf-export-wrapper';
    cloneWrapper.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${A4_WIDTH_PX}px;
      background: #ffffff;
      z-index: -9999;
      overflow: visible;
    `;

    // Clone the content
    const clone = rootEl.cloneNode(true);
    clone.style.width = '100%';
    clone.style.maxWidth = 'none';
    clone.style.margin = '0';
    clone.style.padding = '40px';
    clone.style.boxSizing = 'border-box';

    // ========================================
    // 3. INJECT PDF THEME STYLES (Simplified for perf)
    // ========================================
    const pdfStyles = document.createElement('style');
    pdfStyles.textContent = `
      #pdf-export-wrapper,
      #pdf-export-wrapper * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      #pdf-export-wrapper {
        background: #ffffff !important;
        color: #1a1a1a !important;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
      }
      
      #pdf-export-wrapper [class*="bg-background"],
      #pdf-export-wrapper [class*="bg-card"],
      #pdf-export-wrapper [class*="bg-muted"],
      #pdf-export-wrapper .print-section {
        background: #ffffff !important;
      }
      
      #pdf-export-wrapper [class*="text-foreground"],
      #pdf-export-wrapper [class*="text-card"],
      #pdf-export-wrapper h1, 
      #pdf-export-wrapper h2, 
      #pdf-export-wrapper h3, 
      #pdf-export-wrapper h4,
      #pdf-export-wrapper p,
      #pdf-export-wrapper span,
      #pdf-export-wrapper div {
        color: #1a1a1a !important;
      }
      
      #pdf-export-wrapper [class*="text-muted"] {
        color: #666666 !important;
      }
      
      #pdf-export-wrapper [class*="rounded"],
      #pdf-export-wrapper .card,
      #pdf-export-wrapper [class*="Card"] {
        background: #f8f9fa !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
      }
      
      #pdf-export-wrapper * {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      
      #pdf-export-wrapper [class*="shadow-lg"],
      #pdf-export-wrapper [class*="shadow-xl"],
      #pdf-export-wrapper [class*="shadow-2xl"] {
        box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
      }
      
      #pdf-export-wrapper .recharts-wrapper,
      #pdf-export-wrapper [class*="chart"],
      #pdf-export-wrapper svg {
        min-height: 200px !important;
        width: 100% !important;
      }
      
      #pdf-export-wrapper .recharts-surface {
        overflow: visible !important;
      }
      
      #pdf-export-wrapper [class*="grid"] > div {
        background: #f8f9fa !important;
        border: 1px solid #e2e8f0 !important;
        padding: 16px !important;
        border-radius: 8px !important;
      }
      
      #pdf-export-wrapper .print-section {
        margin-bottom: 32px !important;
        padding: 24px !important;
        page-break-inside: avoid !important;
      }
      
      #pdf-export-wrapper table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      
      #pdf-export-wrapper th,
      #pdf-export-wrapper td {
        border: 1px solid #e2e8f0 !important;
        padding: 8px 12px !important;
        background: #ffffff !important;
        color: #1a1a1a !important;
      }
      
      #pdf-export-wrapper th {
        background: #f1f5f9 !important;
        font-weight: 600 !important;
      }
      
      #pdf-export-wrapper [class*="text-primary"],
      #pdf-export-wrapper [class*="text-green"],
      #pdf-export-wrapper [class*="text-emerald"] {
        color: #059669 !important;
      }
      
      #pdf-export-wrapper [class*="bg-primary"],
      #pdf-export-wrapper [class*="bg-green"],
      #pdf-export-wrapper [class*="bg-emerald"] {
        background: #059669 !important;
        color: #ffffff !important;
      }
      
      #pdf-export-wrapper [class*="progress"] {
        background: #e2e8f0 !important;
      }
      
      #pdf-export-wrapper [class*="badge"] {
        border: 1px solid #d1d5db !important;
      }
      
      #pdf-export-wrapper [role="dialog"],
      #pdf-export-wrapper [data-radix-portal],
      #pdf-export-wrapper [data-sonner-toaster],
      #pdf-export-wrapper .no-print,
      #pdf-export-wrapper button,
      #pdf-export-wrapper [class*="toast"] {
        display: none !important;
      }
    `;

    cloneWrapper.appendChild(pdfStyles);
    cloneWrapper.appendChild(clone);
    document.body.appendChild(cloneWrapper);

    onProgress?.(15);

    // ========================================
    // 4. REMOVE UNWANTED ELEMENTS FROM CLONE
    // ========================================
    const removeSelectors = [
      '[role="dialog"]',
      '[data-radix-portal]',
      '[data-sonner-toaster]',
      '.no-print',
      'button',
      '[class*="toast"]',
      '[class*="Toaster"]',
      '.overlay'
    ];
    
    removeSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Wait for styles to apply (shorter for mobile)
    await yieldToMain(isMobile ? 200 : 400);

    onProgress?.(20);

    // ========================================
    // 5. PDF SETUP - A4 with margins
    // ========================================
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2 - 10;

    // ========================================
    // 6. ADD HEADER/COVER PAGE
    // ========================================
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Green accent bar at top
    pdf.setFillColor(5, 150, 105); // #059669
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('G-RANK CRM', margin, 20);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Relatório do Gestor', margin, 30);
    
    // Date info
    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(11);
    pdf.text(`Gerado em: ${dateStr}`, margin, 55);
    
    // Extract period from filename if available
    const periodMatch = filename.match(/(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/);
    if (periodMatch) {
      const startDate = periodMatch[1].split('-').reverse().join('/');
      const endDate = periodMatch[2].split('-').reverse().join('/');
      pdf.text(`Período: ${startDate} a ${endDate}`, margin, 62);
    }

    onProgress?.(25);

    // ========================================
    // 7. HTML2CANVAS OPTIONS - MOBILE OPTIMIZED
    // ========================================
    const canvasOptions = {
      scale: isLowMemory ? 1.5 : 2, // Lower scale for mobile/low memory
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: A4_WIDTH_PX,
      windowHeight: cloneWrapper.scrollHeight,
      imageTimeout: 5000, // Limit image loading time
      removeContainer: false,
    };

    // ========================================
    // 8. FIND SECTIONS & CAPTURE PROGRESSIVELY
    // ========================================
    const sections = clone.querySelectorAll('.print-section');
    const elementsToCapture = sections.length > 0 ? Array.from(sections) : [clone];
    const totalSections = elementsToCapture.length;

    for (let i = 0; i < elementsToCapture.length; i++) {
      // Check for abort
      if (signal?.aborted) {
        cleanup(cloneWrapper);
        return { success: false, error: 'Export cancelled' };
      }

      const element = elementsToCapture[i];
      const sectionProgress = 25 + ((i / totalSections) * 65);
      onProgress?.(Math.round(sectionProgress));

      try {
        // Add new page for content
        pdf.addPage();

        // Yield to main thread between sections (prevents UI freeze)
        await yieldToMain(isMobile ? 50 : 10);

        // Capture this section
        const canvas = await html2canvas(element, canvasOptions);
        
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          console.warn('Empty canvas for section');
          continue;
        }

        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pixelsPerMm = canvas.width / contentWidth;

        // ========================================
        // 9. ADD CONTENT - SLICE IF TOO TALL
        // ========================================
        if (imgHeight <= contentHeight) {
          // Fits in one page
          const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG is smaller
          pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        } else {
          // Need to slice into multiple pages
          let sourceY = 0;
          let pageNum = 0;
          const slicePixelHeight = contentHeight * pixelsPerMm;

          while (sourceY < canvas.height) {
            if (pageNum > 0) {
              pdf.addPage();
            }

            const remainingPixels = canvas.height - sourceY;
            const thisSliceHeight = Math.min(slicePixelHeight, remainingPixels);
            const thisSliceMm = thisSliceHeight / pixelsPerMm;

            // Create temporary canvas for this slice
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = thisSliceHeight;
            const ctx = tempCanvas.getContext('2d');

            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              ctx.drawImage(
                canvas,
                0, sourceY, canvas.width, thisSliceHeight,
                0, 0, canvas.width, thisSliceHeight
              );

              const sliceData = tempCanvas.toDataURL('image/jpeg', 0.85);
              pdf.addImage(sliceData, 'JPEG', margin, margin, contentWidth, thisSliceMm);
            }

            // Cleanup temp canvas
            tempCanvas.width = 0;
            tempCanvas.height = 0;

            sourceY += thisSliceHeight;
            pageNum++;

            // Yield between slices on mobile
            if (isMobile && pageNum % 2 === 0) {
              await yieldToMain(10);
            }
          }
        }

        // Clear canvas memory after processing
        canvas.width = 0;
        canvas.height = 0;

      } catch (err) {
        console.warn('Failed to capture section:', err);
      }
    }

    onProgress?.(90);

    // ========================================
    // 10. ADD PAGE NUMBERS & FOOTER
    // ========================================
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Footer line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      
      // Page number
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
      
      // Footer text
      if (i > 1) {
        pdf.text('G-Rank CRM - Relatório do Gestor', margin, pageHeight - 6);
      }
    }

    onProgress?.(95);

    // ========================================
    // 11. CLEANUP & SAVE
    // ========================================
    cleanup(cloneWrapper);
    cloneWrapper = null;

    pdf.save(filename);
    
    onProgress?.(100);
    
    return { success: true };

  } catch (error) {
    console.error('Visual PDF Export failed:', error);
    cleanup(cloneWrapper);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Cleanup helper function
 */
function cleanup(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Yield to main thread to prevent UI freezing
 * Uses requestIdleCallback when available, falls back to setTimeout
 */
function yieldToMain(minDelay = 0) {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        setTimeout(resolve, minDelay);
      }, { timeout: 100 });
    } else {
      setTimeout(resolve, Math.max(minDelay, 16));
    }
  });
}

/**
 * Lightweight PDF export for contracts - simpler, faster
 * Uses lower quality settings for faster processing on mobile
 */
export async function exportContractPdf(options) {
  const { rootEl, filename, onProgress, signal } = options;

  if (!rootEl) {
    return { success: false, error: 'No root element provided' };
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

  try {
    if (signal?.aborted) {
      return { success: false, error: 'Export cancelled' };
    }

    onProgress?.(10);

    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).jsPDF;

    onProgress?.(20);

    // Simpler capture for contracts
    const canvas = await html2canvas(rootEl, {
      scale: isMobile ? 1.2 : 1.5,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      imageTimeout: 3000,
    });

    onProgress?.(60);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= contentHeight) {
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
    } else {
      // Multi-page
      const pixelsPerMm = canvas.width / contentWidth;
      const slicePixelHeight = contentHeight * pixelsPerMm;
      let sourceY = 0;
      let pageNum = 0;

      while (sourceY < canvas.height) {
        if (pageNum > 0) pdf.addPage();

        const thisSliceHeight = Math.min(slicePixelHeight, canvas.height - sourceY);
        const thisSliceMm = thisSliceHeight / pixelsPerMm;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = thisSliceHeight;
        const ctx = tempCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(canvas, 0, sourceY, canvas.width, thisSliceHeight, 0, 0, canvas.width, thisSliceHeight);
          
          const sliceData = tempCanvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(sliceData, 'JPEG', margin, margin, contentWidth, thisSliceMm);
        }

        tempCanvas.width = 0;
        tempCanvas.height = 0;
        sourceY += thisSliceHeight;
        pageNum++;

        if (isMobile) await yieldToMain(20);
        onProgress?.(60 + (sourceY / canvas.height) * 30);
      }
    }

    onProgress?.(95);

    canvas.width = 0;
    canvas.height = 0;

    pdf.save(filename);
    onProgress?.(100);

    return { success: true };

  } catch (error) {
    console.error('Contract PDF Export failed:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
