

import React from 'react';
import { FractalParams, OrbitGradient } from '../../types';

interface OrbitControlsProps {
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

const Slider: React.FC<{ label: string; value: number; onChange: (value: number) => void; min: number; max: number; step: number; }> = 
    ({ label, value, onChange, min, max, step }) => (
    <div>
        <div className="flex justify-between text-sm">
            <label className="text-gray-300">{label}</label>
            <span>{value}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
    </div>
);

const OrbitControls: React.FC<OrbitControlsProps> = ({ params, setParams }) => {
    
    const updateOrbitParam = <K extends keyof FractalParams['orbit']>(key: K, value: FractalParams['orbit'][K]) => {
        setParams(p => {
            const newOrbitParams = { ...p.orbit, [key]: value };

            if (key === 'maxIter' && typeof value === 'number') {
                newOrbitParams.skipInitial = Math.min(newOrbitParams.skipInitial, Math.max(0, value - 2));
            }
            
            return { ...p, orbit: newOrbitParams };
        });
    };
    
    const { orbit } = params;

    return (
        <ControlGroup title="Orbit Visualization">
            <Checkbox label="Show Orbit" checked={orbit.show} onChange={v => updateOrbitParam('show', v)} />
            <Checkbox label="Freeze Orbit (F)" checked={orbit.freeze} onChange={v => updateOrbitParam('freeze', v)} />
            
            <div className={`transition-opacity duration-300 ${orbit.show ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <Checkbox label="Show Bailout Circle" checked={orbit.showBailoutCircle} onChange={v => updateOrbitParam('showBailoutCircle', v)} />
                 <Checkbox label="Show Analysis on HUD" checked={orbit.showAnalysis} onChange={v => updateOrbitParam('showAnalysis', v)} />
                 <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Gradient</label>
                    <select value={orbit.gradient} onChange={e => updateOrbitParam('gradient', e.target.value as OrbitGradient)} className="bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-sm">
                        {Object.values(OrbitGradient).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <Slider label="Max Iterations" value={orbit.maxIter} onChange={v => updateOrbitParam('maxIter', v)} min={10} max={5000} step={10} />
                <Slider label="Skip Initial Iterations" value={orbit.skipInitial} onChange={v => updateOrbitParam('skipInitial', v)} min={0} max={Math.max(0, orbit.maxIter - 2)} step={1} />
                <Slider label="Thickness" value={orbit.thickness} onChange={v => updateOrbitParam('thickness', v)} min={0.5} max={10} step={0.1} />
                <Slider label="Opacity" value={orbit.alpha} onChange={v => updateOrbitParam('alpha', v)} min={0.1} max={1} step={0.05} />
            </div>
        </ControlGroup>
    );
};

export default OrbitControls;