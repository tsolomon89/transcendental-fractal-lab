
import React, { useState, useEffect } from 'react';

interface NumberInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    step?: number;
    precision?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, step = 1e-6, precision = 6 }) => {
    const [displayValue, setDisplayValue] = useState(value.toFixed(precision));

    useEffect(() => {
        setDisplayValue(value.toFixed(precision));
    }, [value, precision]);

    const handleBlur = () => {
        const parsed = parseFloat(displayValue);
        if (!isNaN(parsed)) {
            onChange(parsed);
            setDisplayValue(parsed.toFixed(precision));
        } else {
            setDisplayValue(value.toFixed(precision));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">{label}</label>
            <input
                type="number"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step={step}
                className="w-36 bg-gray-900 text-gray-200 border border-gray-600 rounded-md px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
        </div>
    );
};

export default NumberInput;
