
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
