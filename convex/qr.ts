/**
 * QR code generation as a Convex action (runs in Node.js, not the V8
 * isolate used by queries/mutations — `qrcode` needs Node APIs).
 *
 * Returns an SVG string. The caller embeds it via dangerouslySetInnerHTML.
 */
"use node";

import QRCode from "qrcode";
import { v } from "convex/values";
import { action } from "./_generated/server";

export const generate = action({
  args: { data: v.string() },
  handler: async (_ctx, { data }): Promise<string> => {
    // `margin: 4` is the QR spec's minimum "quiet zone" — older Android
    // cameras and Google Lens reject codes with less padding. (We previously
    // used 1 to make the code visually bigger; that broke scanning.)
    //
    // `errorCorrectionLevel: 'M'` (15% recovery) is a good balance for URLs
    // — survives partial glare/damage when scanning from a phone screen.
    const svg = await QRCode.toString(data, {
      type: "svg",
      width: 256,
      margin: 4,
      errorCorrectionLevel: "M",
      color: {
        dark: "#2c1f17", // Peach Fuzz text color
        light: "#fdf7f2", // Peach Fuzz bg
      },
    });
    return svg;
  },
});
