import type { GeneratePuzzleOptions } from "./types.js";

/**
 * Encodes a canvas as an image source string.
 *
 * Blob URLs are the default because they avoid base64 expansion and synchronous
 * data URL encoding.
 *
 * @param canvas - Canvas to encode.
 * @param options - Encoding options.
 * @returns Image source string.
 */
export async function encodeCanvasImageSource(
  canvas: HTMLCanvasElement,
  options: GeneratePuzzleOptions
): Promise<string> {
  if (options.imageOutput === "data-url") {
    // setTimeout turns this into a macrotask so the browser can paint progress
    // updates between pieces (toDataURL is synchronous, so without this the
    // entire loop drains as microtasks and the UI never repaints mid-run).
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(canvas.toDataURL(options.imageType, options.imageQuality));
      }, 0);
    });
  }

  const blob = await createCanvasBlob(canvas, options);

  return URL.createObjectURL(blob);
}

/**
 * Revokes an image source when it is a blob URL.
 *
 * @param src - Image source.
 * @returns Nothing.
 */
export function revokePuzzleImageSource(src: string): void {
  if (src.startsWith("blob:")) {
    URL.revokeObjectURL(src);
  }
}

/**
 * Encodes a canvas as a Blob.
 *
 * @param canvas - Canvas to encode.
 * @param options - Encoding options.
 * @returns Encoded image Blob.
 */
function createCanvasBlob(
  canvas: HTMLCanvasElement,
  options: GeneratePuzzleOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not encode canvas as a Blob."));
        }
      },
      options.imageType,
      options.imageQuality
    );
  });
}
