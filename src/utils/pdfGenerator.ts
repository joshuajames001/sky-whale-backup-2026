import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF from a list of DOM elements (pages).
 * @param elementIds Array of DOM IDs for the pages/elements to capture.
 * @param filename Name of the output file.
 * @param onProgress Optional callback to report progress (0-100).
 */
export const generatePdf = async (
    elementIds: string[], 
    filename: string = 'pribeh.pdf',
    onProgress?: (current: number, total: number) => void
) => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 0; i < elementIds.length; i++) {
            if (onProgress) onProgress(i + 1, elementIds.length);

            const element = document.getElementById(elementIds[i]);
            if (!element) continue;

            // Small delay to allow UI update and GC
            await new Promise(r => setTimeout(r, 100));

            // Capture logic
            const canvas = await html2canvas(element, {
                scale: 1.5, // Reduced from 2 for stability
                useCORS: true, 
                logging: false,
                backgroundColor: '#ffffff',
                allowTaint: true,
                imageTimeout: 15000
            });

            // Moderate quality JPEG
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            
            // Calculate dimensions
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (i > 0) doc.addPage();
            
            doc.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        }

        doc.save(filename);
        return true;

    } catch (error) {
        console.error("PDF Generation failed:", error);
        return false;
    }
};
