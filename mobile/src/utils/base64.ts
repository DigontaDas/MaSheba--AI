const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Converts a base64-encoded string to a Blob.
 * This utility is used for uploading certificates from base64 data.
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const str = base64.replace(/=+$/, '');
  const len = str.length;
  const bytes = new Uint8Array(((len * 3) / 4) | 0);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = CHARS.indexOf(str[i]);
    const encoded2 = CHARS.indexOf(str[i + 1]);
    const encoded3 = i + 2 < len ? CHARS.indexOf(str[i + 2]) : 0;
    const encoded4 = i + 3 < len ? CHARS.indexOf(str[i + 3]) : 0;

    const value = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    bytes[p++] = (value >> 16) & 255;
    if (i + 2 < len) bytes[p++] = (value >> 8) & 255;
    if (i + 3 < len) bytes[p++] = value & 255;
  }
  return new Blob([bytes], { type: mimeType });
}
