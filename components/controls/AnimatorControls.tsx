
import React, { useState } from 'react';
import { FractalParams, Keyframe, Easing, AnimationSettings, ZoomInterpolation } from '../../types';
import { EASING_FUNCTIONS } from '../../constants';
import { renderCompleteFrame } from '../../services/exportRenderer';
import { getParamsForTime } from '../../services/animation';

interface AnimatorControlsProps {
    currentParams: FractalParams;
    timeline: Keyframe[];
    setTimeline: React.Dispatch<React.SetStateAction<Keyframe[]>>;
    animationSettings: AnimationSettings;
    setAnimationSettings: React.Dispatch<React.SetStateAction<AnimationSettings>>;
    isRendering: boolean;
    isPlaying: boolean;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

const ControlGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-3 bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-300 mb-2">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const Button: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; disabled?: boolean }> = ({ onClick, children, className, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`px-3 py-1 text-sm rounded transition-colors ${className || 'bg-cyan-600 hover:bg-cyan-500 text-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {children}
    </button>
);

const AnimatorControls: React.FC<AnimatorControlsProps> = ({ 
    currentParams, timeline, setTimeline,
    animationSettings, setAnimationSettings,
    isRendering, isPlaying, setIsPlaying, canvasRef 
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const addKeyframe = () => {
        const newKeyframe: Keyframe = {
            id: new Date().toISOString(),
            params: JSON.parse(JSON.stringify(currentParams)), // Deep copy
            duration: 5,
            easing: 'smoothstep'
        };
        setTimeline(t => [...t, newKeyframe]);
    };

    const updateKeyframe = (id: string, newValues: Partial<Keyframe>) => {
        setTimeline(t => t.map(kf => kf.id === id ? { ...kf, ...newValues } : kf));
    };
    
    const deleteKeyframe = (id: string) => {
        setTimeline(t => t.filter(kf => kf.id !== id));
    };

    const exportPNG = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `fractal-frame-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    const exportWebM = async () => {
        if (!canvasRef.current || timeline.length < 2) {
            alert("Please add at least two keyframes to the timeline.");
            return;
        }
        if (typeof window.MediaRecorder === 'undefined') {
            alert("WebM export is not supported in your browser.");
            return;
        }

        setIsExporting(true);
        setExportProgress(0);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
            setIsExporting(false);
            return;
        }

        const stream = canvas.captureStream(30); // 30 FPS
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fractal-animation-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            setIsExporting(false);
        };

        recorder.start();

        const totalDuration = timeline.reduce((acc, kf) => acc + kf.duration, 0);
        const totalFrames = Math.floor(totalDuration * 30);

        for (let i = 0; i < totalFrames; i++) {
            const currentTime = i / 30;
            const frameParams = getParamsForTime(timeline, currentTime, animationSettings);
            await renderCompleteFrame(ctx, frameParams, canvas.width, canvas.height);
            setExportProgress((i + 1) / totalFrames);
        }

        recorder.stop();
    };

    const hasMediaRecorder = typeof window.MediaRecorder !== 'undefined';
    const canAnimate = timeline.length > 1;

    return (
        <div className="space-y-4">
             <ControlGroup title="Timeline">
                 <Button onClick={addKeyframe} disabled={isExporting}>Add Current Scene as Keyframe</Button>
                 <div className="space-y-2 max-h-60 overflow-y-auto mt-2 p-1">
                     {timeline.map((kf, index) => (
                         <div key={kf.id} className="bg-gray-800 p-2 rounded">
                            <div className="flex items-center justify-between">
                                <span className="font-bold">Keyframe {index + 1}</span>
                                <Button onClick={() => deleteKeyframe(kf.id)} className="bg-red-600 hover:bg-red-500" disabled={isExporting}>Delete</Button>
                            </div>
                            <div className="text-xs space-y-2 mt-2">
                                 <div className="flex items-center justify-between">
                                     <label>Duration (s)</label>
                                     <input type="number" value={kf.duration} min="0.1" step="0.1" onChange={e => updateKeyframe(kf.id, { duration: parseFloat(e.target.value) || 0 })}
                                        className="w-20 bg-gray-900 border border-gray-600 rounded px-1" disabled={isExporting} />
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <label>Easing</label>
                                    <select value={kf.easing} onChange={e => updateKeyframe(kf.id, { easing: e.target.value as Easing })}
                                        className="bg-gray-900 border border-gray-600 rounded px-1" disabled={isExporting}>
                                        {Object.keys(EASING_FUNCTIONS).map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                 </div>
                            </div>
                         </div>
                     ))}
                     {timeline.length === 0 && <p className="text-xs text-gray-400">Add keyframes to create an animation.</p>}
                 </div>
             </ControlGroup>

             <ControlGroup title="Playback & Settings">
                 <Button onClick={() => setIsPlaying(!isPlaying)} disabled={!canAnimate || isExporting} className="w-full bg-green-600 hover:bg-green-500">
                     {isPlaying ? 'Pause Preview (Space)' : 'Play Preview (Space)'}
                 </Button>
                 <div className="flex items-center justify-between pt-2">
                    <label className="text-sm">Zoom Interpolation</label>
                    <select value={animationSettings.zoomInterpolation} 
                            onChange={e => setAnimationSettings(s => ({...s, zoomInterpolation: e.target.value as ZoomInterpolation}))}
                            className="bg-gray-900 border border-gray-600 rounded px-1 text-sm" disabled={isExporting || isPlaying}>
                        {Object.values(ZoomInterpolation).map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                 </div>
             </ControlGroup>
             
             <ControlGroup title="Export">
                {isExporting && (
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                        <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${exportProgress * 100}%` }}></div>
                        <p className="text-xs text-center mt-1">{`Exporting... ${(exportProgress * 100).toFixed(0)}%`}</p>
                    </div>
                )}
                 {hasMediaRecorder ? (
                    <Button onClick={exportWebM} disabled={!canAnimate || isRendering || isExporting} className="w-full bg-blue-600 hover:bg-blue-500">Export as WebM</Button>
                 ) : (
                    <p className="text-xs text-yellow-400">WebM export not supported in your browser.</p>
                 )}
                 <Button onClick={exportPNG} disabled={isRendering || isExporting} className="w-full bg-gray-600 hover:bg-gray-500">Export Current Frame as PNG</Button>
             </ControlGroup>
        </div>
    );
};

export default AnimatorControls;
