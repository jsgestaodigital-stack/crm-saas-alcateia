/**
 * Visual PDF Export Utility - GBP Check Style
 * Generates professional PDF with white background, clean layout
 * 
 * @param {Object} options
 * @param {HTMLElement} options.rootEl - Root element to capture (#print-report-root)
 * @param {string} options.filename - Output filename
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function exportVisualPdf(options) {
  const { rootEl, filename } = options;

  if (!rootEl) {
    console.error('Visual PDF Export: No root element provided');
    return { success: false, error: 'No root element provided' };
  }

  let cloneWrapper = null;

  try {
    // Dynamic imports
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).jsPDF;

    // ========================================
    // 1. PREPARE DOM - scroll to top & stabilize
    // ========================================
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('resize'));
    await new Promise(r => setTimeout(r, 300));

    // ========================================
    // 2. CREATE OFFSCREEN CLONE WITH A4 WIDTH
    // ========================================
    const A4_WIDTH_PX = 1123; // Higher quality (≈297mm at 96dpi * 4)
    
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
    // 3. INJECT PDF THEME STYLES
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
      
      /* Override dark theme colors */
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
      
      /* Cards - clean light style */
      #pdf-export-wrapper [class*="rounded"],
      #pdf-export-wrapper .card,
      #pdf-export-wrapper [class*="Card"] {
        background: #f8f9fa !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
      }
      
      /* Remove heavy shadows and backdrop filters */
      #pdf-export-wrapper * {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      
      #pdf-export-wrapper [class*="shadow-lg"],
      #pdf-export-wrapper [class*="shadow-xl"],
      #pdf-export-wrapper [class*="shadow-2xl"] {
        box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
      }
      
      /* Charts - ensure visibility */
      #pdf-export-wrapper .recharts-wrapper,
      #pdf-export-wrapper [class*="chart"],
      #pdf-export-wrapper svg {
        min-height: 200px !important;
        width: 100% !important;
      }
      
      #pdf-export-wrapper .recharts-surface {
        overflow: visible !important;
      }
      
      /* KPI cards styling */
      #pdf-export-wrapper [class*="grid"] > div {
        background: #f8f9fa !important;
        border: 1px solid #e2e8f0 !important;
        padding: 16px !important;
        border-radius: 8px !important;
      }
      
      /* Section spacing */
      #pdf-export-wrapper .print-section {
        margin-bottom: 32px !important;
        padding: 24px !important;
        page-break-inside: avoid !important;
      }
      
      /* Tables */
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
      
      /* Primary/accent colors - keep but soften */
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
      
      /* Progress bars */
      #pdf-export-wrapper [class*="progress"] {
        background: #e2e8f0 !important;
      }
      
      /* Badges */
      #pdf-export-wrapper [class*="badge"] {
        border: 1px solid #d1d5db !important;
      }
      
      /* Hide elements that shouldn't appear */
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

    // Wait for styles to apply
    await new Promise(r => setTimeout(r, 400));

    // ========================================
    // 5. PDF SETUP - A4 with margins
    // ========================================
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2 - 10; // Leave space for page numbers

    // ========================================
    // 6. ADD HEADER/COVER PAGE
    // ========================================
    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Green accent bar at top
    pdf.setFillColor(5, 150, 105); // #059669
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RANKEIA', margin, 20);
    
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

    // ========================================
    // 7. HTML2CANVAS OPTIONS - PRO SETTINGS
    // ========================================
    const canvasOptions = {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: A4_WIDTH_PX,
      windowHeight: cloneWrapper.scrollHeight,
    };

    // ========================================
    // 8. FIND SECTIONS & CAPTURE
    // ========================================
    const sections = clone.querySelectorAll('.print-section');
    const elementsToCapture = sections.length > 0 ? Array.from(sections) : [clone];

    for (const element of elementsToCapture) {
      try {
        // Add new page for content
        pdf.addPage();

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
          const imgData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
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

              const sliceData = tempCanvas.toDataURL('image/png', 1.0);
              pdf.addImage(sliceData, 'PNG', margin, margin, contentWidth, thisSliceMm);
            }

            sourceY += thisSliceHeight;
            pageNum++;
          }
        }
      } catch (err) {
        console.warn('Failed to capture section:', err);
      }
    }

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
        pdf.text('RANKEIA - Relatório do Gestor', margin, pageHeight - 6);
      }
    }

    // ========================================
    // 11. CLEANUP & SAVE
    // ========================================
    if (cloneWrapper && cloneWrapper.parentNode) {
      cloneWrapper.parentNode.removeChild(cloneWrapper);
    }

    pdf.save(filename);
    
    return { success: true };

  } catch (error) {
    console.error('Visual PDF Export failed:', error);
    
    // Cleanup on error
    if (cloneWrapper && cloneWrapper.parentNode) {
      cloneWrapper.parentNode.removeChild(cloneWrapper);
    }
    
    return { success: false, error: error.message || 'Unknown error' };
  }
}
