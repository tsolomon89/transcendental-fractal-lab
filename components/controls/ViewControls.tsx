import React from 'react';
import { FractalParams } from '../../types';
import NumericStepper from './NumericStepper';

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
                <NumericStepper label="Center (Re)" value={params.view.centerRe} onChange={v => updateViewParam('centerRe', v)} step={1e-3} precision={8} />
                <NumericStepper label="Center (Im)" value={params.view.centerIm} onChange={v => updateViewParam('centerIm', v)} step={1e-3} precision={8} />
                <NumericStepper label="Scale" value={params.view.scale} onChange={v => updateViewParam('scale', v)} step={1} precision={8} min={1e-15} />
            </ControlGroup>
            <ControlGroup title="Iteration & Escape">
                <NumericStepper label="Max Iterations" value={params.iter.maxIter} onChange={v => updateIterParam('maxIter', v)} step={10} precision={0} min={1} />
                <NumericStepper label="Escape Radius" value={params.iter.escapeR} onChange={v => updateIterParam('escapeR', v)} step={0.1} precision={2} min={2} />
            </ControlGroup>
        </div>
    );
};

export default ViewControls;