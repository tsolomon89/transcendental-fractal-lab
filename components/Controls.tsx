
import React, { useState } from 'react';
import { FractalParams, Bookmark, Keyframe, AnimationSettings, ZoomInterpolation } from '../types';
import ModelControls from './controls/ModelControls';
import ViewControls from './controls/ViewControls';
import PerformanceControls from './controls/PerformanceControls';
import PaletteControls from './controls/PaletteControls';
import BookmarkControls from './controls/BookmarkControls';
import AnimatorControls from './controls/AnimatorControls';
import OrbitControls from './controls/OrbitControls';

interface ControlsProps {
    params: FractalParams;
    setParams: React.Dispatch<React.SetStateAction<FractalParams>>;
    isRendering: boolean;
    
    bookmarks: Bookmark[];
    setBookmarks: React.Dispatch<React.SetStateAction<Bookmark[]>>;
    
    timeline: Keyframe[];
    setTimeline: React.Dispatch<React.SetStateAction<Keyframe[]>>;

    animationSettings: AnimationSettings;
    setAnimationSettings: React.Dispatch<React.SetStateAction<AnimationSettings>>;
    
    isPlaying: boolean;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    
    addKeyframe: () => Promise<void>;
    isAddingKeyframe: boolean;
    keyframeAddedSuccess: boolean;

    canvasRef: React.RefObject<HTMLCanvasElement>;
}

type Tab = 'Scene' | 'Palette' | 'Bookmarks' | 'Animation';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            active ? 'bg-gray-700 text-cyan-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        }`}
    >
        {children}
    </button>
);

const ControlGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-3 bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-300 mb-2">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const Button: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; disabled?: boolean }> = ({ onClick, children, className, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`w-full px-3 py-2 text-sm rounded transition-colors ${className || 'bg-cyan-600 hover:bg-cyan-500 text-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {children}
    </button>
);


const Controls: React.FC<ControlsProps> = (props) => {
    const { 
        params, setParams, isRendering, 
        bookmarks, setBookmarks, 
        timeline, setTimeline,
        animationSettings, setAnimationSettings,
        isPlaying, setIsPlaying,
        addKeyframe, isAddingKeyframe, keyframeAddedSuccess,
        canvasRef
    } = props;

    const [activeTab, setActiveTab] = useState<Tab>('Scene');
    const canAnimate = timeline.length > 1;

    const addKeyframeButtonClass = keyframeAddedSuccess
        ? 'bg-green-600 text-white'
        : 'bg-cyan-600 hover:bg-cyan-500 text-white';

    const addKeyframeButtonText = isAddingKeyframe 
        ? 'Generating Preview...' 
        : (keyframeAddedSuccess ? 'Keyframe Added!' : 'Add Current Scene as Keyframe (Space)');

    return (
        <div className="space-y-4">
            <div className="flex border-b border-gray-600">
                <TabButton active={activeTab === 'Scene'} onClick={() => setActiveTab('Scene')}>Scene</TabButton>
                <TabButton active={activeTab === 'Palette'} onClick={() => setActiveTab('Palette')}>Palette</TabButton>
                <TabButton active={activeTab === 'Bookmarks'} onClick={() => setActiveTab('Bookmarks')}>Bookmarks</TabButton>
                <TabButton active={activeTab === 'Animation'} onClick={() => setActiveTab('Animation')}>Animation</TabButton>
            </div>
            <div className="p-1">
                {activeTab === 'Scene' && (
                    <div className="space-y-4">
                        <ControlGroup title="Playback & Settings">
                             <Button 
                                onClick={addKeyframe} 
                                disabled={isAddingKeyframe || isPlaying || keyframeAddedSuccess}
                                className={addKeyframeButtonClass}
                             >
                                {addKeyframeButtonText}
                            </Button>
                             <Button onClick={() => setIsPlaying(!isPlaying)} disabled={!canAnimate} className="bg-green-600 hover:bg-green-500">
                                {isPlaying ? 'Pause Preview' : 'Play Preview'}
                            </Button>
                             <div className="flex items-center justify-between pt-2">
                                <label className="text-sm text-gray-300">Zoom Interpolation</label>
                                <select value={animationSettings.zoomInterpolation} 
                                        onChange={e => setAnimationSettings(s => ({...s, zoomInterpolation: e.target.value as ZoomInterpolation}))}
                                        className="bg-gray-900 border border-gray-600 rounded px-1 text-sm" disabled={isPlaying}>
                                    {Object.values(ZoomInterpolation).map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                             </div>
                        </ControlGroup>
                        <ModelControls params={params} setParams={setParams} />
                        <ViewControls params={params} setParams={setParams} />
                        <OrbitControls params={params} setParams={setParams} />
                        <PerformanceControls params={params} setParams={setParams} />
                    </div>
                )}
                {activeTab === 'Palette' && (
                     <PaletteControls params={params} setParams={setParams} />
                )}
                {activeTab === 'Bookmarks' && (
                     <BookmarkControls params={params} setParams={setParams} bookmarks={bookmarks} setBookmarks={setBookmarks} />
                )}
                {activeTab === 'Animation' && (
                     <AnimatorControls 
                        timeline={timeline} setTimeline={setTimeline}
                        isRendering={isRendering}
                        canvasRef={canvasRef}
                        animationSettings={animationSettings}
                     />
                )}
            </div>
        </div>
    );
};

export default Controls;
