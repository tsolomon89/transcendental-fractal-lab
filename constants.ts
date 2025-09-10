
import { FractalParams, FractalModel, RenderMode, Palette, PaletteType, Keyframe, Easing, ZoomInterpolation, OrbitGradient } from './types';

export const TAU = 2 * Math.PI;
export const LOG2 = Math.log(2);

export const PALETTES: Palette[] = [
    { id: 'smooth-hsl', type: PaletteType.SmoothHSL, hueStart: 200, hueScale: 0.01 },
    { id: 'spectral-tau', type: PaletteType.SpectralTau, cyclesPerTau: 1 },
    {
        id: 'fire',
        type: PaletteType.Fire,
        stops: [
            { pos: 0, color: { r: 0, g: 0, b: 0 } },
            { pos: 0.25, color: { r: 150, g: 0, b: 0 } },
            { pos: 0.5, color: { r: 255, g: 180, b: 0 } },
            { pos: 1, color: { r: 255, g: 255, b: 255 } },
        ]
    },
    {
        id: 'ice',
        type: PaletteType.Ice,
        stops: [
            { pos: 0, color: { r: 0, g: 0, b: 0 } },
            { pos: 0.3, color: { r: 0, g: 20, b: 100 } },
            { pos: 0.6, color: { r: 100, g: 180, b: 255 } },
            { pos: 1, color: { r: 230, g: 240, b: 255 } },
        ]
    },
    {
        id: 'custom',
        type: PaletteType.Custom,
        stops: [
            { pos: 0, color: { r: 255, g: 0, b: 0 } },
            { pos: 0.5, color: { r: 0, g: 255, b: 0 } },
            { pos: 1, color: { r: 0, g: 0, b: 255 } },
        ]
    },
];

export const DEFAULT_PARAMS: FractalParams = {
    model: {
        type: FractalModel.A0,
        mode: RenderMode.Mandelbrot,
        k: 0,
        juliaC: { re: -0.8, im: 0.156 },
        b1: { lambda: { re: 0.1, im: 0 } },
        b2: {
            alpha: [{ re: 0.1, im: 0 }, { re: 0.05, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
            M: [3, 7, 1, 1],
        },
    },
    view: {
        centerRe: -0.5,
        centerIm: 0,
        scale: 1,
    },
    iter: {
        maxIter: 200,
        escapeR: 4,
    },
    perf: {
        rowsPerFrame: 8,
        frameBudget: 12,
    },
    palette: PALETTES[0],
    orbit: {
        show: false,
        maxIter: 500,
        gradient: OrbitGradient.HSV,
        alpha: 0.8,
        thickness: 1.5,
        freeze: false,
    }
};

export const SEED_SCENES: { name: string; params: Partial<FractalParams> }[] = [
    { name: "Cardioid", params: { view: { centerRe: -0.75, centerIm: 0, scale: 1.5 } } },
    { name: "Seahorse Valley", params: { view: { centerRe: -0.743643887037151, centerIm: 0.13182590420533, scale: 2e5 }, iter: { maxIter: 500, escapeR: 4 } } },
    { name: "B1 Pearls", params: { model: { ...DEFAULT_PARAMS.model, type: FractalModel.B1, b1: { lambda: { re: 0.05, im: 0.02 } } }, view: { centerRe: -1.25, centerIm: 0, scale: 1.5 }, iter: { maxIter: 250, escapeR: 8 } } },
    { name: "B2 Bands", params: { model: { ...DEFAULT_PARAMS.model, type: FractalModel.B2, b2: { alpha: [{ re: 0.01, im: 0 }, { re: 0.005, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }], M: [5, 13, 1, 1] } }, view: { centerRe: -0.15, centerIm: 1.05, scale: 5 }, iter: { maxIter: 300, escapeR: 12 } } },
];

export const EASING_FUNCTIONS: { [key in Easing]: (t: number) => number } = {
    linear: (t) => t,
    smoothstep: (t) => t * t * (3 - 2 * t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
};
