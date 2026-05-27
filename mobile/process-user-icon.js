const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const userIconPath = "H:\\Projects\\MaaSheba\\ICON.png";
const mobileAssetsDir = path.join(__dirname, "assets");

async function run() {
  console.log("Processing user-provided icon with trim optimizations...");
  
  if (!fs.existsSync(userIconPath)) {
    console.error(`Error: User icon not found at ${userIconPath}`);
    process.exit(1);
  }

  // First, read the raw pixel at (0,0) to identify the exact background color
  const tempImage = sharp(userIconPath);
  const { data, info } = await tempImage.raw().toBuffer({ resolveWithObject: true });
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];
  const bgHex = `#${bgR.toString(16).padStart(2, '0')}${bgG.toString(16).padStart(2, '0')}${bgB.toString(16).padStart(2, '0')}`;
  console.log(`Detected background color: RGB(${bgR}, ${bgG}, ${bgB}) -> ${bgHex}`);

  // 1. Generate assets/icon.png (1024x1024 px, cream background)
  console.log("Generating assets/icon.png...");
  await sharp(userIconPath)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(mobileAssetsDir, "icon.png"));
  console.log("assets/icon.png created.");

  // 2. Generate a perfectly trimmed logo buffer (removes all light cream margin borders and slices off any black line edges)
  console.log("Trimming empty margins from logo and removing border lines...");
  // Sequential buffers bypass sharp's internal operation ordering
  const extractedBuffer = await sharp(userIconPath)
    .extract({
      left: 30,
      top: 30,
      width: 1254 - 60,
      height: 1254 - 60
    })
    .png()
    .toBuffer();

  const trimmedLogoBuffer = await sharp(extractedBuffer)
    .trim({
      background: bgHex,
      threshold: 20
    })
    .png()
    .toBuffer();
  console.log("Logo trimmed and borders removed successfully.");

  // 3. Generate adaptive-icon.png (transparent background, logo perfectly centered in safe-zone)
  console.log("Generating assets/adaptive-icon.png with transparency key-out...");
  
  // We take the trimmed logo, resize it to 680x680 px (the precise safe zone size)
  // and extend it with transparent borders to exactly 1024x1024 px!
  // This completely guarantees it is centered and within the Android safe zone!
  const transparentTrimmed = await sharp(trimmedLogoBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outBuffer = Buffer.alloc(transparentTrimmed.info.width * transparentTrimmed.info.height * 4);
  const threshold = 18;

  for (let i = 0; i < transparentTrimmed.info.width * transparentTrimmed.info.height; i++) {
    const r = transparentTrimmed.data[i * 4];
    const g = transparentTrimmed.data[i * 4 + 1];
    const b = transparentTrimmed.data[i * 4 + 2];

    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) +
      Math.pow(g - bgG, 2) +
      Math.pow(b - bgB, 2)
    );

    outBuffer[i * 4] = r;
    outBuffer[i * 4 + 1] = g;
    outBuffer[i * 4 + 2] = b;

    if (dist < threshold) {
      outBuffer[i * 4 + 3] = 0; // transparent
    } else {
      outBuffer[i * 4 + 3] = 255; // opaque
    }
  }

  // Create the 1024x1024 adaptive icon by expanding the transparent logo
  await sharp(outBuffer, {
    raw: {
      width: transparentTrimmed.info.width,
      height: transparentTrimmed.info.height,
      channels: 4
    }
  })
    .resize(680, 680, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 172,
      bottom: 172,
      left: 172,
      right: 172,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(mobileAssetsDir, "adaptive-icon.png"));
  console.log("assets/adaptive-icon.png generated.");

  // 4. Generate splash.png (1242x2436 px vertical, maximized graphics and words)
  console.log("Generating assets/splash.png (1242x2436 px vertical)...");
  
  // Resize the trimmed logo to 920x920 px (enlarged for high-fidelity clear display)
  // We explicitly set the containment padding background to the solid cream color to completely eliminate black vertical bars!
  const splashLogoBuffer = await sharp(trimmedLogoBuffer)
    .resize(920, 920, { 
      fit: "contain", 
      background: { r: bgR, g: bgG, b: bgB, alpha: 1 } 
    })
    .png()
    .toBuffer();

  // Create vertical solid white/cream base
  const splashBase = sharp({
    create: {
      width: 1242,
      height: 2436,
      channels: 4,
      background: { r: bgR, g: bgG, b: bgB, alpha: 1 }
    }
  });

  // Render high-fidelity enlarged typography as SVG overlay
  const typographySvg = `
    <svg width="1242" height="2436" viewBox="0 0 1242 2436" xmlns="http://www.w3.org/2000/svg">
      <!-- Typographic Text below the logo -->
      <text x="621" y="1470" font-family="'Hind Siliguri', 'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="130" font-weight="900" fill="#96482e" text-anchor="middle" letter-spacing="2">মাশেবা AI</text>
      <text x="621" y="1610" font-family="'Hind Siliguri', 'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="68" font-weight="600" fill="#4b6546" text-anchor="middle" letter-spacing="10">MaaSheba AI</text>
      
      <!-- Subtle Intelligent Care Slogan -->
      <text x="621" y="1850" font-family="'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="38" font-weight="400" fill="#e8896a" text-anchor="middle" letter-spacing="4" opacity="0.8">INTELLIGENT MATERNAL HEALTHCARE</text>
    </svg>
  `;

  await splashBase
    .composite([
      {
        input: splashLogoBuffer,
        top: 400,
        left: 161 // Center the 920px logo on 1242px width (1242 - 920)/2 = 161
      },
      {
        input: Buffer.from(typographySvg),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toFile(path.join(mobileAssetsDir, "splash.png"));

  console.log("assets/splash.png generated.");
  console.log("All user icon assets generated successfully!");
}

run().catch((err) => {
  console.error("Failed to process user icon assets:", err);
  process.exit(1);
});
