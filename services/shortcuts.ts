
export interface Shortcut {
    category: 'Navigation' | 'View Control' | 'Animation' | 'Orbit Control' | 'General';
    bindings: {
        keys: string[];
        description: string;
    }[];
}

export const SHORTCUTS: Shortcut[] = [
    {
        category: 'Navigation',
        bindings: [
            { keys: ['Click', 'Drag'], description: 'Pan the view' },
            { keys: ['Scroll Wheel'], description: 'Zoom in/out at pointer' },
            { keys: ['W', '↑'], description: 'Pan Up' },
            { keys: ['S', '↓'], description: 'Pan Down' },
            { keys: ['A', '←'], description: 'Pan Left' },
            { keys: ['D', '→'], description: 'Pan Right' },
        ],
    },
    {
        category: 'View Control',
        bindings: [
            { keys: ['Single Click'], description: 'Recenter view to pointer' },
            { keys: ['Double Click'], description: 'Zoom in at pointer' },
            { keys: ['Shift', '+', 'Double Click'], description: 'Zoom out at pointer' },
            { keys: ['E', '+', '='], description: 'Zoom In (centered)' },
            { keys: ['Q', '-'], description: 'Zoom Out (centered)' },
            { keys: ['R'], description: 'Recenter view to pointer' },
            { keys: ['Shift', '+', 'R'], description: 'Reset view to default' },
        ],
    },
    {
        category: 'Animation',
        bindings: [
            { keys: ['Spacebar'], description: 'Add current scene as a keyframe' },
        ],
    },
    {
        category: 'Orbit Control',
        bindings: [
            { keys: ['F'], description: 'Freeze / unfreeze the orbit trace' },
        ],
    },
    {
        category: 'General',
        bindings: [
            { keys: ['?'], description: 'Toggle this help overlay' },
            { keys: ['Esc'], description: 'Close this help overlay' },
        ],
    },
];
