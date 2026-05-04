/**
 * Fetches /kuuza-logo.png and returns it as a base64 data URL for use with
 * jsPDF's addImage(). Returns null gracefully if the image fails to load
 * so PDF generation still works without the logo.
 */
export const fetchLogoBase64 = async () => {
  try {
    const res  = await fetch('/kuuza-logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror  = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Draws the logo in the top-left of the PDF header, then returns the x
 * offset that text should start at (right of the logo).
 */
export const drawLogo = (doc, logoBase64, headerHeight) => {
  if (!logoBase64) return 14; // fallback: text starts at left margin

  const logoH = headerHeight - 8;   // a little breathing room top and bottom
  const logoW = logoH;               // square aspect — logo is roughly 1:1
  const x     = 10;
  const y     = (headerHeight - logoH) / 2;

  doc.addImage(logoBase64, 'PNG', x, y, logoW, logoH);
  return x + logoW + 4;              // text starts just after the logo
};