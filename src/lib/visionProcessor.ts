import sharp from "sharp";

export async function processScreenshot(buffer: Buffer) {
  try {
    const resized = await sharp(buffer)
      .resize(512)
      .grayscale()
      .toBuffer();

    return resized.toString("base64");
  } catch (e) {
    console.error("Vision processing failed:", e);
    return "";
  }
}
