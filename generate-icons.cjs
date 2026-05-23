const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - Green gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#16a34a');
  gradient.addColorStop(1, '#15803d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw BESTOLD text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Main text
  const fontSize = size * 0.22;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillText('BEST', size / 2, size * 0.38);
  
  const fontSize2 = size * 0.25;
  ctx.font = `bold ${fontSize2}px Arial`;
  ctx.fillText('OLD', size / 2, size * 0.62);

  // Add shopping bag icon
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';
  ctx.lineWidth = size * 0.025;
  const bagSize = size * 0.12;
  const bagX = size / 2;
  const bagY = size * 0.82;
  
  // Bag shape
  ctx.beginPath();
  ctx.moveTo(bagX - bagSize, bagY - bagSize * 0.5);
  ctx.lineTo(bagX - bagSize * 0.8, bagY + bagSize);
  ctx.lineTo(bagX + bagSize * 0.8, bagY + bagSize);
  ctx.lineTo(bagX + bagSize, bagY - bagSize * 0.5);
  ctx.closePath();
  ctx.stroke();
  
  // Bag handle
  ctx.beginPath();
  ctx.arc(bagX, bagY - bagSize * 0.5, bagSize * 0.6, Math.PI, 0, false);
  ctx.stroke();

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}x${size}.png`, buffer);
  console.log(`✓ Generated icon-${size}x${size}.png`);
}

async function generateAllIcons() {
  console.log('🎨 Generating BESTOLD app icons...\n');
  
  for (const size of sizes) {
    await generateIcon(size);
  }
  
  // Also generate favicon
  await generateIcon(32);
  fs.renameSync('public/icon-32x32.png', 'public/favicon.png');
  console.log('✓ Generated favicon.png');
  
  console.log('\n✅ All icons generated successfully!');
}

generateAllIcons().catch(console.error);
