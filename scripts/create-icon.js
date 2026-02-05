const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcon() {
  const inputPath = path.join(__dirname, '..', 'photo_2024-11-29_14-16-41.jpg');
  const outputDir = path.join(__dirname, '..', 'assets');
  
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create PNG versions for different sizes
  const sizes = [16, 32, 48, 64, 128, 256];
  
  console.log('Creating icon from photo_2024-11-29_14-16-41.jpg...');
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Created ${size}x${size} icon`);
  }

  // Create main icon.png (256x256)
  await sharp(inputPath)
    .resize(256, 256, {
      fit: 'cover',
      position: 'center'
    })
    .png()
    .toFile(path.join(outputDir, 'icon.png'));
  
  console.log('✓ Created main icon.png');
  console.log('\n✅ Icon creation complete!');
  console.log('Note: For Windows .ico file, use an online converter or ImageMagick');
}

createIcon().catch(console.error);
