#!/usr/bin/env node

/**
 * Icon Generator Script
 * Generates PWA icons in multiple sizes from the base SVG
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICON_SIZES = [72, 96, 128, 192, 512];
const MASKABLE_SIZES = [192, 512];
const SOURCE_SVG = join(__dirname, 'public', 'icons', 'icon.svg');
const OUTPUT_DIR = join(__dirname, 'public', 'icons');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  try {
    // Generate standard icons
    for (const size of ICON_SIZES) {
      const outputPath = join(OUTPUT_DIR, `icon-${size}.png`);
      await sharp(SOURCE_SVG)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✅ Generated icon-${size}.png`);
    }

    // Generate maskable icons with safe zone
    for (const size of MASKABLE_SIZES) {
      const outputPath = join(OUTPUT_DIR, `icon-${size}-maskable.png`);
      // For maskable icons, we add 20% padding (safe zone)
      const contentSize = Math.floor(size * 0.8);
      const padding = Math.floor((size - contentSize) / 2);
      
      await sharp(SOURCE_SVG)
        .resize(contentSize, contentSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 44, g: 95, b: 124, alpha: 1 } // #2C5F7C
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Generated icon-${size}-maskable.png`);
    }

    console.log('\n🎉 All icons generated successfully!');
    console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
