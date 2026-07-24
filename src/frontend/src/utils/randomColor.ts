/**
 * Generates a random full-spectrum color excluding black and white
 * Uses HSL color space for better control over saturation and lightness
 * @returns CSS color string in HSL format
 */
export function generateRandomColor(): string {
  // Random hue (0-360 degrees for full spectrum)
  const hue = Math.floor(Math.random() * 360);

  // High saturation (60-100%) to avoid grayscale
  const saturation = 60 + Math.floor(Math.random() * 40);

  // Mid-range lightness (40-70%) to avoid black/white
  const lightness = 40 + Math.floor(Math.random() * 30);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generates multiple distinct random colors
 * @param count - Number of colors to generate
 * @returns Array of CSS color strings
 */
export function generateRandomColors(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(generateRandomColor());
  }
  return colors;
}
