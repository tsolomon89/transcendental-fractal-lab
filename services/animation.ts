
import { FractalParams, Keyframe, AnimationSettings, ZoomInterpolation, Complex, PaletteType, GradientPalette, Palette, SmoothHSLPalette, SpectralTauPalette } from '../types';
import { EASING_FUNCTIONS } from '../constants';

// --- Helper Functions ---

function lerp(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
}

function lerpComplex(a: Complex, b: Complex, t: number): Complex {
    return {
        re: lerp(a.re, b.re, t),
        im: lerp(a.im, b.im, t),
    };
}

function interpolatePalette(p1: Palette, p2: Palette, t: number): Palette {
    if (p1.type !== p2.type) return p1; // Hold if types differ

    switch (p1.type) {
        case PaletteType.SmoothHSL: {
            const hsl2 = p2 as SmoothHSLPalette;
            return {
                ...p1,
                hueStart: lerp(p1.hueStart, hsl2.hueStart, t),
                hueScale: lerp(p1.hueScale, hsl2.hueScale, t),
            };
        }
        case PaletteType.SpectralTau: {
             const st2 = p2 as SpectralTauPalette;
             return {
                 ...p1,
                 cyclesPerTau: lerp(p1.cyclesPerTau, st2.cyclesPerTau, t),
             };
        }
        case PaletteType.Custom:
        case PaletteType.Fire:
        case PaletteType.Ice: {
             const grad1 = p1 as GradientPalette;
             const grad2 = p2 as GradientPalette;
             if (grad1.stops.length === grad2.stops.length) {
                 return {
                    ...grad1,
                    stops: grad1.stops.map((stop, i) => {
                        const stop2 = grad2.stops[i];
                        return {
                            pos: lerp(stop.pos, stop2.pos, t),
                            color: {
                                r: lerp(stop.color.r, stop2.color.r, t),
                                g: lerp(stop.color.g, stop2.color.g, t),
                                b: lerp(stop.color.b, stop2.color.b, t),
                            }
                        };
                    })
                 };
             }
             // if stop counts differ, hold p1's palette
             return p1;
        }
    }
}


// --- Main Interpolation Logic ---

export function interpolateParams(
    p1: FractalParams,
    p2: FractalParams,
    t: number, // Eased time
    settings: AnimationSettings
): FractalParams {
    const interpolated = JSON.parse(JSON.stringify(p1));

    // View
    interpolated.view.centerRe = lerp(p1.view.centerRe, p2.view.centerRe, t);
    interpolated.view.centerIm = lerp(p1.view.centerIm, p2.view.centerIm, t);
    if (settings.zoomInterpolation === ZoomInterpolation.Log && p1.view.scale > 0 && p2.view.scale > 0) {
        interpolated.view.scale = Math.exp(lerp(Math.log(p1.view.scale), Math.log(p2.view.scale), t));
    } else {
        interpolated.view.scale = lerp(p1.view.scale, p2.view.scale, t);
    }
    
    // Iteration
    interpolated.iter.maxIter = Math.round(lerp(p1.iter.maxIter, p2.iter.maxIter, t));
    interpolated.iter.escapeR = lerp(p1.iter.escapeR, p2.iter.escapeR, t);

    // Model
    interpolated.model.k = lerp(p1.model.k, p2.model.k, t);
    interpolated.model.juliaC = lerpComplex(p1.model.juliaC, p2.model.juliaC, t);
    interpolated.model.b1.lambda = lerpComplex(p1.model.b1.lambda, p2.model.b1.lambda, t);
    for (let i = 0; i < 4; i++) {
        interpolated.model.b2.alpha[i] = lerpComplex(p1.model.b2.alpha[i], p2.model.b2.alpha[i], t);
        interpolated.model.b2.M[i] = lerp(p1.model.b2.M[i], p2.model.b2.M[i], t);
    }
    
    // Palette
    interpolated.palette = interpolatePalette(p1.palette, p2.palette, t);

    return interpolated;
}

export function getParamsForTime(timeline: Keyframe[], time: number, settings: AnimationSettings): FractalParams {
    let cumulativeTime = 0;
    
    if (time <= 0) return timeline[0].params;

    for (let i = 0; i < timeline.length - 1; i++) {
        const startKf = timeline[i];
        const endKf = timeline[i + 1];
        const segmentDuration = startKf.duration;
        
        if (time >= cumulativeTime && time < cumulativeTime + segmentDuration) {
            const timeIntoSegment = time - cumulativeTime;
            let t = timeIntoSegment / segmentDuration;
            if (isNaN(t) || t < 0) t = 0;
            if (t > 1) t = 1;
            
            const eased_t = EASING_FUNCTIONS[startKf.easing](t);
            return interpolateParams(startKf.params, endKf.params, eased_t, settings);
        }
        cumulativeTime += segmentDuration;
    }
    
    // If time is beyond the end, return the last keyframe
    return timeline[timeline.length - 1].params;
}
