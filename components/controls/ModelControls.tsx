import React from 'react';
import { FractalParams, FractalModel, RenderMode, Complex } from '../../types';
import NumericStepper from './NumericStepper';
import ComplexStepper from './ComplexStepper';

interface ModelControlsProps {
    params: FractalParams;
    setParams: React.Dispatch<React.SetStateAction<FractalParams>>;
}

const ControlGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-3 bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-300 mb-2">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const LabeledSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }> = ({ label, value, onChange, children }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">{label}</label>
        <select value={value} onChange={onChange} className="bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-sm">
            {children}
        </select>
    </div>
);


const ModelControls: React.FC<ModelControlsProps> = ({ params, setParams }) => {
    
    const updateModelParam = <K extends keyof FractalParams['model']>(key: K, value: FractalParams['model'][K]) => {
        setParams(p => ({ ...p, model: { ...p.model, [key]: value } }));
    };
    
    const updateB1Param = (key: 'lambda', value: Complex) => {
        setParams(p => ({ ...p, model: { ...p.model, b1: { ...p.model.b1, [key]: value } } }));
    };
    
    const updateB2Param = (key: 'alpha' | 'M', index: number, value: Complex | number) => {
        setParams(p => {
            const newArr = [...p.model.b2[key]];
            newArr[index] = value as any;
            return { ...p, model: { ...p.model, b2: { ...p.model.b2, [key]: newArr }}};
        });
    };
    
    const { model } = params;

    return (
        <ControlGroup title="Model">
            <LabeledSelect label="Type" value={model.type} onChange={e => updateModelParam('type', e.target.value as FractalModel)}>
                {Object.values(FractalModel).map(m => <option key={m} value={m}>{m}</option>)}
            </LabeledSelect>
            <LabeledSelect label="Mode" value={model.mode} onChange={e => updateModelParam('mode', e.target.value as RenderMode)}>
                {Object.values(RenderMode).map(m => <option key={m} value={m}>{m}</option>)}
            </LabeledSelect>
            <NumericStepper label="τ Power (k)" value={model.k} onChange={v => updateModelParam('k', v)} step={0.01} precision={3} />
            {model.mode === RenderMode.Julia && (
                <div className="pl-4 border-l-2 border-gray-600 space-y-1 mt-2 pt-2">
                    <ComplexStepper
                        label="Julia C"
                        value={model.juliaC}
                        onChange={v => updateModelParam('juliaC', v)}
                        step={1e-3}
                        precision={6}
                    />
                </div>
            )}
             {model.type === FractalModel.B1 && (
                <div className="pl-4 border-l-2 border-cyan-500 space-y-1 mt-2 pt-2">
                     <p className="text-xs text-cyan-400 font-mono">f(z) = z²+c+λ·sin(τᵏz)</p>
                     <ComplexStepper
                        label="λ"
                        value={model.b1.lambda}
                        onChange={v => updateB1Param('lambda', v)}
                        step={1e-3}
                        precision={6}
                     />
                </div>
            )}
             {model.type === FractalModel.B2 && (
                <div className="pl-4 border-l-2 border-cyan-500 space-y-2 mt-2">
                     <p className="text-xs text-cyan-400 font-mono">f(z) = z²+c+Σαᵢ·sin(τᵏ/Mᵢ·z)</p>
                     { [0,1,2,3].map(i => (
                         <div key={i} className="space-y-1 p-2 bg-gray-800 rounded">
                             <p className="text-xs font-semibold text-gray-400">Term i={i+1}</p>
                            <ComplexStepper
                                label={`α${i+1}`}
                                value={model.b2.alpha[i]}
                                onChange={v => updateB2Param('alpha', i, v)}
                                step={1e-3}
                                precision={6}
                            />
                            <NumericStepper label={`M${i+1}`} value={model.b2.M[i]} onChange={v => updateB2Param('M', i, v)} step={1} precision={0} min={1} />
                         </div>
                     ))}
                </div>
            )}
        </ControlGroup>
    );
};

export default ModelControls;
