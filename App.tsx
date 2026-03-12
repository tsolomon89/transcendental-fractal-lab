

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FractalParams, RenderStatus, Bookmark, Keyframe, AnimationSettings, ZoomInterpolation, Complex } from './types';
import { DEFAULT_PARAMS } from './constants';
import CanvasRenderer from './components/CanvasRenderer';
import Controls from './components/Controls';
import Help from './components/Help';
import useLocalStorage from './hooks/useLocalStorage';
import { getParamsForTime } from './services/animation';
import { getOrbitCalculator, cAbsSq } from './services/fractalMath';
import { generateKeyframeThumbnail } from './services/exportRenderer';
import ShortcutsOverlay from './components/ShortcutsOverlay';

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
    const [pointerCoordsForDisplay, setPointerCoordsForDisplay] = useState<Complex | null>(null);
    const [orbitPoints, setOrbitPoints] = useState<Complex[] | null>(null);
    const [isAddingKeyframe, setIsAddingKeyframe] = useState(false);
    const [keyframeAddedSuccess, setKeyframeAddedSuccess] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Anchor Zoom State
    const [zoomAnchor, setZoomAnchor] = useState<Complex | null>(null);
    const lastZoomTimeRef = useRef(0);
    const isDriftingRef = useRef(false);

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
        if (!isPlaying && !isDriftingRef.current) {
            triggerRender();
        }
    }, [params, triggerRender, isPlaying]);

    // Animation Loop (Timeline)
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

    // Animation Loop (Anchor Zoom Drift)
    useEffect(() => {
        let driftFrameId: number | null = null;

        const animateDrift = () => {
            const now = performance.now();
            const { anchorZoom } = params;

            // Condition to stop
            if (!zoomAnchor || now - lastZoomTimeRef.current > anchorZoom.idleThreshold + anchorZoom.persistenceDuration) {
                if (zoomAnchor) setZoomAnchor(null);
                if (isDriftingRef.current) {
                    isDriftingRef.current = false;
                    triggerRender(); // One final high-quality render
                }
                return;
            }

            // We should be drifting
            isDriftingRef.current = true;
            
            setParams(p => {
                const { centerRe, centerIm } = p.view;
                const dx = zoomAnchor.re - centerRe;
                const dy = zoomAnchor.im - centerIm;
                const distSq = dx * dx + dy * dy;
                
                // A fixed snapEpsilon in world coordinates is not effective at all zoom levels.
                // Calculate a dynamic threshold based on a tiny fraction of the current view size.
                const viewHeight = 4 / p.view.scale;
                const dynamicSnapEpsilon = viewHeight * 0.0001; // 0.01% of view height
                const snapEpsilonSq = dynamicSnapEpsilon * dynamicSnapEpsilon;

                if (distSq < snapEpsilonSq) {
                    setZoomAnchor(null); // Stop the animation on the next frame.
                    // To avoid a jarring jump, we perform a final snap here,
                    // which is now imperceptible due to the dynamic epsilon.
                    return { ...p, view: { ...p.view, centerRe: zoomAnchor.re, centerIm: zoomAnchor.im }};
                }

                let shiftRe = dx * anchorZoom.centeringGain;
                let shiftIm = dy * anchorZoom.centeringGain;

                const maxShift = viewHeight * p.anchorZoom.maxCenterShiftPerFrame;
                const shiftMagSq = shiftRe * shiftRe + shiftIm * shiftIm;

                if (shiftMagSq > maxShift * maxShift) {
                    const shiftMag = Math.sqrt(shiftMagSq);
                    shiftRe = (shiftRe / shiftMag) * maxShift;
                    shiftIm = (shiftIm / shiftMag) * maxShift;
                }
                
                const newCenterRe = centerRe + shiftRe;
                const newCenterIm = centerIm + shiftIm;
                return { ...p, view: { ...p.view, centerRe: newCenterRe, centerIm: newCenterIm }};
            });
            triggerRender(); // Trigger fast render
            
            driftFrameId = requestAnimationFrame(animateDrift);
        };

        if (zoomAnchor) {
            driftFrameId = requestAnimationFrame(animateDrift);
        }

        return () => { if(driftFrameId) cancelAnimationFrame(driftFrameId); }

    }, [params, setParams, zoomAnchor, triggerRender]);
    
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
        setZoomAnchor(null); // Stop any drifting
        setParams(p => ({ ...p, view: { ...p.view, centerRe: re, centerIm: im } }));
        if (params.orbit.show && !params.orbit.freeze) {
            calculateAndSetOrbit({ re, im });
        }
    }, [setParams, params.orbit.show, params.orbit.freeze, calculateAndSetOrbit]);
    
    const addKeyframe = useCallback(async () => {
        if (isAddingKeyframe) return;
        setIsAddingKeyframe(true);
        try {
            const thumbnail = await generateKeyframeThumbnail(params);
            const newKeyframe: Keyframe = {
                id: new Date().toISOString(),
                params: JSON.parse(JSON.stringify(params)), // Deep copy
                duration: 5,
                easing: 'smoothstep',
                thumbnail: thumbnail,
            };
            setTimeline(t => [...t, newKeyframe]);
            setKeyframeAddedSuccess(true);
        } catch (e) {
            console.error("Failed to generate keyframe thumbnail", e);
            // Still add keyframe without thumbnail on error
            const newKeyframe: Keyframe = {
                id: new Date().toISOString(),
                params: JSON.parse(JSON.stringify(params)), // Deep copy
                duration: 5,
                easing: 'smoothstep',
            };
            setTimeline(t => [...t, newKeyframe]);
            setKeyframeAddedSuccess(true);
        } finally {
            setIsAddingKeyframe(false);
            setTimeout(() => setKeyframeAddedSuccess(false), 1500);
        }
    }, [params, setTimeline, isAddingKeyframe]);


    const handleKeydown = useCallback((e: KeyboardEvent) => {
        if (e.key === '?') {
            e.preventDefault();
            setShowShortcuts(s => !s);
            return;
        }

        if (showShortcuts) {
            return;
        }
        
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            return;
        }

        let needsUpdate = true;
        const key = e.key.toLowerCase();
        
        switch(key) {
            case ' ':
                 e.preventDefault();
                 addKeyframe();
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
                setZoomAnchor(null); // Stop any drifting
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
            case 'f':
                setParams(p => ({ ...p, orbit: { ...p.orbit, freeze: !p.orbit.freeze }}));
                break;
            case 'g':
                setParams(p => ({ ...p, orbit: { ...p.orbit, show: !p.orbit.show }}));
                break;
            default:
                needsUpdate = false;
        }

        if (needsUpdate) {
            e.preventDefault();
        }
    }, [setParams, addKeyframe, handleRecenter, showShortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    }, [handleKeydown]);

    const handlePointerHover = useCallback((coords: { re: number, im: number } | null) => {
        pointerComplexCoords.current = coords;
        setPointerCoordsForDisplay(coords);
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
        setZoomAnchor(null); // Stop drifting if user pans
        if (!canvasRef.current) return;
        setPointerState('Dragging');
        if (!params.orbit.freeze) {
            setOrbitPoints(null);
        }
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
    }, [setParams, params.orbit.freeze]);
    
    const handlePanEnd = useCallback(() => {
        setPointerState(pointerComplexCoords.current ? 'Hover' : 'Idle');
        // After panning, if orbit is not frozen, re-calculate at the current pointer position.
        if (pointerComplexCoords.current && params.orbit.show && !params.orbit.freeze) {
            calculateAndSetOrbit(pointerComplexCoords.current);
        }
    }, [params.orbit.show, params.orbit.freeze, calculateAndSetOrbit]);



    const handleZoom = useCallback((zoomFactor: number, anchorRe: number, anchorIm: number) => {
        setPointerState('Scrolling');
        if (!params.orbit.freeze) {
            setOrbitPoints(null);
        }

        if (!params.anchorZoom.enabled) {
            // Legacy behavior
            setParams(p => {
                const newScale = p.view.scale * zoomFactor;
                const newCenterRe = anchorRe + (p.view.centerRe - anchorRe) / zoomFactor;
                const newCenterIm = anchorIm + (p.view.centerIm - anchorIm) / zoomFactor;
                return { ...p, view: { ...p.view, scale: newScale, centerRe: newCenterRe, centerIm: newCenterIm } };
            });
        } else {
            // Dynamic Anchor behavior
            lastZoomTimeRef.current = performance.now();
            const { anchorZoom, view } = params;

            let shouldSetNewAnchor = false;
            if (!zoomAnchor) {
                shouldSetNewAnchor = true;
            } else {
                // Dynamic recapture rule
                if (canvasRef.current && anchorZoom.anchorRetainRadius > 0) {
                    const { width, height } = canvasRef.current;
                    const aspect = width / height;
                    const viewWidth = (4 / view.scale) * aspect;
                    const retainRadiusWorld = anchorZoom.anchorRetainRadius * viewWidth;
                    
                    const dx = anchorRe - zoomAnchor.re;
                    const dy = anchorIm - zoomAnchor.im;
                    const distSq = dx * dx + dy * dy;

                    if (distSq > retainRadiusWorld * retainRadiusWorld) {
                        shouldSetNewAnchor = true;
                    }
                }
            }

            if (shouldSetNewAnchor) {
                setZoomAnchor({ re: anchorRe, im: anchorIm });
            }
            
            setParams(p => ({
                ...p,
                view: { ...p.view, scale: p.view.scale * zoomFactor }
            }));
        }
        
        // This timeout is just to reset the pointer state in the UI
        const scrollTimeout = setTimeout(() => {
            setPointerState(pointerComplexCoords.current ? 'Hover' : 'Idle');
             if (pointerComplexCoords.current && params.orbit.show && !params.orbit.freeze) {
                 calculateAndSetOrbit(pointerComplexCoords.current);
             }
        }, params.anchorZoom.idleThreshold > 0 ? params.anchorZoom.idleThreshold : 150);
        
        return () => clearTimeout(scrollTimeout);

    }, [setParams, params, zoomAnchor, calculateAndSetOrbit]);

    useEffect(() => {
        // When orbit view is turned off, clear points and cancel any pending calculations.
        if (!params.orbit.show) {
            if (orbitPoints) {
                setOrbitPoints(null);
            }
            if (orbitCalcTimeout.current) {
                clearTimeout(orbitCalcTimeout.current);
                orbitCalcTimeout.current = null;
            }
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
                    isFastRender={isPlaying || isDriftingRef.current}
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
                    {pointerCoordsForDisplay && pointerState !== 'Idle' && (
                        <p>Pointer: {pointerCoordsForDisplay.re.toFixed(6)} + {pointerCoordsForDisplay.im.toFixed(6)}i</p>
                    )}
                    <p>Max Iter: {params.iter.maxIter}</p>
                    <p>
                       State: {isPlaying ? 'Animating' : (isDriftingRef.current ? 'Drifting' : pointerState)}
                       {isAddingKeyframe && ' | Adding Keyframe...'}
                       {keyframeAddedSuccess && ' | Keyframe Added!'}
                       {renderStatus.isRendering && ` | Rendering... ${(renderStatus.progress * 100).toFixed(1)}%`}
                    </p>
                    {params.orbit.showAnalysis && orbitPoints && orbitPoints.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-600 font-mono text-xs">
                            <p className="text-cyan-400 font-sans text-sm font-semibold">Orbit Analysis</p>
                            <p>Status: {orbitPoints.length - 1 < params.orbit.maxIter ? 'Escaped' : 'Bounded'}</p>
                            <p>Iterations: {orbitPoints.length - 1}</p>
                            {orbitPoints.length > 0 && (
                               <p>Final |z|: {Math.sqrt(cAbsSq(orbitPoints[orbitPoints.length - 1])).toExponential(4)}</p>
                            )}
                        </div>
                    )}
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
                    addKeyframe={addKeyframe}
                    isAddingKeyframe={isAddingKeyframe}
                    keyframeAddedSuccess={keyframeAddedSuccess}
                    canvasRef={canvasRef}
                />
                <Help />
            </div>
            {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
        </div>
    );
};

export default App;