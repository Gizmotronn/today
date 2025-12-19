async function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

async function imageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });
}

function cropToSquareDataUrl(img: HTMLImageElement, size = 32): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const scale = Math.max(size / img.width, size / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const x = (size - drawW) / 2;
  const y = (size - drawH) / 2;
  ctx.drawImage(img, x, y, drawW, drawH);

  return canvas.toDataURL('image/png');
}

export async function fileToFaviconDataUrl(file: File, size = 32): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const img = await imageFromSrc(dataUrl);
  return cropToSquareDataUrl(img, size);
}

export async function urlToFaviconDataUrl(url: string, size = 32): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const blob = await res.blob();
  const dataUrl = await readAsDataUrl(blob);
  const img = await imageFromSrc(dataUrl);
  return cropToSquareDataUrl(img, size);
}
