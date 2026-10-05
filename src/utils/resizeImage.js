// What a user is allowed to pick from disk — always re-encoded to WebP
// below before it's sent anywhere, so this only gates the source file.
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Downscales an image client-side and re-encodes it as WebP before it ever
 * reaches the upload endpoint. Keeps legitimate uploads in the "few hundred
 * KB" range so a tight backend size range (see backend's upload-validation)
 * never bites a real user, while a scripted attacker gets nothing out of
 * inflating request size. The backend now only accepts image/webp, so a
 * failure here must stop the flow — there's no format fallback.
 */
export async function resizeImageToWebp(file, { maxDimension = 1024, quality = 0.85 } = {}) {
  // 'from-image' reads the EXIF Orientation tag phones write instead of
  // physically rotating pixels — without it, canvas bakes in whatever
  // orientation the raw pixels happen to be in, which is often sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode image.'))), 'image/webp', quality);
  });
  // Some browsers silently fall back to PNG if they can't encode WebP via
  // canvas — catch that here instead of letting the backend's magic-byte
  // check reject a file the frontend claimed was WebP.
  if (blob.type !== 'image/webp') {
    throw new Error('This browser cannot encode WebP images.');
  }
  return new File([blob], 'upload.webp', { type: 'image/webp' });
}
