import React, { useState } from 'react';
import { useGame } from '../store';
import { Settings, PlusCircle, Coins, RotateCcw, AlertTriangle } from 'lucide-react';

const TestModeControls: React.FC = () => {
    const { dispatch } = useGame();
    const [isOpen, setIsOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleClose = () => {
        setIsOpen(false);
        setShowConfirm(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-gray-800 text-gray-400 p-2 rounded-full hover:text-white hover:bg-gray-700 transition-all border border-gray-600 shadow-lg z-50"
                title="Settings"
            >
                <Settings size={20} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-xl z-50 w-64 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Settings</h3>
                <button onClick={handleClose} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-2">
                <button
                    onClick={() => dispatch({ type: 'TEST_ADD_XP', payload: 50 })}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-xs py-2 rounded transition"
                >
                    <PlusCircle size={14} /> Add 50 XP
                </button>
                <button
                    onClick={() => dispatch({ type: 'TEST_ADD_XP', payload: 500 })}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-xs py-2 rounded transition"
                >
                    <PlusCircle size={14} /> Add 500 XP
                </button>
                <button
                    onClick={() => dispatch({ type: 'TEST_ADD_GOLD', payload: 100 })}
                    className="w-full flex items-center justify-center gap-2 bg-amber-900/50 hover:bg-amber-800 text-amber-200 text-xs py-2 rounded transition"
                >
                    <Coins size={14} /> Add 100 Gold
                </button>

                <div className="border-t border-gray-800 my-3 pt-3">
                    {!showConfirm ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 hover:border-red-800 text-xs py-2 rounded transition"
                        >
                            <RotateCcw size={14} /> Reset Progress
                        </button>
                    ) : (
                        <div className="space-y-2 animate-fade-in bg-gray-950/50 p-2 rounded border border-red-900/30">
                            <div className="text-center mb-2">
                                <p className="text-red-400 text-xs font-bold flex items-center justify-center gap-1">
                                    <AlertTriangle size={12} /> Are you sure?
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                                    This will wipe all data and quests permanently.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-1.5 rounded transition border border-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        dispatch({ type: 'FULL_RESET' });
                                        handleClose();
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-1.5 rounded transition"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestModeControls;