export function random(x, y, width, height, containerWidth, containerHeight) {
  return {
    x: x + (Math.random() * (containerWidth - width)),
    y: y + (Math.random() * (containerHeight - height)),
  }
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const idx = Math.floor(Math.random() * i);
    [arr[idx], arr[i]] = [arr[i], arr[idx]];
  }
}

export async function loadImage(src) {
  const image  = new Image();
  const loadPromise = new Promise(resolve => {
    image.onload = function() {
      resolve(this);
    }
    image.setAttribute('crossorigin', 'anonymous');
    image.src = src;
  });

  return await loadPromise;
}