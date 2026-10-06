/** Reads an image file, center-crops/resizes it on a canvas and returns a compact data URL. */
export function resizeImage(file, { size = 320, square = true, quality = 0.86 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      reject(new Error('Please choose a PNG, JPG or WebP image.'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('That image is larger than 8 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file does not look like an image.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        if (square) {
          const side = Math.min(img.width, img.height);
          sx = (img.width - side) / 2;
          sy = (img.height - side) / 2;
          sw = sh = side;
          canvas.width = canvas.height = size;
        } else {
          const scale = Math.min(1, size / Math.max(img.width, img.height));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
        }
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        let url = canvas.toDataURL('image/webp', quality);
        if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', quality);
        resolve(url);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
