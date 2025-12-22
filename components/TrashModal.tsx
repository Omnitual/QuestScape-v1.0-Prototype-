import React from 'react';
import { useGame } from '../store';
import { Trash2, RotateCcw, X, Archive } from 'lucide-react';

interface TrashModalProps {
    onClose: () => void;
}

const TrashModal: React.FC<TrashModalProps> = ({ onClose }) => {
    const { state, dispatch } = useGame();
    const { archivedQuests } = state;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <Archive className="text-gray-400" size={20} />
                        <h3 className="text-lg font-bold text-gray-200">Trash Bin</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                    {(!archivedQuests || archivedQuests.length === 0) && (
                        <div className="text-center py-12 text-gray-600 flex flex-col items-center">
                            <Trash2 size={48} className="mb-2 opacity-20" />
                            <p>The trash is empty.</p>
                        </div>
                    )}

                    {archivedQuests?.map((quest) => (
                        <div key={quest.id} className="bg-gray-800/50 border border-gray-700 rounded p-3 flex justify-between items-center group hover:bg-gray-800 transition">
                            <div className="overflow-hidden">
                                <h4 className="font-semibold text-gray-300 truncate">{quest.title}</h4>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">{quest.type}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => dispatch({ type: 'RESTORE_QUEST', payload: quest.id })}
                                    className="p-2 hover:bg-gray-700 rounded text-amber-400 hover:text-amber-300 transition"
                                    title="Restore"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm("Permanently delete this quest? This cannot be undone.")) {
                                            dispatch({ type: 'PERMANENT_DELETE_QUEST', payload: quest.id });
                                        }
                                    }}
                                    className="p-2 hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400 transition"
                                    title="Delete Forever"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrashModal;