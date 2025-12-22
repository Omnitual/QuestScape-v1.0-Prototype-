import React from 'react';
import { useGame } from '../store';
import { Trash2, RotateCcw, Archive } from 'lucide-react';

const ArchivedView: React.FC = () => {
    const { state, dispatch } = useGame();
    const { archivedQuests } = state;

    return (
        <div className="p-6 max-w-7xl mx-auto pb-24 animate-fade-in">
            <header className="mb-6 flex items-center gap-3">
                <div className="p-3 bg-red-900/20 rounded-lg text-red-400">
                    <Archive size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-cinzel text-gray-200">Archives</h1>
                    <p className="text-gray-400 text-sm">Abandoned and forgotten quests lie here.</p>
                </div>
            </header>

            <div className="space-y-3">
                {(!archivedQuests || archivedQuests.length === 0) && (
                    <div className="text-center py-20 text-gray-600 flex flex-col items-center border border-dashed border-gray-800 rounded-lg">
                        <Trash2 size={48} className="mb-4 opacity-20" />
                        <p>The archives are empty.</p>
                    </div>
                )}

                {archivedQuests?.map((quest) => (
                    <div key={quest.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-gray-750 transition shadow-sm">
                        <div className="overflow-hidden">
                            <h4 className="font-semibold text-gray-300 truncate">{quest.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-gray-900 px-2 py-0.5 rounded text-gray-500 uppercase tracking-wider">{quest.type}</span>
                                <span className="text-xs text-gray-600">Rewards forfeited</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                                onClick={() => dispatch({ type: 'RESTORE_QUEST', payload: quest.id })}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-900/30 hover:bg-indigo-900/50 rounded text-indigo-300 hover:text-indigo-200 transition text-sm font-medium"
                            >
                                <RotateCcw size={16} /> Restore
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm("Permanently delete this quest? This cannot be undone.")) {
                                        dispatch({ type: 'PERMANENT_DELETE_QUEST', payload: quest.id });
                                    }
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 rounded text-red-300 hover:text-red-200 transition text-sm font-medium"
                            >
                                <Trash2 size={16} /> Delete Forever
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArchivedView;