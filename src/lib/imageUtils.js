// Phone screenshots are often 3–8 MB. Shrinking them in the browser keeps
// uploads fast and under the edge function's size cap, while staying large
// enough for the model to read small ledger text.
const MAX_DIMENSION = 1600;
const MAX_DATA_URL_CHARS = 3_000_000;
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55];

/**
 * Reads an image File and returns a JPEG data URL, downscaled so its longest
 * side is at most MAX_DIMENSION and re-encoded until it fits under the size
 * budget. Throws if the browser can't decode the file.
 */
export async function compressImageToDataUrl(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("decode-failed");
  }

  try {
    let scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 3; attempt++) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // JPEG has no alpha; paint white first so transparent PNGs don't go black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);

      for (const quality of QUALITY_STEPS) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
      }
      scale *= 0.75;
    }
    throw new Error("too-large");
  } finally {
    bitmap.close?.();
  }
}
