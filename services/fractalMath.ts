
import { Complex, FractalParams, FractalModel } from '../types';
import { TAU, LOG2 } from '../constants';

// --- Complex Number Operations ---
export const cAdd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const cMul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export const cAbsSq = (z: Complex): number => z.re * z.re + z.im * z.im;

// Safe complex sine: sin(x+iy) = sin(x)cosh(y) + i*cos(x)sinh(y)
// Clamps y to avoid floating point overflow in sinh/cosh
export const cSinSafe = (z: Complex): Complex => {
    const y_clamped = Math.max(-20, Math.min(20, z.im));
    const sinh_y = Math.sinh(y_clamped);
    const cosh_y = Math.cosh(y_clamped);
    return {
        re: Math.sin(z.re) * cosh_y,
        im: Math.cos(z.re) * sinh_y,
    };
};

// --- Escape Time Calculation ---
export const calculateSmoothEscape = (n: number, z: Complex): number => {
    if (n === -1) return -1;
    // nu = n + 1 - log(log |z|) / log 2
    const log_abs_z = Math.log(cAbsSq(z)) / 2; // log|z| = 0.5 * log(|z|^2)
    const log_log_abs_z = Math.log(Math.max(1e-300, log_abs_z));
    return n + 1 - log_log_abs_z / LOG2;
};


type IteratorFunction = (c: Complex, z0: Complex, maxIter: number, escapeRSq: number) => { n: number, z: Complex };

export const getIterator = (params: FractalParams): IteratorFunction => {
    const { type, k, b1, b2 } = params.model;
    const { lambda } = b1;
    const { alpha, M } = b2;

    const tau_k = Math.pow(TAU, k);
    const w = M.map(m => tau_k / m);

    const iterate: IteratorFunction = (c, z0, maxIter, escapeRSq) => {
        let z = { ...z0 };
        for (let n = 0; n < maxIter; n++) {
            if (cAbsSq(z) > escapeRSq) {
                return { n, z };
            }

            let zSq = cMul(z, z);
            
            switch (type) {
                case FractalModel.A0: {
                    const zSqScaled = { re: zSq.re * tau_k, im: zSq.im * tau_k };
                    z = cAdd(zSqScaled, c);
                    break;
                }
                case FractalModel.A2: {
                    const cScaled = { re: c.re * tau_k, im: c.im * tau_k };
                    z = cAdd(zSq, cScaled);
                    break;
                }
                case FractalModel.Atau:
                    z = cAdd(zSq, c);
                    if (tau_k !== 0) {
                        z = { re: z.re / tau_k, im: z.im / tau_k };
                    }
                    break;
                case FractalModel.B1:
                    const sin_term_b1 = cMul(lambda, cSinSafe({ re: z.re * tau_k, im: z.im * tau_k }));
                    z = cAdd(cAdd(zSq, c), sin_term_b1);
                    break;
                case FractalModel.B2:
                    let sum: Complex = { re: 0, im: 0 };
                    for (let i = 0; i < 4; i++) {
                        if (alpha[i].re !== 0 || alpha[i].im !== 0) {
                            const term = cMul(alpha[i], cSinSafe({ re: z.re * w[i], im: z.im * w[i] }));
                            sum = cAdd(sum, term);
                        }
                    }
                    z = cAdd(cAdd(zSq, c), sum);
                    break;
            }
        }
        return { n: -1, z };
    };
    return iterate;
};


// --- Orbit Calculation ---
type OrbitCalculatorFunction = (c: Complex, z0: Complex) => Complex[];

export const getOrbitCalculator = (params: FractalParams): OrbitCalculatorFunction => {
    const { type, k, b1, b2 } = params.model;
    const { maxIter } = params.orbit;
    const { escapeR } = params.iter;
    const escapeRSq = escapeR * escapeR;
    const { lambda } = b1;
    const { alpha, M } = b2;

    const tau_k = Math.pow(TAU, k);
    const w = M.map(m => tau_k / m);

    const calculate: OrbitCalculatorFunction = (c, z0) => {
        const points: Complex[] = [];
        let z = { ...z0 };
        points.push(z);

        for (let n = 0; n < maxIter; n++) {
            if (cAbsSq(z) > escapeRSq) {
                break;
            }

            let zSq = cMul(z, z);
            
            switch (type) {
                 case FractalModel.A0: {
                    const zSqScaled = { re: zSq.re * tau_k, im: zSq.im * tau_k };
                    z = cAdd(zSqScaled, c);
                    break;
                }
                case FractalModel.A2: {
                    const cScaled = { re: c.re * tau_k, im: c.im * tau_k };
                    z = cAdd(zSq, cScaled);
                    break;
                }
                case FractalModel.Atau:
                    z = cAdd(zSq, c);
                    if (tau_k !== 0) {
                        z = { re: z.re / tau_k, im: z.im / tau_k };
                    }
                    break;
                case FractalModel.B1:
                    const sin_term_b1 = cMul(lambda, cSinSafe({ re: z.re * tau_k, im: z.im * tau_k }));
                    z = cAdd(cAdd(zSq, c), sin_term_b1);
                    break;
                case FractalModel.B2:
                    let sum: Complex = { re: 0, im: 0 };
                    for (let i = 0; i < 4; i++) {
                        if (alpha[i].re !== 0 || alpha[i].im !== 0) {
                            const term = cMul(alpha[i], cSinSafe({ re: z.re * w[i], im: z.im * w[i] }));
                            sum = cAdd(sum, term);
                        }
                    }
                    z = cAdd(cAdd(zSq, c), sum);
                    break;
            }
            points.push(z);
        }
        return points;
    };
    return calculate;
}
