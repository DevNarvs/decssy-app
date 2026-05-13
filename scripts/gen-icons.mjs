/**
 * Generates all icon variants from the project logo.
 *
 * Source: public/decssy-logo.png (square, ideally 1024px+)
 *
 * Outputs:
 *   public/icons/icon-192.png            — PWA "any" purpose
 *   public/icons/icon-512.png            — PWA "any" purpose
 *   public/icons/icon-maskable-512.png   — PWA "maskable" (source has built-in padding)
 *   app/icon.png                         — Next.js auto-picks for browser favicon link
 *   app/apple-icon.png                   — iOS home-screen icon
 *   public/og-image.png                  — 1200x630 OG share preview
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SOURCE = "public/Decssy-Logo.png";
const CREAM = "#fdf7f2";

await mkdir("public/icons", { recursive: true });

// PWA icons — direct square resize.
await sharp(SOURCE).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(SOURCE).resize(512, 512).png().toFile("public/icons/icon-512.png");

// Maskable variant — our source already includes safe-zone padding (cream
// border), so a direct resize works. Android's adaptive icon system will
// crop into circle/squircle without eating the design.
await sharp(SOURCE)
  .resize(512, 512)
  .png()
  .toFile("public/icons/icon-maskable-512.png");

// Next.js App Router convention — auto-emits proper <link rel="icon"> tags.
await sharp(SOURCE).resize(256, 256).png().toFile("app/icon.png");
await sharp(SOURCE).resize(180, 180).png().toFile("app/apple-icon.png");

// OG image — 1200x630 with cream background, logo centered.
const ogCanvas = await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: CREAM,
  },
})
  .png()
  .toBuffer();

const ogLogo = await sharp(SOURCE).resize(560, 560).png().toBuffer();

await sharp(ogCanvas)
  .composite([{ input: ogLogo, gravity: "center" }])
  .png()
  .toFile("public/og-image.png");

console.log("✓ Generated PWA icons (192/512/maskable-512)");
console.log("✓ Generated app/icon.png + app/apple-icon.png (browser + iOS)");
console.log("✓ Generated public/og-image.png (1200×630 share preview)");
