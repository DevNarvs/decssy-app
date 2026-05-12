/**
 * Generates PWA icon placeholders from an inline SVG.
 *
 * Outputs:
 *   public/icons/icon-192.png            — 192x192, "any" purpose
 *   public/icons/icon-512.png            — 512x512, "any" purpose
 *   public/icons/icon-maskable-512.png   — 512x512, "maskable" with safe-zone padding
 *
 * Plan 10 (Polish) replaces these with proper brand assets.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const BRAND_PINK = "#e8519a";
const BRAND_CREAM = "#fdf7f2";

// Standard PWA icon — bold D on pink background, rounded 21% corner radius
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BRAND_PINK}" rx="108"/>
  <text x="50%" y="60%" font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" font-size="320" font-weight="900" fill="${BRAND_CREAM}" text-anchor="middle">D</text>
</svg>`;

// Maskable icon — same letter but content fits a 60% safe zone (icon stays visible when
// platforms apply circular, squircle, or teardrop masks).
const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BRAND_PINK}"/>
  <text x="50%" y="58%" font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" font-size="220" font-weight="900" fill="${BRAND_CREAM}" text-anchor="middle">D</text>
</svg>`;

await mkdir("public/icons", { recursive: true });

await sharp(Buffer.from(ICON_SVG)).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(ICON_SVG)).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(Buffer.from(MASKABLE_SVG)).resize(512, 512).png().toFile("public/icons/icon-maskable-512.png");

console.log("✓ Generated public/icons/icon-192.png");
console.log("✓ Generated public/icons/icon-512.png");
console.log("✓ Generated public/icons/icon-maskable-512.png");
