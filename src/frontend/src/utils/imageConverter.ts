/**
 * Converts an image File/Blob to WebP format before upload.
 * Falls back to original file if WebP conversion fails or is unsupported.
 */
export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
  // Skip if already WebP or SVG (no conversion needed)
  if (file.type === "image/webp" || file.type === "image/svg+xml") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // fallback
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // fallback
            return;
          }
          const webpFileName = file.name.replace(/\.[^.]+$/, ".webp");
          const webpFile = new File([blob], webpFileName, {
            type: "image/webp",
          });
          resolve(webpFile);
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original
    };

    img.src = url;
  });
}
