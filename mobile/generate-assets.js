const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const assetsDir = path.join(__dirname, "assets");
const svgPath = path.join(assetsDir, "icon.svg");

// Verify that the assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function run() {
  console.log("Starting asset generation using sharp...");
  
  if (!fs.existsSync(svgPath)) {
    console.error(`Error: Source SVG file not found at ${svgPath}`);
    process.exit(1);
  }

  const svgContent = fs.readFileSync(svgPath, "utf-8");

  // 1. Generate universal icon.png (1024x1024 px, cream background)
  console.log("Generating universal icon.png...");
  await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, "icon.png"));
  console.log("icon.png generated successfully.");

  // 2. Generate adaptive-icon.png (1024x1024 px, transparent background for Android adaptive icon)
  console.log("Generating adaptive-icon.png (foreground)...");
  // Remove the background <rect> tag to keep it transparent
  const transparentSvgContent = svgContent.replace(/<rect[^>]*fill="#fff8f7"[^>]*\/>/i, "");
  await sharp(Buffer.from(transparentSvgContent))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, "adaptive-icon.png"));
  console.log("adaptive-icon.png generated successfully.");

  // 3. Generate splash.png (2048x2048 px, centered logo + beautiful typography)
  console.log("Generating splash.png (2048x2048 px)...");
  
  // Extract emblem group content from SVG to render it separately
  const emblemMatch = svgContent.match(/<g id="maternal-emblem">([\s\S]*?)<\/g>/i);
  if (!emblemMatch) {
    console.error("Error: Could not locate <g id='maternal-emblem'> in SVG.");
    process.exit(1);
  }
  const emblemGroup = emblemMatch[0];

  // We create a custom splash SVG combining emblem and elegant text layout
  const splashSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" width="2048" height="2048">
      <!-- Clean solid cream background -->
      <rect width="2048" height="2048" fill="#fff8f7" />
      
      <!-- Scaled and Centered Logo Emblem -->
      <g transform="translate(512, 350) scale(1.0)">
        ${emblemGroup}
      </g>
      
      <!-- Typographic Text below the logo -->
      <text x="1024" y="1450" font-family="'Hind Siliguri', 'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="110" font-weight="900" fill="#96482e" text-anchor="middle" letter-spacing="2">মাশেবা AI</text>
      <text x="1024" y="1570" font-family="'Hind Siliguri', 'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="52" font-weight="600" fill="#4b6546" text-anchor="middle" letter-spacing="10">MaaSheba AI</text>
      
      <!-- Subtle Clinical / Intelligent Care Slogan at the bottom -->
      <text x="1024" y="1800" font-family="'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="34" font-weight="400" fill="#e8896a" text-anchor="middle" letter-spacing="4" opacity="0.8">INTELLIGENT MATERNAL HEALTHCARE</text>
    </svg>
  `;

  await sharp(Buffer.from(splashSvg))
    .resize(2048, 2048)
    .png()
    .toFile(path.join(assetsDir, "splash.png"));
  console.log("splash.png generated successfully.");
  console.log("All assets generated successfully!");
}

run().catch((err) => {
  console.error("Asset generation failed:", err);
  process.exit(1);
});
