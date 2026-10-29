/**
 * imagePipeline.js — Pure-ish image validation and processing.
 * Returns { ok, value, error } — never throws.
 * No DOM required for the pure parts; only toDataUrl needs a canvas.
 */

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_DIMENSION = 2560;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];

function isAllowedType(file) {
  if (file.type && ALLOWED_TYPES.includes(file.type.toLowerCase())) return true;
  const name = (file.name || '').toLowerCase();
  return ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext));
}

export function validateImageFile(file) {
  if (!file || typeof file !== 'object') {
    return { ok: false, value: null, error: 'No file provided' };
  }

  if (!isAllowedType(file)) {
    return { ok: false, value: null, error: 'Unsupported image type. Use JPEG, PNG, WebP, GIF, or HEIC.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return { ok: false, value: null, error: `Image is ${mb} MB. Maximum is 8 MB.` };
  }

  return { ok: true, value: file, error: null };
}

/**
 * Downscale an image to fit within MAX_DIMENSION while preserving aspect ratio.
 * Uses createImageBitmap (off-main-thread where supported) with fallback to Image.
 * Returns { ok, value: ImageBitmap|HTMLImageElement, error }
 */
export async function downscaleImage(file) {
  try {
    // Try createImageBitmap first (off main thread, more efficient)
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

      if (scale >= 1) {
        return { ok: true, value: bitmap, error: null };
      }

      // Need to downscale - draw to canvas and create new bitmap
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const downscaled = await createImageBitmap(canvas);
      return { ok: true, value: downscaled, error: null };
    }

    // Fallback: use Image element
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

        if (scale >= 1) {
          resolve({ ok: true, value: img, error: null });
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const downscaled = new Image();
        downscaled.onload = () => resolve({ ok: true, value: downscaled, error: null });
        downscaled.onerror = () => resolve({ ok: false, value: null, error: 'Failed to create downscaled image' });
        downscaled.src = canvas.toDataURL('image/webp', 0.85);
      };
      img.onerror = () => resolve({ ok: false, value: null, error: 'Could not decode image' });
      img.src = URL.createObjectURL(file);
    });
  } catch (err) {
    return { ok: false, value: null, error: err instanceof Error ? err.message : 'Unknown error during downscale' };
  }
}

/**
 * Convert an ImageBitmap or HTMLImageElement to a data URL.
 * Returns { ok, value: string, error }
 */
export function toDataUrl(image, type = 'image/webp', quality = 0.85) {
  try {
    const canvas = document.createElement('canvas');
    const { width, height } = image;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL(type, quality);
    return { ok: true, value: dataUrl, error: null };
  } catch (err) {
    return { ok: false, value: null, error: err instanceof Error ? err.message : 'Failed to create data URL' };
  }
}

/**
 * Full pipeline: validate → downscale → toDataUrl
 * Returns { ok, value: dataUrl, error, metadata: { width, height, size } }
 */
export async function processImageFile(file) {
  const validation = validateImageFile(file);
  if (!validation.ok) return validation;

  const downscale = await downscaleImage(file);
  if (!downscale.ok) return downscale;

  const dataUrlResult = toDataUrl(downscale.value);
  if (!dataUrlResult.ok) return dataUrlResult;

  // Clean up if it's an ImageBitmap
  if (downscale.value && typeof downscale.value.close === 'function') {
    downscale.value.close();
  }

  return {
    ok: true,
    value: dataUrlResult.value,
    error: null,
    metadata: {
      width: downscale.value.width,
      height: downscale.value.height,
      size: file.size,
    },
  };
}