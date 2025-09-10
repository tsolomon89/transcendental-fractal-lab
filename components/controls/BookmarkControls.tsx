
import React, { useState } from 'react';
import { FractalParams, Bookmark } from '../../types';
import { SEED_SCENES, DEFAULT_PARAMS } from '../../constants';

interface BookmarkControlsProps {
    params: FractalParams;
    setParams: React.Dispatch<React.SetStateAction<FractalParams>>;
    bookmarks: Bookmark[];
    setBookmarks: React.Dispatch<React.SetStateAction<Bookmark[]>>;
}

const ControlGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-3 bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-300 mb-2">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const Button: React.FC<{ onClick: () => void; children: React.ReactNode, className?: string }> = ({ onClick, children, className }) => (
    <button onClick={onClick} className={`px-3 py-1 text-sm rounded transition-colors ${className || 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
        {children}
    </button>
);


const BookmarkControls: React.FC<BookmarkControlsProps> = ({ params, setParams, bookmarks, setBookmarks }) => {
    const [bookmarkName, setBookmarkName] = useState("New Scene");
    const [jsonText, setJsonText] = useState("");

    const saveBookmark = () => {
        if (!bookmarkName) return;
        const newBookmark: Bookmark = {
            id: new Date().toISOString(),
            name: bookmarkName,
            params: params,
        };
        setBookmarks(b => [...b, newBookmark]);
    };
    
    const loadBookmark = (bookmarkParams: FractalParams) => {
        setParams(bookmarkParams);
    };

    const deleteBookmark = (id: string) => {
        setBookmarks(b => b.filter(bm => bm.id !== id));
    };

    const exportBookmarks = () => {
        const jsonString = JSON.stringify(bookmarks, null, 2);
        setJsonText(jsonString);
    };

    const importBookmarks = () => {
        try {
            const imported = JSON.parse(jsonText);
            if (Array.isArray(imported)) {
                // Basic validation
                const validBookmarks = imported.filter(b => b.id && b.name && b.params);
                setBookmarks(validBookmarks);
            }
        } catch (e) {
            alert("Invalid JSON format.");
        }
    };

    return (
        <div className="space-y-4">
            <ControlGroup title="Save Current Scene">
                <div className="flex space-x-2">
                    <input 
                        type="text" 
                        value={bookmarkName} 
                        onChange={e => setBookmarkName(e.target.value)}
                        className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-sm"
                        placeholder="Bookmark Name"
                    />
                    <Button onClick={saveBookmark}>Save</Button>
                </div>
            </ControlGroup>
            
            <ControlGroup title="Seed Scenes">
                <div className="grid grid-cols-2 gap-2">
                    {SEED_SCENES.map(scene => (
                        <Button key={scene.name} onClick={() => loadBookmark({...DEFAULT_PARAMS, ...scene.params})} className="bg-gray-600 hover:bg-gray-500 text-white w-full">
                            {scene.name}
                        </Button>
                    ))}
                </div>
            </ControlGroup>

            <ControlGroup title="My Bookmarks">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {bookmarks.map(bm => (
                        <div key={bm.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                            <span className="text-sm">{bm.name}</span>
                            <div className="space-x-1">
                                <Button onClick={() => loadBookmark(bm.params)}>Load</Button>
                                <Button onClick={() => deleteBookmark(bm.id)} className="bg-red-600 hover:bg-red-500">Del</Button>
                            </div>
                        </div>
                    ))}
                    {bookmarks.length === 0 && <p className="text-xs text-gray-400">No bookmarks saved yet.</p>}
                </div>
            </ControlGroup>

            <ControlGroup title="Import / Export">
                <textarea 
                    value={jsonText}
                    onChange={e => setJsonText(e.target.value)}
                    className="w-full h-24 bg-gray-900 border border-gray-600 rounded-md p-2 text-xs font-mono"
                    placeholder="Paste JSON here to import..."
                />
                <div className="flex space-x-2">
                    <Button onClick={importBookmarks}>Import</Button>
                    <Button onClick={exportBookmarks}>Export</Button>
                </div>
            </ControlGroup>
        </div>
    );
};

export default BookmarkControls;
