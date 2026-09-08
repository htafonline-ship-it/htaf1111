const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const sourceLogo = path.join(process.cwd(), 'src/assets/images/htaf_education_logo_1786735151763.jpg');

async function generateIcons() {
  console.log('Generating PWA icons from official logo...');

  // 1. Standard 192x192 icon
  await sharp(sourceLogo)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created pwa-192x192.png');

  // 2. Standard 512x512 icon
  await sharp(sourceLogo)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created pwa-512x512.png');

  // 3. Apple Touch Icon (180x180)
  await sharp(sourceLogo)
    .resize(180, 180, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // 4. Favicon PNGs
  await sharp(sourceLogo)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(sourceLogo)
    .resize(16, 16, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✓ Created favicons');

  // 5. Maskable 512x512 icon with safe-zone margin (15% padding on dark background #070e22)
  // Inner logo size: 512 * 0.76 = ~390px
  const innerSize = 390;
  const innerLogoBuffer = await sharp(sourceLogo)
    .resize(innerSize, innerSize, { fit: 'cover' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 7, g: 14, b: 34, alpha: 1 } // #070e22
    }
  })
    .composite([
      {
        input: innerLogoBuffer,
        top: Math.round((512 - innerSize) / 2),
        left: Math.round((512 - innerSize) / 2)
      }
    ])
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created pwa-maskable-512x512.png');

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
