
import React from 'react';
import { FractalParams } from '../../types';
import NumberInput from './NumberInput';

interface ViewControlsProps {
    params: FractalParams;
    setParams: React.Dispatch<React.SetStateAction<FractalParams>>;
}

const ControlGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-3 bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-300 mb-2">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const ViewControls: React.FC<ViewControlsProps> = ({ params, setParams }) => {
    
    const updateViewParam = <K extends keyof FractalParams['view']>(key: K, value: FractalParams['view'][K]) => {
        setParams(p => ({ ...p, view: { ...p.view, [key]: value } }));
    };
    
    const updateIterParam = <K extends keyof FractalParams['iter']>(key: K, value: FractalParams['iter'][K]) => {
        setParams(p => ({ ...p, iter: { ...p.iter, [key]: value } }));
    };

    return (
        <div className="space-y-4">
            <ControlGroup title="View">
                <NumberInput label="Center (Re)" value={params.view.centerRe} onChange={v => updateViewParam('centerRe', v)} />
                <NumberInput label="Center (Im)" value={params.view.centerIm} onChange={v => updateViewParam('centerIm', v)} />
                 <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Scale</label>
                    <input
                        type="number"
                        value={params.view.scale}
                        onChange={e => updateViewParam('scale', parseFloat(e.target.value))}
                        step={1}
                        className="w-36 bg-gray-900 text-gray-200 border border-gray-600 rounded-md px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
            </ControlGroup>
            <ControlGroup title="Iteration & Escape">
                <NumberInput label="Max Iterations" value={params.iter.maxIter} onChange={v => updateIterParam('maxIter', v)} step={1} precision={0} />
                <NumberInput label="Escape Radius" value={params.iter.escapeR} onChange={v => updateIterParam('escapeR', v)} step={0.1} precision={2} />
            </ControlGroup>
        </div>
    );
};

export default ViewControls;
