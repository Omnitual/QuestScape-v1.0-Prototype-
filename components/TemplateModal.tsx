import React, { useState } from 'react';
import { SideQuestTemplate } from '../types';
import { X, Sword, Save, Trash2, HelpCircle } from 'lucide-react';

interface TemplateModalProps {
    initialTemplate?: SideQuestTemplate;
    onClose: () => void;
    onSave: (template: SideQuestTemplate) => void;
    onDelete?: (id: string) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ initialTemplate, onClose, onSave, onDelete }) => {
    const [templateStr, setTemplateStr] = useState(initialTemplate?.template || '');
    const [min, setMin] = useState(initialTemplate?.min || 1);
    const [max, setMax] = useState(initialTemplate?.max || 10);
    const [unitXP, setUnitXP] = useState(initialTemplate?.unitXP || 5);
    const [unitGold, setUnitGold] = useState(initialTemplate?.unitGold || 1);

    const handleSave = () => {
        if (!templateStr.trim()) return;

        onSave({
            id: initialTemplate?.id || `sqt-${Date.now()}`,
            template: templateStr,
            min: Number(min),
            max: Number(max),
            unitXP: Number(unitXP),
            unitGold: Number(unitGold),
            baseQP: 1, // Defaulting base QP
            tags: initialTemplate?.tags || []
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
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                        <Sword size={16} />
                        <span>{initialTemplate ? 'Edit Template' : 'New Template'}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">

                    {/* Template String */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quest Title Template</label>
                        <input
                            autoFocus
                            type="text"
                            value={templateStr}
                            onChange={(e) => setTemplateStr(e.target.value)}
                            placeholder='e.g. "Do {n} Pushups"'
                            className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-emerald-500 transition font-mono text-sm"
                        />
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                            <HelpCircle size={10} /> Use <span className="font-mono text-emerald-400 bg-gray-800 px-1 rounded">{'{n}'}</span> as the placeholder for the random number.
                        </p>
                    </div>

                    {/* Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Quantity</label>
                            <input
                                type="number"
                                value={min}
                                onChange={(e) => setMin(Number(e.target.value))}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-emerald-500 transition font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Quantity</label>
                            <input
                                type="number"
                                value={max}
                                onChange={(e) => setMax(Number(e.target.value))}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-emerald-500 transition font-bold"
                            />
                        </div>
                    </div>

                    {/* Rewards */}
                    <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Rewards Calculation</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">XP per Unit</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={unitXP}
                                    onChange={(e) => setUnitXP(Number(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-indigo-300 focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Gold per Unit</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={unitGold}
                                    onChange={(e) => setUnitGold(Number(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-yellow-300 focus:outline-none focus:border-yellow-500 text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-3 text-[10px] text-gray-500 italic">
                            Example: A roll of <strong className="text-gray-300">{min}</strong> yields ~<strong className="text-indigo-400">{Math.ceil(min * unitXP)} XP</strong> and ~<strong className="text-yellow-500">{Math.ceil(min * unitGold)} Gold</strong>.
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
                        <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-lg shadow-emerald-900/20 transition-all text-sm flex items-center gap-2">
                            <Save size={16} /> Save Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateModal;