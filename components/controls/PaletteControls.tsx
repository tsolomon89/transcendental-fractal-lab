
import React from 'react';
import { FractalParams, Palette, PaletteType, GradientPalette, SmoothHSLPalette, SpectralTauPalette } from '../../types';
import { PALETTES } from '../../constants';
import NumberInput from './NumberInput';

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

    return (
        <ControlGroup title="Palette">
            <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Preset</label>
                <select value={palette.id} onChange={e => handlePaletteChange(e.target.value)} className="bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-sm">
                    {PALETTES.map(p => <option key={p.id} value={p.id}>{p.type}</option>)}
                </select>
            </div>
            <div className="pl-4 border-l-2 border-cyan-500 space-y-2 mt-2 pt-2">
                {palette.type === PaletteType.SmoothHSL && (
                    <>
                        <NumberInput label="Hue Start" value={(palette as SmoothHSLPalette).hueStart} onChange={v => updatePaletteParam('hueStart', v)} step={1} precision={0} />
                        <NumberInput label="Hue Scale" value={(palette as SmoothHSLPalette).hueScale} onChange={v => updatePaletteParam('hueScale', v)} step={0.001} precision={3} />
                    </>
                )}
                {palette.type === PaletteType.SpectralTau && (
                    <>
                         <NumberInput label="Cycles per τ" value={(palette as SpectralTauPalette).cyclesPerTau} onChange={v => updatePaletteParam('cyclesPerTau', v)} step={0.1} precision={2} />
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
    );
};

export default PaletteControls;
