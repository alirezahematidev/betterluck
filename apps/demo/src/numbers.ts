/**
 * Accepts Persian (۰-۹) and Arabic (٠-٩) digits as well as ASCII ones. "." and "٫" are decimal
 * separators; "," and "٬" group thousands and are ignored.
 */
export function parseLocaleNumber(text: string): number {
  const ascii = text
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/٫/g, ".")
    .replace(/[٬,\s]/g, "")
    .trim();
  return ascii === "" ? Number.NaN : Number(ascii);
}
