// @ts-ignore
import html2pdf from 'html2pdf.js';

export const downloadInvoicePdf = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const opt = {
        margin: 0.3,
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
        html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error('PDF generation error, falling back to print:', err);
        window.print();
    }
};
