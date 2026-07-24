import jsPDF from "jspdf";

type PdfSection = {
  title: string;
  lines: string[];
};

/**
 * Generates and downloads a clean, readable PDF from a list of sections.
 * @param documentTitle - Title displayed at the top of the PDF and used as filename
 * @param sections - Array of sections, each with a title and array of content lines
 */
export function exportAsPdf(
  documentTitle: string,
  sections: PdfSection[],
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 16;
  const marginRight = 16;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 16) {
      doc.addPage();
      y = 20;
    }
  };

  // Document title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(documentTitle, marginLeft, y);
  y += 10;

  // Divider line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  sections.forEach((section, idx) => {
    ensureSpace(18);

    // Section number + title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const titleText = `${idx + 1}. ${section.title}`;
    const titleLines = doc.splitTextToSize(titleText, contentWidth);
    doc.text(titleLines, marginLeft, y);
    y += titleLines.length * 6 + 2;

    // Section content lines
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    section.lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, contentWidth);
      ensureSpace(wrapped.length * 5 + 2);
      doc.text(wrapped, marginLeft + 4, y);
      y += wrapped.length * 5 + 2;
    });

    // Small gap between sections
    y += 4;

    // Light separator line between sections (except last)
    if (idx < sections.length - 1) {
      ensureSpace(4);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      doc.line(marginLeft, y - 2, pageWidth - marginRight, y - 2);
    }
  });

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `The Gospel of Poetic Frolic — ${documentTitle} — Page ${p} of ${totalPages}`,
      marginLeft,
      pageHeight - 8,
    );
    doc.setTextColor(0, 0, 0);
  }

  const filename = `${documentTitle
    .replace(/[^a-z0-9 ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()}.pdf`;
  doc.save(filename);
}
