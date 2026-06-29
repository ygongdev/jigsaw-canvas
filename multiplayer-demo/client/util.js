/**
 * Creates a random point inside a container.
 *
 * @param x - Container x origin.
 * @param y - Container y origin.
 * @param width - Element width.
 * @param height - Element height.
 * @param containerWidth - Container width.
 * @param containerHeight - Container height.
 * @returns Random point.
 */
export function random(x, y, width, height, containerWidth, containerHeight) {
    return {
        x: x + Math.random() * (containerWidth - width),
        y: y + Math.random() * (containerHeight - height),
    };
}
/**
 * Shuffles an array in place.
 *
 * @param arr - Array to shuffle.
 * @returns Nothing.
 */
export function shuffle(arr) {
    for (let i = arr.length - 1; i >= 0; i -= 1) {
        const idx = Math.floor(Math.random() * i);
        [arr[idx], arr[i]] = [arr[i], arr[idx]];
    }
}
/**
 * Loads an image.
 *
 * @param src - Image URL.
 * @returns Loaded image.
 */
export async function loadImage(src) {
    const image = new Image();
    return await new Promise((resolve) => {
        image.onload = function () {
            resolve(this);
        };
        image.setAttribute("crossorigin", "anonymous");
        image.src = src;
    });
}
