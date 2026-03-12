

import React from 'react';
import { FractalParams, Palette, PaletteType, GradientPalette, SmoothHSLPalette, SpectralTauPalette, InteriorColoringType, Complex } from '../../types';
import { PALETTES } from '../../constants';
import NumericStepper from './NumericStepper';
import ComplexStepper from './ComplexStepper';

interface PaletteControlsProps {
    params: FractalParams;
    setParams: React.Dispatch<React.SetStateAction<FractalParams>>;
}

const ControlGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-3 bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-300 mb-2">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const PaletteControls: React.FC<PaletteControlsProps> = ({ params, setParams }) => {
    const { palette } = params;

    const handlePaletteChange = (id: string) => {
        const newPalette = PALETTES.find(p => p.id === id) || PALETTES[0];
        setParams(p => ({ ...p, palette: newPalette }));
    };

    const updatePaletteParam = (key: string, value: any) => {
        setParams(p => ({ ...p, palette: { ...p.palette, [key]: value } }));
    };

    const updateInteriorParam = <K extends keyof FractalParams['interior']>(key: K, value: FractalParams['interior'][K]) => {
        setParams(p => ({ ...p, interior: { ...p.interior, [key]: value } }));
    };

    const updateOrbitTrapParam = (key: 'center' | 'radius', value: Complex | number) => {
        setParams(p => ({ ...p, interior: { ...p.interior, orbitTrap: { ...p.interior.orbitTrap, [key]: value as any }}}));
    };

    return (
        <div className="space-y-4">
            <ControlGroup title="Exterior Palette">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Preset</label>
                    <select value={palette.id} onChange={e => handlePaletteChange(e.target.value)} className="bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-sm">
                        {PALETTES.map(p => <option key={p.id} value={p.id}>{p.type}</option>)}
                    </select>
                </div>
                <div className="pl-4 border-l-2 border-cyan-500 space-y-2 mt-2 pt-2">
                    {palette.type === PaletteType.SmoothHSL && (
                        <>
                            <NumericStepper label="Hue Start" value={(palette as SmoothHSLPalette).hueStart} onChange={v => updatePaletteParam('hueStart', v)} step={1} precision={0} />
                            <NumericStepper label="Hue Scale" value={(palette as SmoothHSLPalette).hueScale} onChange={v => updatePaletteParam('hueScale', v)} step={0.001} precision={3} min={0}/>
                        </>
                    )}
                    {palette.type === PaletteType.SpectralTau && (
                        <>
                            <NumericStepper label="Cycles per τ" value={(palette as SpectralTauPalette).cyclesPerTau} onChange={v => updatePaletteParam('cyclesPerTau', v)} step={0.1} precision={2} min={0} />
                        </>
                    )}
                    {(palette.type === PaletteType.Fire || palette.type === PaletteType.Ice || palette.type === PaletteType.Custom) && (
                        <div>
                            <p className="text-sm text-gray-400">Gradient defined by presets.</p>
                            {(palette as GradientPalette).stops.map((stop, i) => (
                                <div key={i} className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded border border-gray-500" style={{ backgroundColor: `rgb(${stop.color.r}, ${stop.color.g}, ${stop.color.b})`}}></div>
                                    <span className="text-xs font-mono">{`@ ${(stop.pos * 100).toFixed(0)}%`}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ControlGroup>
            <ControlGroup title="Interior Coloring">
                 <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Algorithm</label>
                    <select value={params.interior.type} onChange={e => updateInteriorParam('type', e.target.value as InteriorColoringType)} className="bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-sm w-48">
                        {Object.values(InteriorColoringType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {params.interior.type === InteriorColoringType.OrbitTrap && (
                    <div className="pl-4 border-l-2 border-cyan-500 space-y-2 mt-2 pt-2">
                        <ComplexStepper 
                            label="Trap Center"
                            value={params.interior.orbitTrap.center}
                            onChange={v => updateOrbitTrapParam('center', v)}
                            step={0.01}
                            precision={4}
                        />
                        <NumericStepper
                            label="Trap Radius"
                            value={params.interior.orbitTrap.radius}
                            onChange={v => updateOrbitTrapParam('radius', v)}
                            step={0.01}
                            precision={3}
                            min={1e-6}
                        />
                    </div>
                )}
            </ControlGroup>
        </div>
    );
};

export default PaletteControls;