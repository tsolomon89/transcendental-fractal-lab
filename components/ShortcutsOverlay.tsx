
import React, { useEffect } from 'react';
import { SHORTCUTS } from '../services/shortcuts';

interface ShortcutsOverlayProps {
    onClose: () => void;
}

const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <kbd className="inline-flex items-center justify-center px-2 py-1 mx-0.5 text-sm font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm">
        {children}
    </kbd>
);

const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-gray-800 text-gray-200 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-600"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-cyan-400">Keyboard & Mouse Controls</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {SHORTCUTS.map(category => (
                        <div key={category.category}>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2 border-b border-gray-700 pb-1">{category.category}</h3>
                            <dl className="space-y-2">
                                {category.bindings.map(binding => (
                                    <div key={binding.description} className="flex items-center justify-between text-sm">
                                        <dt className="text-gray-300">{binding.description}</dt>
                                        <dd className="flex items-center">
                                            {binding.keys.map((key, index) => (
                                                <React.Fragment key={index}>
                                                    <Key>{key}</Key>
                                                    {index < binding.keys.length - 1 && <span className="mx-1 text-gray-500">+</span>}
                                                </React.Fragment>
                                            ))}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}
                </div>
                 <p className="text-xs text-center text-gray-500 mt-6">
                    Press <Key>Esc</Key> or click outside to close.
                </p>
            </div>
        </div>
    );
};

export default ShortcutsOverlay;
