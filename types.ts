
export type Complex = {
    re: number;
    im: number;
};

export enum FractalModel {
    A0 = 'A0',
    // A1 = 'A1', // Removed
    A2 = 'A2',
    Atau = 'Aτ',
    B1 = 'B1',
    B2 = 'B2',
}

export enum RenderMode {
    Mandelbrot = 'Mandelbrot',
    Julia = 'Julia',
}

export enum PaletteType {
    SmoothHSL = 'Smooth HSL',
    Fire = 'Fire',
    Ice = 'Ice',
    SpectralTau = 'Spectral-τ',
    Custom = 'Custom Gradient',
}

export type ColorStop = {
    pos: number; // 0 to 1
    color: { r: number; g: number; b: number }; // 0 to 255
};

export type BasePalette = {
    type: PaletteType;
    id: string;
};

export type SmoothHSLPalette = BasePalette & {
    type: PaletteType.SmoothHSL;
    hueStart: number; // 0-360
    hueScale: number;
};

export type SpectralTauPalette = BasePalette & {
    type: PaletteType.SpectralTau;
    cyclesPerTau: number;
};

export type GradientPalette = BasePalette & {
    type: PaletteType.Fire | PaletteType.Ice | PaletteType.Custom;
    stops: ColorStop[];
};

export type Palette = SmoothHSLPalette | SpectralTauPalette | GradientPalette;

export type B1Params = {
    lambda: Complex;
};

export type B2Params = {
    alpha: Complex[]; // 4 elements
    M: number[]; // 4 elements
};

export enum OrbitGradient {
    HSV = 'HSV',
    Warm = 'Warm',
    Mono = 'Monochrome',
}

export type OrbitParams = {
    show: boolean;
    maxIter: number;
    gradient: OrbitGradient;
    alpha: number;
    thickness: number;
    freeze: boolean;
};

export type FractalParams = {
    model: {
        type: FractalModel;
        mode: RenderMode;
        k: number;
        juliaC: Complex;
        b1: B1Params;
        b2: B2Params;
    };
    view: {
        centerRe: number;
        centerIm: number;
        scale: number;
    };
    iter: {
        maxIter: number;
        escapeR: number;
    };
    perf: {
        rowsPerFrame: number;
        frameBudget: number;
    };
    palette: Palette;
    orbit: OrbitParams;
};

export type Bookmark = {
    id: string;
    name: string;
    params: FractalParams;
};

export type Easing = 'linear' | 'smoothstep' | 'easeInOutQuad';

export type Keyframe = {
    id:string;
    params: FractalParams;
    duration: number; // in seconds
    easing: Easing;
};

export enum ZoomInterpolation {
    Linear = 'Linear',
    Log = 'Log',
}

export type AnimationSettings = {
    zoomInterpolation: ZoomInterpolation;
};

export type RenderStatus = {
    progress: number;
    isRendering: boolean;
};
