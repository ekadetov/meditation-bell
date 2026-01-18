# App Icons

This directory contains the app icons for the Awakening Bell PWA.

## Icon Files

The base icon is `icon.svg`, featuring a meditation bell with a lotus symbol.

### Required Icon Sizes

For PWA support, the following PNG sizes are needed:
- 72x72 - Small devices
- 96x96 - Medium devices
- 128x128 - High-res small devices
- 192x192 - Standard PWA icon
- 512x512 - High-res PWA icon

### Generating PNG Icons

#### Option 1: Using Online Tools
1. Visit [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload `icon.svg`
3. Download the generated icons
4. Place them in this directory

#### Option 2: Using ImageMagick (CLI)
```bash
# Install ImageMagick first
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Linux

# Generate all sizes
convert icon.svg -resize 72x72 icon-72.png
convert icon.svg -resize 96x96 icon-96.png
convert icon.svg -resize 128x128 icon-128.png
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png

# Generate maskable icons (with safe zone)
convert icon.svg -resize 192x192 -background "#2C5F7C" -gravity center -extent 192x192 icon-192-maskable.png
convert icon.svg -resize 512x512 -background "#2C5F7C" -gravity center -extent 512x512 icon-512-maskable.png
```

#### Option 3: Using Sharp (Node.js)
```bash
npm install sharp --save-dev
node generate-icons.js
```

See `generate-icons.js` in the project root for the implementation.

### Maskable Icons

Maskable icons ensure the icon looks good on all devices, even those that apply masks (like Android adaptive icons). The safe zone is 80% of the icon size.

## Design Guidelines

- Primary color: #2C5F7C (Teal Blue)
- Background: #FAF9F6 (Linen)
- Accent: #8B7355 (Warm brown)
- The bell symbolizes mindfulness and awareness
- The lotus represents enlightenment and peace
