
import React from 'react';
import { FractalParams } from '../../types';
import NumericStepper from './NumericStepper';

interface AnchorZoomControlsProps {
    params: FractalParams;
    setParams: React.Dispatch<React.SetStateAction<FractalParams>>;
}

const ControlGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-3 bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-300 mb-2">{title}</h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
     <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">{label}</label>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-5 h-5 bg-gray-900 border-gray-600 rounded text-cyan-500 focus:ring-cyan-600" />
    </div>
);

const AnchorZoomControls: React.FC<AnchorZoomControlsProps> = ({ params, setParams }) => {
    
    const updateAnchorZoomParam = <K extends keyof FractalParams['anchorZoom']>(key: K, value: FractalParams['anchorZoom'][K]) => {
        setParams(p => ({ ...p, anchorZoom: { ...p.anchorZoom, [key]: value } }));
    };
    
    const { anchorZoom } = params;

    return (
        <ControlGroup title="Anchor Zoom">
            <Checkbox label="Enable Dynamic Anchor" checked={anchorZoom.enabled} onChange={v => updateAnchorZoomParam('enabled', v)} />
            
            <div className={`transition-opacity duration-300 ${anchorZoom.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <NumericStepper 
                    label="Centering Gain" 
                    value={anchorZoom.centeringGain} 
                    onChange={v => updateAnchorZoomParam('centeringGain', v)} 
                    min={0.01} max={0.5} step={0.01} precision={2}
                 />
                 <NumericStepper 
                    label="Idle Threshold (ms)" 
                    value={anchorZoom.idleThreshold} 
                    onChange={v => updateAnchorZoomParam('idleThreshold', v)} 
                    min={0} max={1000} step={10} precision={0}
                 />
                  <NumericStepper 
                    label="Persistence (ms)" 
                    value={anchorZoom.persistenceDuration} 
                    onChange={v => updateAnchorZoomParam('persistenceDuration', v)} 
                    min={0} max={2000} step={10} precision={0}
                 />
                 <NumericStepper 
                    label="Max Shift (% view)" 
                    value={anchorZoom.maxCenterShiftPerFrame * 100} 
                    onChange={v => updateAnchorZoomParam('maxCenterShiftPerFrame', v / 100)} 
                    min={1} max={50} step={1} precision={0}
                 />
                 <NumericStepper 
                    label="Recapture Radius (% view)" 
                    value={anchorZoom.anchorRetainRadius * 100} 
                    onChange={v => updateAnchorZoomParam('anchorRetainRadius', v / 100)} 
                    min={0} max={100} step={1} precision={0}
                 />
            </div>
        </ControlGroup>
    );
};

export default AnchorZoomControls;