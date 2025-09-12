import React, { useState } from 'react';
import { Complex } from '../../types';
import NumericStepper from './NumericStepper';

interface ComplexStepperProps {
    label: string;
    value: Complex;
    onChange: (value: Complex) => void;
    step?: number;
    precision?: number;
}

const ComplexStepper: React.FC<ComplexStepperProps> = ({ label, value, onChange, step = 1e-3, precision = 6 }) => {
    const [stepAmount, setStepAmount] = useState(0.001);

    const handleBatchStep = (direction: number) => {
        const newRe = value.re + stepAmount * direction;
        const newIm = value.im + stepAmount * direction;
        onChange({ re: newRe, im: newIm });
    };

    return (
        <div className="space-y-1">
            <NumericStepper 
                label={`${label} (Re)`} 
                value={value.re} 
                onChange={v => onChange({ ...value, re: v })} 
                step={step} 
                precision={precision} 
            />
            <NumericStepper 
                label={`${label} (Im)`} 
                value={value.im} 
                onChange={v => onChange({ ...value, im: v })} 
                step={step} 
                precision={precision} 
            />
            <div className="flex items-center justify-between pt-1">
                <label className="text-sm text-gray-300">Step Amount</label>
                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={() => handleBatchStep(-1)}
                        className="w-6 h-6 bg-gray-600 text-gray-200 rounded-sm flex items-center justify-center font-bold hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                        aria-label={`Decrement ${label} Re and Im by step amount`}
                    >
                        -
                    </button>
                    <input
                        type="number"
                        value={stepAmount}
                        onChange={(e) => setStepAmount(parseFloat(e.target.value) || 0)}
                        step={0.001}
                        className="w-24 bg-gray-900 text-gray-200 border border-gray-600 rounded-md px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                        type="button"
                        onClick={() => handleBatchStep(1)}
                        className="w-6 h-6 bg-gray-600 text-gray-200 rounded-sm flex items-center justify-center font-bold hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                        aria-label={`Increment ${label} Re and Im by step amount`}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComplexStepper;
