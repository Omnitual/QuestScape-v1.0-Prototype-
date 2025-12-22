import React, { useState, useEffect } from 'react';
import { EventTemplate } from '../types';
import { X, Calendar, Save, Trash2, Dice5, ChevronDown, ChevronUp } from 'lucide-react';
import { useGame } from '../store';

interface EventTemplateModalProps {
    initialTemplate?: EventTemplate;
    onClose: () => void;
    onSave: (template: EventTemplate) => void;
    onDelete?: (id: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EventTemplateModal: React.FC<EventTemplateModalProps> = ({ initialTemplate, onClose, onSave, onDelete }) => {
    const { state } = useGame();

    const [title, setTitle] = useState(initialTemplate?.title || '');
    const [description, setDescription] = useState(initialTemplate?.description || '');

    // Use initialTemplate allowed days, OR default to user preference from stats
    const defaultDays = state.stats.idealDays && state.stats.idealDays.length > 0 ? state.stats.idealDays : [0, 1, 2, 3, 4, 5, 6];
    const [allowedDays, setAllowedDays] = useState<number[]>(initialTemplate?.allowedDays || defaultDays);

    const [spawnChance, setSpawnChance] = useState(initialTemplate?.spawnChance || 0.25);
    const [xpReward, setXpReward] = useState(initialTemplate?.xpReward || 50);
    const [goldReward, setGoldReward] = useState(initialTemplate?.goldReward || 20);

    const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

    const toggleDay = (dayIndex: number) => {
        if (allowedDays.includes(dayIndex)) {
            setAllowedDays(allowedDays.filter(d => d !== dayIndex));
        } else {
            setAllowedDays([...allowedDays, dayIndex]);
        }
    };

    const handleSave = () => {
        if (!title.trim()) return;
        if (allowedDays.length === 0) return;

        onSave({
            id: initialTemplate?.id || `evt-tmpl-${Date.now()}`,
            title,
            description,
            allowedDays,
            spawnChance,
            xpReward,
            goldReward,
            qpReward: 2
        });
        onClose();
    };

    const getSpawnSummary = () => {
        const daysText = allowedDays.length === 7 ? "Every Day" : allowedDays.length === 0 ? "No Days" : `${allowedDays.length} Days`;
        const chanceText = `${Math.round(spawnChance * 100)}% Chance`;
        return `${daysText} @ ${chanceText}`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                <div className="flex justify-between items-center p-4 bg-gray-900/50 border-b border-gray-800">
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-bold uppercase tracking-wider">
                        <Calendar size={16} />
                        <span>{initialTemplate ? 'Edit World Event' : 'New World Event'}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Title</label>
                            <input
                                autoFocus
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Mentor Meeting, Gym Session"
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-purple-500 transition font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Flavor text..."
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-purple-500 transition text-sm"
                            />
                        </div>
                    </div>

                    {/* Randomization Rules Dropdown */}
                    <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Randomization Rules</label>
                        <button
                            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-left flex justify-between items-center hover:border-gray-500 transition group"
                        >
                            <div className="flex items-center gap-2">
                                <Dice5 size={16} className={allowedDays.length > 0 ? "text-purple-400" : "text-gray-600"} />
                                <span className={`text-sm ${allowedDays.length > 0 ? 'text-white' : 'text-gray-500'}`}>
                                    {getSpawnSummary()}
                                </span>
                            </div>
                            {isSettingsExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                        </button>

                        {isSettingsExpanded && (
                            <div className="mt-4 space-y-5 animate-fade-in border-t border-gray-700 pt-4">

                                {/* Days Selection */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Allowed Days</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setAllowedDays([0, 1, 2, 3, 4, 5, 6])}
                                                className="text-[10px] text-gray-500 hover:text-white underline"
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() => setAllowedDays([])}
                                                className="text-[10px] text-gray-500 hover:text-white underline"
                                            >
                                                None
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between gap-1">
                                        {WEEKDAYS.map((day, idx) => (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(idx)}
                                                className={`w-9 h-9 rounded flex items-center justify-center text-xs font-bold transition border ${allowedDays.includes(idx) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                            >
                                                {day[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Chance Slider */}
                                <div>
                                    <label className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                                        <span>Spawn Probability</span>
                                        <span className="text-purple-400">{Math.round(spawnChance * 100)}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0.05"
                                        max="1"
                                        step="0.05"
                                        value={spawnChance}
                                        onChange={(e) => setSpawnChance(Number(e.target.value))}
                                        className="w-full accent-purple-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Likelihood of appearing on the dashboard on allowed days.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rewards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">XP Reward</label>
                            <input
                                type="number"
                                value={xpReward}
                                onChange={(e) => setXpReward(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-indigo-300 focus:outline-none focus:border-indigo-500 text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Gold Reward</label>
                            <input
                                type="number"
                                value={goldReward}
                                onChange={(e) => setGoldReward(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-yellow-300 focus:outline-none focus:border-yellow-500 text-sm font-bold"
                            />
                        </div>
                    </div>

                </div>

                <div className="flex justify-between items-center p-4 border-t border-gray-800 bg-gray-900">
                    <div>
                        {initialTemplate && (
                            <button
                                onClick={() => onDelete && onDelete(initialTemplate.id)}
                                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold px-3 py-2 rounded hover:bg-red-900/20 transition-colors"
                            >
                                <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold shadow-lg shadow-purple-900/20 transition-all text-sm flex items-center gap-2">
                            <Save size={16} /> Save World Event
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventTemplateModal;