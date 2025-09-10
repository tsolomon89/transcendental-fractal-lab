
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FractalParams, RenderStatus, Bookmark, Keyframe, AnimationSettings, ZoomInterpolation, Complex } from './types';
import { DEFAULT_PARAMS } from './constants';
import CanvasRenderer from './components/CanvasRenderer';
import Controls from './components/Controls';
import Help from './components/Help';
import useLocalStorage from './hooks/useLocalStorage';
import { getParamsForTime } from './services/animation';
import { getOrbitCalculator } from './services/fractalMath';

type PointerState = 'Idle' | 'Hover' | 'Dragging' | 'Scrolling';

const App: React.FC = () => {
    const [params, setParams] = useLocalStorage<FractalParams>('lastParams', DEFAULT_PARAMS);
    const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('bookmarks', []);
    const [timeline, setTimeline] = useLocalStorage<Keyframe[]>('timeline', []);
    const [animationSettings, setAnimationSettings] = useLocalStorage<AnimationSettings>('animationSettings', {
        zoomInterpolation: ZoomInterpolation.Log,
    });
    
    const [renderId, setRenderId] = useState(0);
    const [renderStatus, setRenderStatus] = useState<RenderStatus>({ progress: 0, isRendering: false });
    const [isPlaying, setIsPlaying] = useState(false);
    const [pointerState, setPointerState] = useState<PointerState>('Idle');
    const [orbitPoints, setOrbitPoints] = useState<Complex[] | null>(null);

    const pointerComplexCoords = useRef<{ re: number, im: number } | null>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const animationStartTime = useRef<number>(0);
    const orbitCalcTimeout = useRef<number | null>(null);

    const triggerRender = useCallback(() => {
        setRenderId(id => id + 1);
    }, []);

    useEffect(() => {
        if (!isPlaying) {
            triggerRender();
        }
    }, [params, triggerRender, isPlaying]);

    // Animation Loop
    useEffect(() => {
        if (isPlaying && timeline.length > 1) {
            animationStartTime.current = performance.now();
            
            const totalDuration = timeline.reduce((acc, kf) => acc + kf.duration, 0) * 1000;

            const animate = (currentTime: number) => {
                const elapsedTime = currentTime - animationStartTime.current;
                
                if (elapsedTime >= totalDuration) {
                    setIsPlaying(false);
                    setParams(timeline[timeline.length - 1].params);
                    return;
                }
                
                const newParams = getParamsForTime(timeline, elapsedTime / 1000, animationSettings);
                setParams(p => ({...p, ...newParams}));
                triggerRender();

                animationFrameId.current = requestAnimationFrame(animate);
            };

            animationFrameId.current = requestAnimationFrame(animate);

        } else if (!isPlaying && animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isPlaying, timeline, setParams, triggerRender, animationSettings]);
    
    const calculateAndSetOrbit = useCallback((coords: Complex) => {
        if (!params.orbit.show) {
            if (orbitPoints) setOrbitPoints(null);
            return;
        }
        const orbitCalculator = getOrbitCalculator(params);
        const z0 = params.model.mode === 'Mandelbrot' ? { re: 0, im: 0 } : coords;
        const cParam = params.model.mode === 'Mandelbrot' ? coords : params.model.juliaC;
        const points = orbitCalculator(cParam, z0);
        setOrbitPoints(points);
    }, [params, orbitPoints]);
    
    const handleRecenter = useCallback((re: number, im: number) => {
        setParams(p => ({ ...p, view: { ...p.view, centerRe: re, centerIm: im } }));
        if (params.orbit.show) {
            calculateAndSetOrbit({ re, im });
        }
    }, [setParams, params.orbit.show, calculateAndSetOrbit]);

    const handleKeydown = useCallback((e: KeyboardEvent) => {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            return;
        }

        let needsUpdate = true;
        const key = e.key.toLowerCase();
        
        switch(key) {
            case ' ':
                 e.preventDefault();
                 if (timeline.length > 1) setIsPlaying(p => !p);
                 needsUpdate = false;
                 break;
            case 'w':
            case 'arrowup':
            case 's':
            case 'arrowdown':
            case 'a':
            case 'arrowleft':
            case 'd':
            case 'arrowright':
            case 'e':
            case '+':
            case '=':
            case 'q':
            case '-':
            case '_':
                setParams(p => {
                    let newParams = { ...p, view: { ...p.view } };
                    const panAmount = 0.1 / p.view.scale;
                    const zoomFactor = 1.25;
                    switch(key) {
                         case 'w':
                         case 'arrowup': 
                             newParams.view.centerIm -= panAmount; break;
                         case 's':
                         case 'arrowdown': 
                             newParams.view.centerIm += panAmount; break;
                         case 'a':
                         case 'arrowleft': 
                             newParams.view.centerRe -= panAmount; break;
                         case 'd':
                         case 'arrowright': 
                             newParams.view.centerRe += panAmount; break;
                         case 'e':
                         case '+': 
                         case '=': 
                             newParams.view.scale *= zoomFactor; break;
                         case 'q':
                         case '-': 
                         case '_': 
                             newParams.view.scale /= zoomFactor; break;
                    }
                    return newParams;
                });
                break;
            case 'r':
                if (e.shiftKey) {
                    setParams(DEFAULT_PARAMS);
                } else if (pointerComplexCoords.current) {
                    handleRecenter(pointerComplexCoords.current.re, pointerComplexCoords.current.im);
                }
                break;
            default:
                needsUpdate = false;
        }

        if (needsUpdate) {
            e.preventDefault();
        }
    }, [setParams, timeline, setIsPlaying, handleRecenter]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    }, [handleKeydown]);

    const handlePointerHover = useCallback((coords: { re: number, im: number } | null) => {
        pointerComplexCoords.current = coords;
        if (orbitCalcTimeout.current) clearTimeout(orbitCalcTimeout.current);

        if (coords && pointerState !== 'Dragging' && pointerState !== 'Scrolling') {
            setPointerState('Hover');
            if (params.orbit.show && !params.orbit.freeze) {
                orbitCalcTimeout.current = window.setTimeout(() => {
                    calculateAndSetOrbit(coords);
                }, 120);
            }
        } else if (!coords) {
            setPointerState('Idle');
            if (!params.orbit.freeze) setOrbitPoints(null);
        }
    }, [pointerState, params.orbit.show, params.orbit.freeze, calculateAndSetOrbit]);

    const handlePan = useCallback((dx: number, dy: number) => {
        if (!canvasRef.current) return;
        setPointerState('Dragging');
        setOrbitPoints(null);
        setParams(p => {
            const { width, height } = canvasRef.current!;
            const aspect = width / height;
            const viewHeight = 4 / p.view.scale;
            const viewWidth = viewHeight * aspect;
            const panRe = (dx / width) * viewWidth;
            const panIm = (dy / height) * viewHeight;
            return {
                ...p,
                view: { ...p.view, centerRe: p.view.centerRe - panRe, centerIm: p.view.centerIm - panIm }
            };
        });
    }, [setParams]);
    
    const handlePanEnd = useCallback(() => {
        setPointerState(pointerComplexCoords.current ? 'Hover' : 'Idle');
    }, []);

    const handleZoom = useCallback((zoomFactor: number, anchorRe: number, anchorIm: number) => {
        setPointerState('Scrolling');
        setOrbitPoints(null);
        setParams(p => {
            const newScale = p.view.scale * zoomFactor;
            const newCenterRe = anchorRe + (p.view.centerRe - anchorRe) / zoomFactor;
            const newCenterIm = anchorIm + (p.view.centerIm - anchorIm) / zoomFactor;
            return { ...p, view: { ...p.view, scale: newScale, centerRe: newCenterRe, centerIm: newCenterIm } };
        });
        setTimeout(() => setPointerState(pointerComplexCoords.current ? 'Hover' : 'Idle'), 150);
    }, [setParams]);

    useEffect(() => {
        if (!params.orbit.show && orbitPoints) {
            setOrbitPoints(null);
        }
    }, [params.orbit.show, orbitPoints]);

    return (
        <div ref={mainRef} className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-200">
            <div className="flex-grow relative bg-black flex items-center justify-center p-2">
                <CanvasRenderer 
                    ref={canvasRef}
                    params={params} 
                    renderId={renderId} 
                    onStatusChange={setRenderStatus}
                    isAnimating={isPlaying}
                    onPointerHover={handlePointerHover}
                    onPan={handlePan}
                    onPanEnd={handlePanEnd}
                    onZoom={handleZoom}
                    onRecenter={handleRecenter}
                    orbitPoints={orbitPoints}
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 p-2 rounded-md text-sm pointer-events-none">
                    <p>Center: {params.view.centerRe.toFixed(6)} + {params.view.centerIm.toFixed(6)}i</p>
                    <p>Scale: {params.view.scale.toExponential(3)}</p>
                    {pointerComplexCoords.current && pointerState !== 'Idle' && (
                        <p>Pointer: {pointerComplexCoords.current.re.toFixed(6)} + {pointerComplexCoords.current.im.toFixed(6)}i</p>
                    )}
                    <p>Max Iter: {params.iter.maxIter}</p>
                    <p>
                       State: {isPlaying ? 'Animating' : pointerState} 
                       {renderStatus.isRendering && ` | Rendering... ${(renderStatus.progress * 100).toFixed(1)}%`}
                    </p>
                </div>
            </div>
            <div className="w-full md:w-96 h-1/2 md:h-full overflow-y-auto bg-gray-800 shadow-lg p-4 border-l-2 border-gray-700">
                <h1 className="text-2xl font-bold text-cyan-400 mb-4">τ-Fractal Lab</h1>
                <Controls 
                    params={params} setParams={setParams} 
                    isRendering={renderStatus.isRendering}
                    bookmarks={bookmarks} setBookmarks={setBookmarks}
                    timeline={timeline} setTimeline={setTimeline}
                    animationSettings={animationSettings} setAnimationSettings={setAnimationSettings}
                    isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                    canvasRef={canvasRef}
                />
                <Help />
            </div>
        </div>
    );
};

export default App;
