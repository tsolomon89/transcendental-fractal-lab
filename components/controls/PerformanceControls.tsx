import React from 'react';
import { FractalParams } from '../../types';
import NumericStepper from './NumericStepper';

interface PerformanceControlsProps {
    params: FractalParams;
    setParams: React.Dispatch<React.SetStateAction<FractalParams>>;
}

const ControlGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-3 bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-300 mb-2">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const PerformanceControls: React.FC<PerformanceControlsProps> = ({ params, setParams }) => {
    const updatePerfParam = <K extends keyof FractalParams['perf']>(key: K, value: FractalParams['perf'][K]) => {
        setParams(p => ({ ...p, perf: { ...p.perf, [key]: value } }));
    };

    return (
        <ControlGroup title="Performance">
            <NumericStepper label="Rows per Frame" value={params.perf.rowsPerFrame} onChange={v => updatePerfParam('rowsPerFrame', v)} step={1} precision={0} min={1} />
            <NumericStepper label="Frame Budget (ms)" value={params.perf.frameBudget} onChange={v => updatePerfParam('frameBudget', v)} step={1} precision={0} min={1} />
        </ControlGroup>
    );
};

export default PerformanceControls;