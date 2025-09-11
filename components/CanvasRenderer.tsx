
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { FractalParams, RenderMode, RenderStatus, Complex } from '../types';
import { getIterator, calculateSmoothEscape } from '../services/fractalMath';
import { buildLut, mapColor } from '../services/color';
import { getOrbitColor } from '../services/color';

interface CanvasRendererProps {
    params: FractalParams;
    renderId: number;
    onStatusChange: (status: RenderStatus) => void;
    isAnimating: boolean;
    onPointerHover: (coords: { re: number; im: number } | null) => void;
    onPan: (dx: number, dy: number) => void;
    onPanEnd: () => void;
    onZoom: (zoomFactor: number, anchorRe: number, anchorIm: number) => void;
    onRecenter: (re: number, im: number) => void;
    orbitPoints: Complex[] | null;
}

const CanvasRenderer = forwardRef<HTMLCanvasElement, CanvasRendererProps>(
    ({ params, renderId, onStatusChange, isAnimating, onPointerHover, onPan, onPanEnd, onZoom, onRecenter, orbitPoints }, ref) => {
    const fractalCanvasRef = useRef<HTMLCanvasElement>(null);
    const orbitCanvasRef = useRef<HTMLCanvasElement>(null);
    useImperativeHandle(ref, () => fractalCanvasRef.current!);

    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    
    const dragStartRef = useRef<{ x: number; y: number; } | null>(null);
    const lastClickTimeRef = useRef<number>(0);
    const clickTimeoutRef = useRef<number | null>(null);

    const updateDimensions = useCallback(() => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            if (clientWidth > 0 && clientHeight > 0) {
                 setDimensions({ width: clientWidth, height: clientHeight });
            }
        }
    }, []);

    useEffect(() => {
        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, [updateDimensions]);

    // Fractal Rendering Effect
    useEffect(() => {
        const canvas = fractalCanvasRef.current;
        if (!canvas) return;

        const { width, height } = dimensions;
        if (width === 0 || height === 0) return;
        
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        const lut = buildLut(params.palette);
        
        const { centerRe, centerIm, scale } = params.view;
        const { mode, juliaC } = params.model;
        
        const aspect = width / height;
        const viewHeight = 4 / scale;
        const viewWidth = viewHeight * aspect;

        const reOffset = centerRe - viewWidth / 2;
        const imOffset = centerIm - viewHeight / 2;
        
        const invScaleX = viewWidth / width;
        const invScaleY = viewHeight / height;

        if (isAnimating) {
            onStatusChange({ progress: 0, isRendering: true });
            
            // Use lower quality settings for a smooth animation preview
            const animParams = {
                ...params,
                iter: {
                    ...params.iter,
                    maxIter: Math.max(30, Math.floor(params.iter.maxIter / 4)),
                }
            };
            const iterator = getIterator(animParams);
            const { maxIter, escapeR } = animParams.iter;
            const escapeRSq = escapeR * escapeR;
            
            const fullImageData = ctx.createImageData(width, height);

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
                    
                    const pixelIndex = (y * width + x) * 4;
                    fullImageData.data[pixelIndex] = r;
                    fullImageData.data[pixelIndex + 1] = g;
                    fullImageData.data[pixelIndex + 2] = b;
                    fullImageData.data[pixelIndex + 3] = 255;
                }
            }
            ctx.putImageData(fullImageData, 0, 0);
            onStatusChange({ progress: 1, isRendering: false });
            return; // No cleanup needed for sync render
        }

        // --- Progressive rendering for static frames ---
        const iterator = getIterator(params);
        const { maxIter, escapeR } = params.iter;
        const escapeRSq = escapeR * escapeR;

        const rowsPerBatch = Math.max(1, Math.min(params.perf.rowsPerFrame, height));
        const imageData = ctx.createImageData(width, rowsPerBatch);

        let currentY = 0;
        let isCancelled = false;
        let animationFrameId: number;
        
        const renderLoop = () => {
            const startTime = performance.now();
            onStatusChange({ progress: currentY / height, isRendering: true });

            while (performance.now() - startTime < params.perf.frameBudget) {
                if (currentY >= height || isCancelled) break;
                
                const rowsToRender = Math.min(rowsPerBatch, height - currentY);
                if (rowsToRender <= 0) break;

                for (let y = 0; y < rowsToRender; y++) {
                    const py = currentY + y;
                    const cIm = imOffset + py * invScaleY;
                    for (let x = 0; x < width; x++) {
                        const cRe = reOffset + x * invScaleX;
                        
                        const c = { re: cRe, im: cIm };
                        const z0 = mode === RenderMode.Mandelbrot ? { re: 0, im: 0 } : c;
                        const cParam = mode === RenderMode.Mandelbrot ? c : juliaC;

                        const result = iterator(cParam, z0, maxIter, escapeRSq);
                        const nu = calculateSmoothEscape(result.n, result.z);
                        const [r, g, b] = mapColor(nu, lut);
                        
                        const pixelIndex = (y * width + x) * 4;
                        imageData.data[pixelIndex] = r;
                        imageData.data[pixelIndex + 1] = g;
                        imageData.data[pixelIndex + 2] = b;
                        imageData.data[pixelIndex + 3] = 255;
                    }
                }
                ctx.putImageData(imageData, 0, currentY, 0, 0, width, rowsToRender);
                currentY += rowsToRender;
            }

            if (currentY < height && !isCancelled) {
                animationFrameId = requestAnimationFrame(renderLoop);
            } else {
                onStatusChange({ progress: 1, isRendering: false });
            }
        };

        animationFrameId = requestAnimationFrame(renderLoop);

        return () => {
            isCancelled = true;
            cancelAnimationFrame(animationFrameId);
            onStatusChange({ progress: currentY / height, isRendering: false });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderId, dimensions, isAnimating, params, onStatusChange]); 

    const mapComplexToPixel = useCallback((z: Complex): { x: number; y: number } => {
        const { width, height } = dimensions;
        if (width === 0 || height === 0) return { x: 0, y: 0 };
        const { centerRe, centerIm, scale } = params.view;
        const aspect = width / height;
        const viewHeight = 4 / scale;
        const viewWidth = viewHeight * aspect;

        const reRange = z.re - (centerRe - viewWidth / 2);
        const imRange = z.im - (centerIm - viewHeight / 2);

        const x = (reRange / viewWidth) * width;
        const y = (imRange / viewHeight) * height;

        return { x, y };
    }, [dimensions, params.view]);

    // Orbit Rendering Effect
    useEffect(() => {
        const canvas = orbitCanvasRef.current;
        if (!canvas) return;

        const { width, height } = dimensions;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, width, height);

        if (!orbitPoints || orbitPoints.length < 2) return;
        
        const { orbit: orbitParams } = params;
        ctx.globalAlpha = orbitParams.alpha;
        ctx.lineWidth = orbitParams.thickness * (window.devicePixelRatio || 1);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < orbitPoints.length - 1; i++) {
            const p1 = mapComplexToPixel(orbitPoints[i]);
            const p2 = mapComplexToPixel(orbitPoints[i+1]);

            const t = i / (orbitPoints.length - 1);
            ctx.strokeStyle = getOrbitColor(t, orbitParams.gradient);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

    }, [orbitPoints, dimensions, params, mapComplexToPixel]);

    const mapPixelToComplex = useCallback((pixelX: number, pixelY: number): { re: number; im: number } => {
        const { width, height } = dimensions;
        if (width === 0 || height === 0) return { re: 0, im: 0 };
        const { centerRe, centerIm, scale } = params.view;
        const aspect = width / height;
        const viewHeight = 4 / scale;
        const viewWidth = viewHeight * aspect;
        const reOffset = centerRe - viewWidth / 2;
        const imOffset = centerIm - viewHeight / 2;
        const invScaleX = viewWidth / width;
        const invScaleY = viewHeight / height;
        const re = reOffset + pixelX * invScaleX;
        const im = imOffset + pixelY * invScaleY;
        return { re, im };
    }, [dimensions, params.view]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button === 0) { // Left click
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    };
    
    const handlePointerMove = (e: React.PointerEvent) => {
        const coords = mapPixelToComplex(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        onPointerHover(coords);
        if (dragStartRef.current) {
            onPan(e.movementX, e.movementY);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        const dragThreshold = 5;
        const doubleClickDelay = 250;
        
        if (dragStartRef.current) {
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            dragStartRef.current = null;
            
            if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
                onPanEnd();
            } else {
                // It's a click.
                onPanEnd(); // End any micro-drags
                const now = performance.now();
                if (now - lastClickTimeRef.current < doubleClickDelay) {
                    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
                    lastClickTimeRef.current = 0;
                    const coords = mapPixelToComplex(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                    const zoomFactor = e.shiftKey ? 0.5 : 2.0;
                    onZoom(zoomFactor, coords.re, coords.im);
                } else {
                    lastClickTimeRef.current = now;
                    clickTimeoutRef.current = window.setTimeout(() => {
                        const coords = mapPixelToComplex(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                        onRecenter(coords.re, coords.im);
                    }, doubleClickDelay);
                }
            }
        }
    };

    const handlePointerLeave = () => {
        onPointerHover(null);
        if (dragStartRef.current) {
            dragStartRef.current = null;
            onPanEnd();
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = Math.pow(1.1, -e.deltaY / 100);
        const coords = mapPixelToComplex(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        onZoom(zoomFactor, coords.re, coords.im);
    };

    return (
        <div ref={containerRef} className="w-full h-full relative"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onWheel={handleWheel}
        >
            <canvas ref={fractalCanvasRef} className="w-full h-full absolute top-0 left-0" />
            <canvas ref={orbitCanvasRef} className="w-full h-full absolute top-0 left-0 touch-none cursor-crosshair pointer-events-none" />
        </div>
    );
});

export default CanvasRenderer;
