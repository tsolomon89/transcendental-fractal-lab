import React, { useState, useEffect, useRef, useCallback, useId } from 'react';

interface NumericStepperProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    step?: number;
    precision?: number;
    min?: number;
    max?: number;
}

const StepperButton: React.FC<{ onPointerDown: () => void; onPointerUp: () => void; onPointerLeave: () => void; onClick: () => void; children: React.ReactNode; ariaLabel: string }> = 
({ onPointerDown, onPointerUp, onPointerLeave, onClick, children, ariaLabel }) => (
    <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
        className="w-6 h-6 bg-gray-600 text-gray-200 rounded-sm flex items-center justify-center font-bold hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
        aria-label={ariaLabel}
        tabIndex={-1}
    >
        {children}
    </button>
);

const NumericStepper: React.FC<NumericStepperProps> = ({
    label,
    value,
    onChange,
    step = 1,
    precision = 6,
    min = -Infinity,
    max = Infinity,
}) => {
    const id = useId();
    const [displayValue, setDisplayValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const valueRef = useRef(value);
    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => { valueRef.current = value; }, [value]);

    const formatValue = useCallback((val: number) => {
        if (isNaN(val)) return '';
        if (precision === 0) return val.toFixed(0);

        if (Math.abs(val) > 1e6 || (val !== 0 && Math.abs(val) < Math.pow(10, -precision + 1))) {
            return val.toPrecision(precision);
        }
        return val.toFixed(precision);
    }, [precision]);

    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setDisplayValue(formatValue(value));
        }
    }, [value, formatValue]);

    const clampValue = useCallback((val: number) => {
        return Math.max(min, Math.min(max, val));
    }, [min, max]);

    const handleCommit = useCallback((val: number) => {
        const clamped = clampValue(val);
        if (clamped !== value) {
            onChange(clamped);
        }
        setDisplayValue(formatValue(clamped));
    }, [clampValue, onChange, value, formatValue]);

    const handleBlur = () => {
        const parsed = parseFloat(displayValue);
        handleCommit(isNaN(parsed) ? value : parsed);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
            (e.target as HTMLInputElement).blur();
            return;
        }

        let multiplier = 1;
        if (e.shiftKey) multiplier *= 10;

        let delta = 0;
        switch (e.key) {
            case 'ArrowUp': delta = step * multiplier; break;
            case 'ArrowDown': delta = -step * multiplier; break;
            case 'PageUp': delta = step * 10 * multiplier; break;
            case 'PageDown': delta = -step * 10 * multiplier; break;
            default: return;
        }
        
        e.preventDefault();
        const currentVal = parseFloat(displayValue);
        const valToStep = isNaN(currentVal) ? value : currentVal;
        handleCommit(valToStep + delta);
    };

    const stopStepping = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        timeoutRef.current = null;
        intervalRef.current = null;
    }, []);

    const startStepping = useCallback((direction: number) => {
        stopStepping();
        const newValue = clampValue(valueRef.current + step * direction);
        onChange(newValue);
        
        timeoutRef.current = window.setTimeout(() => {
            intervalRef.current = window.setInterval(() => {
                const nextValue = clampValue(valueRef.current + step * direction);
                onChange(nextValue);
            }, 80);
        }, 350);
    }, [stopStepping, clampValue, step, onChange]);

    return (
        <div className="flex items-center justify-between">
            <label id={id} className="text-sm text-gray-300">{label}</label>
            <div className="flex items-center space-x-1">
                <StepperButton 
                    onPointerDown={() => startStepping(-1)}
                    onPointerUp={stopStepping}
                    onPointerLeave={stopStepping}
                    onClick={() => onChange(clampValue(value - step))}
                    ariaLabel={`Decrease ${label}`}
                >
                    -
                </StepperButton>
                <input
                    ref={inputRef}
                    type="text"
                    role="spinbutton"
                    aria-labelledby={id}
                    aria-valuenow={value}
                    aria-valuemin={min === -Infinity ? undefined : min}
                    aria-valuemax={max === Infinity ? undefined : max}
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-24 bg-gray-900 text-gray-200 border border-gray-600 rounded-md px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <StepperButton 
                    onPointerDown={() => startStepping(1)}
                    onPointerUp={stopStepping}
                    onPointerLeave={stopStepping}
                    onClick={() => onChange(clampValue(value + step))}
                    ariaLabel={`Increase ${label}`}
                >
                    +
                </StepperButton>
            </div>
        </div>
    );
};

export default NumericStepper;