
import React from 'react';

const Help: React.FC = () => {
    return (
        <details className="mt-6 text-sm text-gray-400">
            <summary className="cursor-pointer font-semibold text-gray-300 hover:text-cyan-400">
                Help & Math Notes
            </summary>
            <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
                <p><strong>Controls:</strong> Use mouse to pan, wheel to zoom. Click to recenter. Double-click to zoom in/out (with Shift).</p>
                <p><strong>Keyboard:</strong> Use WASD/Arrows to pan. Use Q/E or +/- to zoom. 'R' recenters to pointer, 'Shift+R' resets view. 'Space' plays/pauses animation.</p>
                <h4 className="font-bold text-gray-200">Orbit Visualization</h4>
                <p>Enable "Show Orbit" in the Scene tab to see the iteration path (z₀, z₁, z₂, ...) for the point under your cursor. This helps visualize why a point escapes or remains bounded.</p>
                <h4 className="font-bold text-gray-200">Model Explanations</h4>
                <p>All models now incorporate a <strong className="text-cyan-400">τ Power (k)</strong> parameter. Setting k=0 recovers the original formulas.</p>
                <p><strong>A0: <span className="font-mono">f(z) = z²τᵏ + c</span></strong><br />A generalization of the classic Mandelbrot/Julia function. Setting k=2 reproduces the old 'A1' model.</p>
                <p><strong>A2: <span className="font-mono">f(z) = z² + cτᵏ</span></strong><br />Scales the parameter `c` by τᵏ. For Mandelbrot, this is equivalent to scaling the coordinate system.</p>
                <p><strong>Aτ: <span className="font-mono">f(z) = (z² + c)/τᵏ</span></strong><br />This model is "affinely conjugate" to A0. Its dynamics are identical, just rescaled.</p>
                <p><strong>B1/B2: Transcendental Forcing</strong><br />Models like <span className="font-mono">f(z) = z² + c + λ·sin(τᵏz)</span> introduce a "transcendental forcing" term. Unlike in Aτ, the τᵏ here cannot be scaled away, leading to fundamentally new and complex fractal structures.</p>
                <h4 className="font-bold text-gray-200">Smooth Coloring</h4>
                <p>We use a smoothing formula to avoid distinct color bands: <span className="font-mono">ν = n + 1 - log(log|z|) / log(2)</span>. This provides a continuous "potential" value that is used to look up colors in the palette gradient, resulting in smoother visuals.</p>
            </div>
        </details>
    );
};

export default Help;
