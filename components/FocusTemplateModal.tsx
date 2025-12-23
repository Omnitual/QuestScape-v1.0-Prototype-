import React, { useState } from 'react';
import { FocusTemplate } from '../types';
import { X, Hourglass, Save, Trash2 } from 'lucide-react';

interface FocusTemplateModalProps {
    initialTemplate?: FocusTemplate;
    onClose: () => void;
    onSave: (template: FocusTemplate) => void;
    onDelete?: (id: string) => void;
}

const FocusTemplateModal: React.FC<FocusTemplateModalProps> = ({ initialTemplate, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState(initialTemplate?.title || '');
    const [duration, setDuration] = useState(initialTemplate?.duration || 25);

    const handleSave = () => {
        if (!title.trim()) return;

        onSave({
            id: initialTemplate?.id || `foc-tmpl-${Date.now()}`,
            title,
            duration: Number(duration)
        });
        onClose();
    };

    const handleDelete = () => {
        if (initialTemplate && onDelete) {
            onDelete(initialTemplate.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                <div className="flex justify-between items-center p-4 bg-gray-900/50 border-b border-gray-800">
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-wider">
                        <Hourglass size={16} />
                        <span>{initialTemplate ? 'Edit Focus Template' : 'New Focus Template'}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">

                    {/* Template String */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                        <input
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder='e.g. "Deep Work", "Pomodoro"'
                            className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-cyan-500 transition font-bold text-sm"
                        />
                    </div>

                    {/* Duration Slider */}
                    <div className="bg-cyan-900/20 border border-cyan-800/50 p-4 rounded-lg">
                        <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-3 flex justify-between">
                            <span>Duration</span>
                            <span className="text-white font-mono text-sm">{duration} min</span>
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full accent-cyan-400 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-mono">
                            <span>5m</span>
                            <span>120m</span>
                        </div>
                    </div>

                </div>

                <div className="flex justify-between items-center p-4 border-t border-gray-800 bg-gray-900">
                    <div>
                        {initialTemplate && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold px-3 py-2 rounded hover:bg-red-900/20 transition-colors"
                            >
                                <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold shadow-lg shadow-cyan-900/20 transition-all text-sm flex items-center gap-2">
                            <Save size={16} /> Save Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusTemplateModal;