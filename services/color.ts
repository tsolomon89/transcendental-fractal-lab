
import { Palette, PaletteType, GradientPalette, ColorStop, SmoothHSLPalette, SpectralTauPalette, OrbitGradient } from '../types';
import { TAU } from '../constants';

const LUT_SIZE = 1024;
const memoizedLuts = new Map<string, Uint8ClampedArray>();

function lerp(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
}

function getGradientColor(pos: number, stops: ColorStop[]): { r: number; g: number; b: number } {
    if (pos <= stops[0].pos) return stops[0].color;
    if (pos >= stops[stops.length - 1].pos) return stops[stops.length - 1].color;

    for (let i = 0; i < stops.length - 1; i++) {
        const s1 = stops[i];
        const s2 = stops[i + 1];
        if (pos >= s1.pos && pos <= s2.pos) {
            const t = (pos - s1.pos) / (s2.pos - s1.pos);
            return {
                r: lerp(s1.color.r, s2.color.r, t),
                g: lerp(s1.color.g, s2.color.g, t),
                b: lerp(s1.color.b, s2.color.b, t),
            };
        }
    }
    return stops[stops.length - 1].color;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    h = h % 360;
    if (h < 0) h += 360;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    if (h < 60) { [r, g, b] = [c, x, 0]; }
    else if (h < 120) { [r, g, b] = [x, c, 0]; }
    else if (h < 180) { [r, g, b] = [0, c, x]; }
    else if (h < 240) { [r, g, b] = [0, x, c]; }
    else if (h < 300) { [r, g, b] = [x, 0, c]; }
    else { [r, g, b] = [c, 0, x]; }

    return {
        r: (r + m) * 255,
        g: (g + m) * 255,
        b: (b + m) * 255,
    };
}


export function buildLut(palette: Palette): Uint8ClampedArray {
    const key = JSON.stringify(palette);
    if (memoizedLuts.has(key)) {
        return memoizedLuts.get(key)!;
    }
    
    const lut = new Uint8ClampedArray(LUT_SIZE * 4);
    for (let i = 0; i < LUT_SIZE; i++) {
        const t = i / (LUT_SIZE - 1);
        let color = { r: 0, g: 0, b: 0 };
        
        switch (palette.type) {
            case PaletteType.SmoothHSL: {
                const p = palette as SmoothHSLPalette;
                const hue = p.hueStart + t * p.hueScale * 360 * 10;
                color = hslToRgb(hue, 0.8, 0.5 + 0.4 * Math.sin(t * TAU));
                break;
            }
            case PaletteType.SpectralTau: {
                 const p = palette as SpectralTauPalette;
                 const hue = (t * p.cyclesPerTau * 360) % 360;
                 color = hslToRgb(hue, 1, 0.5);
                 break;
            }
            case PaletteType.Fire:
            case PaletteType.Ice:
            case PaletteType.Custom: {
                const p = palette as GradientPalette;
                color = getGradientColor(t, p.stops);
                break;
            }
        }

        lut[i * 4 + 0] = color.r;
        lut[i * 4 + 1] = color.g;
        lut[i * 4 + 2] = color.b;
        lut[i * 4 + 3] = 255;
    }

    memoizedLuts.set(key, lut);
    return lut;
}

export function mapColor(nu: number, lut: Uint8ClampedArray): [number, number, number] {
    if (nu < 0) {
        return [0, 0, 0];
    }
    const index = Math.floor((nu % 1) * (LUT_SIZE - 1)) * 4;
    return [lut[index], lut[index + 1], lut[index + 2]];
}

export function getOrbitColor(t: number, gradient: OrbitGradient): string {
    switch (gradient) {
        case OrbitGradient.HSV:
            const hue = t * 360;
            return `hsl(${hue}, 100%, 50%)`;
        case OrbitGradient.Warm:
            const red = 255;
            const green = Math.round(lerp(255, 50, t));
            return `rgb(${red}, ${green}, 0)`;
        case OrbitGradient.Mono:
            const l = Math.round(lerp(255, 100, t));
            return `rgb(${l}, ${l}, ${l})`;
        default:
            return '#FFFFFF';
    }
}
