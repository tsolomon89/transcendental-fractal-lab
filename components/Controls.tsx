
import React, { useState } from 'react';
import { FractalParams, Bookmark, Keyframe, AnimationSettings } from '../types';
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

const Controls: React.FC<ControlsProps> = (props) => {
    const { 
        params, setParams, isRendering, 
        bookmarks, setBookmarks, 
        timeline, setTimeline,
        animationSettings, setAnimationSettings,
        isPlaying, setIsPlaying,
        canvasRef
    } = props;

    const [activeTab, setActiveTab] = useState<Tab>('Scene');

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
                        currentParams={params} 
                        timeline={timeline} setTimeline={setTimeline}
                        animationSettings={animationSettings} setAnimationSettings={setAnimationSettings}
                        isRendering={isRendering}
                        isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                        canvasRef={canvasRef}
                     />
                )}
            </div>
        </div>
    );
};

export default Controls;
