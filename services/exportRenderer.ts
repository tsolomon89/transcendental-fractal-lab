
import { FractalParams, RenderMode } from '../types';
import { getIterator, calculateSmoothEscape } from './fractalMath';
import { buildLut, mapColor } from './color';

/**
 * Renders a complete fractal frame to a canvas context.
 * This is a "blocking" function designed for exports. It renders the entire
 * image without requestAnimationFrame and yields periodically to prevent
 * the browser from becoming unresponsive.
 * @returns A promise that resolves when the frame is fully rendered.
 */
export async function renderCompleteFrame(
    ctx: CanvasRenderingContext2D,
    params: FractalParams,
    width: number,
    height: number
): Promise<void> {
    const iterator = getIterator(params);
    const lut = buildLut(params.palette);
    const imageData = ctx.createImageData(width, 1);

    const { centerRe, centerIm, scale } = params.view;
    const { maxIter, escapeR } = params.iter;
    const escapeRSq = escapeR * escapeR;
    const { mode, juliaC } = params.model;

    const aspect = width / height;
    const viewHeight = 4 / scale;
    const viewWidth = viewHeight * aspect;

    const reOffset = centerRe - viewWidth / 2;
    const imOffset = centerIm - viewHeight / 2;
    
    const invScaleX = viewWidth / width;
    const invScaleY = viewHeight / height;

    for (let y = 0; y < height; y++) {
        const cIm = imOffset + y * invScaleY;
        for (let x = 0; x < width; x++) {
            const cRe = reOffset + x * invScaleX;

            const c = { re: cRe, im: cIm };
            const z0 = mode === RenderMode.Mandelbrot ? { re: 0, im: 0 } : c;
            const cParam = mode === RenderMode.Mandelbrot ? c : juliaC;

            const result = iterator(cParam, z0, maxIter, escapeRSq);
            const nu = calculateSmoothEscape(result.n, result.z);
            const [r, g, b] = mapColor(nu, lut);

            const pixelIndex = x * 4;
            imageData.data[pixelIndex] = r;
            imageData.data[pixelIndex + 1] = g;
            imageData.data[pixelIndex + 2] = b;
            imageData.data[pixelIndex + 3] = 255;
        }
        ctx.putImageData(imageData, 0, y);

        // Yield to the event loop every 16 rows to keep the browser responsive
        // and allow UI updates (like the progress bar).
        if (y % 16 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
}


export function generateKeyframeThumbnail(params: FractalParams): Promise<string> {
    return new Promise((resolve) => {
        const THUMB_WIDTH = 128;
        const THUMB_HEIGHT = 96;
        const THUMB_MAX_ITER = Math.max(30, Math.min(80, Math.floor(params.iter.maxIter / 4)));

        const canvas = document.createElement('canvas');
        canvas.width = THUMB_WIDTH;
        canvas.height = THUMB_HEIGHT;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return resolve('');

        const thumbParams = {
            ...params,
            iter: { ...params.iter, maxIter: THUMB_MAX_ITER },
        };

        const iterator = getIterator(thumbParams);
        const lut = buildLut(thumbParams.palette);
        const imageData = ctx.createImageData(THUMB_WIDTH, THUMB_HEIGHT);

        const { centerRe, centerIm, scale } = thumbParams.view;
        const { maxIter, escapeR } = thumbParams.iter;
        const escapeRSq = escapeR * escapeR;
        const { mode, juliaC } = thumbParams.model;

        const aspect = THUMB_WIDTH / THUMB_HEIGHT;
        const viewHeight = 4 / scale;
        const viewWidth = viewHeight * aspect;
        const reOffset = centerRe - viewWidth / 2;
        const imOffset = centerIm - viewHeight / 2;
        const invScaleX = viewWidth / THUMB_WIDTH;
        const invScaleY = viewHeight / THUMB_HEIGHT;

        for (let y = 0; y < THUMB_HEIGHT; y++) {
            const cIm = imOffset + y * invScaleY;
            for (let x = 0; x < THUMB_WIDTH; x++) {
                const cRe = reOffset + x * invScaleX;

                const c = { re: cRe, im: cIm };
                const z0 = mode === RenderMode.Mandelbrot ? { re: 0, im: 0 } : c;
                const cParam = mode === RenderMode.Mandelbrot ? c : juliaC;

                const result = iterator(cParam, z0, maxIter, escapeRSq);
                const nu = calculateSmoothEscape(result.n, result.z);
                const [r, g, b] = mapColor(nu, lut);

                const pixelIndex = (y * THUMB_WIDTH + x) * 4;
                imageData.data[pixelIndex] = r;
                imageData.data[pixelIndex + 1] = g;
                imageData.data[pixelIndex + 2] = b;
                imageData.data[pixelIndex + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
    });
}
