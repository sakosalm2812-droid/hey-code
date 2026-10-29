import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(process.cwd(), 'public', 'icon.svg');
const publicDir = path.join(process.cwd(), 'public');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');
  
  if (!fs.existsSync(svgPath)) {
    console.error('❌ icon.svg not found');
    process.exit(1);
  }

  const hasSharp = checkSharp();
  const hasImageMagick = checkImageMagick();

  if (!hasSharp && !hasImageMagick) {
    console.log('⚠️  No image processing tool found. Creating placeholder PNGs...');
    createPlaceholderPngs();
    return;
  }

  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}.png`);
    try {
      if (hasSharp) {
        await generateWithSharp(svgPath, outputPath, size);
      } else {
        await generateWithImageMagick(svgPath, outputPath, size);
      }
      console.log(`✅ Generated icon-${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}.png:`, error);
    }
  }

  console.log('✅ All icons generated!');
}

function checkSharp(): boolean {
  try {
    require.resolve('sharp');
    return true;
  } catch {
    return false;
  }
}

function checkImageMagick(): boolean {
  try {
    execSync('convert -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function generateWithSharp(input: string, output: string, size: number) {
  const sharp = require('sharp');
  await sharp(input)
    .resize(size, size)
    .png()
    .toFile(output);
}

async function generateWithImageMagick(input: string, output: string, size: number) {
  execSync(`convert -background none -resize ${size}x${size} "${input}" "${output}"`, { stdio: 'inherit' });
}

function createPlaceholderPngs() {
  const placeholderSvg = fs.readFileSync(svgPath, 'utf-8');
  
  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}.png`);
    
    const pngContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="96" fill="#1a1a2e"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="200" font-weight="800" fill="white">HEY</text>
    </svg>`;
    
    fs.writeFileSync(outputPath.replace('.png', '.svg'), pngContent);
    console.log(`📝 Created placeholder icon-${size}.svg (convert to PNG manually)`);
  }
}

generateIcons().catch(console.error);