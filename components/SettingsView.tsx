import React, { useState } from 'react';
import { useGame } from '../store';
import { useToast } from './ToastContext';
import { Terminal, Plus, Coins, AlertTriangle, Settings, Flame, User, Sliders, Download, Upload, Calendar, Edit2, Save, Trophy, Zap, CheckCircle2, History, Sword, RotateCcw, Sparkles } from 'lucide-react';
import { GameState, QuestType, SideQuestTemplate, EventTemplate } from '../types';
import StatGraph from './StatGraph';
import TemplateModal from './TemplateModal';
import EventTemplateModal from './EventTemplateModal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Removed onShowToast from props, using hook
interface SettingsViewProps {}

type SettingsTab = 'STATS' | 'SETTINGS' | 'MODIFIERS' | 'DEBUG';

const SettingsView: React.FC<SettingsViewProps> = () => {
    const { state, dispatch } = useGame();
    const { showToast } = useToast(); // Use global hook
    const [activeTab, setActiveTab] = useState<SettingsTab>('STATS');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(state.stats.name);
    const [editWakeTime, setEditWakeTime] = useState(state.stats.wakeUpTime);
    const [editIdealDays, setEditIdealDays] = useState<number[]>(state.stats.idealDays || [0, 1, 2, 3, 4, 5, 6]);

    // Settings Edit State
    const [settings, setSettings] = useState(state.settings);

    // Template Management State
    const [isAddingTemplate, setIsAddingTemplate] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<SideQuestTemplate | null>(null);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventTemplate | null>(null);

    const { sideQuestTemplates, eventTemplates } = state;

    const saveProfile = () => {
        dispatch({
            type: 'UPDATE_PROFILE',
            payload: { name: editName, wakeUpTime: editWakeTime, idealDays: editIdealDays }
        });
        setIsEditingProfile(false);
        showToast("Profile updated successfully", undefined, 'default');
    };

    const toggleIdealDay = (dayIdx: number) => {
        if (editIdealDays.includes(dayIdx)) {
            setEditIdealDays(editIdealDays.filter(d => d !== dayIdx));
        } else {
            setEditIdealDays([...editIdealDays, dayIdx]);
        }
    };

    const handleSettingChange = (key: keyof typeof settings, value: number) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    };

    // --- Content Management Handlers ---
    const handleSaveTemplate = (template: SideQuestTemplate) => {
        dispatch({ type: 'SAVE_SIDE_QUEST_TEMPLATE', payload: template });
        showToast("Template Saved", undefined, 'default');
    };

    const handleDeleteTemplate = (id: string) => {
        dispatch({ type: 'DELETE_SIDE_QUEST_TEMPLATE', payload: id });
        showToast("Template Deleted", undefined, 'default');
    };

    const handleSaveEvent = (template: EventTemplate) => {
        dispatch({ type: 'SAVE_EVENT_TEMPLATE', payload: template });
        showToast("Event Saved", undefined, 'default');
    };

    const handleDeleteEvent = (id: string) => {
        dispatch({ type: 'DELETE_EVENT_TEMPLATE', payload: id });
        showToast("Event Deleted", undefined, 'default');
    };

    const exportData = () => {
        const exportObj = {
            metadata: {
                exportedAt: new Date().toISOString(),
                appName: "QuestLife",
                version: "2.1"
            },
            settings: state.settings,
            stats: state.stats,
            quests: {
                active: state.quests,
                archived: state.archivedQuests,
                sideQuestTemplates: state.sideQuestTemplates,
                eventTemplates: state.eventTemplates
            },
            activityLog: state.activityLog
        };

        const dataStr = JSON.stringify(exportObj, null, 4);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `questlife_data_${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        showToast("Data exported to file", undefined, 'default');
    };

    const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (!content) throw new Error("File is empty");
                let parsed: any;
                try { parsed = JSON.parse(content); } catch (jsonErr) { throw new Error("Invalid JSON format."); }

                if (!parsed || typeof parsed !== 'object') throw new Error("Invalid data structure.");
                if (!parsed.stats || !parsed.settings) throw new Error("Missing critical game data.");

                let payloadToDispatch: Partial<GameState> = {};
                if (parsed.quests && !Array.isArray(parsed.quests) && parsed.quests.active) {
                    payloadToDispatch = {
                        settings: parsed.settings,
                        stats: parsed.stats,
                        quests: Array.isArray(parsed.quests.active) ? parsed.quests.active : [],
                        archivedQuests: Array.isArray(parsed.quests.archived) ? parsed.quests.archived : [],
                        sideQuestTemplates: Array.isArray(parsed.quests.sideQuestTemplates) ? parsed.quests.sideQuestTemplates : [],
                        eventTemplates: Array.isArray(parsed.quests.eventTemplates) ? parsed.quests.eventTemplates : [],
                        activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : [],
                        availableSideQuests: parsed.availableSideQuests || [],
                        sideQuestsChosenCount: parsed.sideQuestsChosenCount || 0,
                        lastSideQuestGenDate: parsed.lastSideQuestGenDate || '',
                        hasOnboarded: true
                    };
                } else {
                    payloadToDispatch = { ...parsed, hasOnboarded: true };
                }

                if (window.confirm(`Successfully read data for "${parsed.stats.name}".\nLevel: ${parsed.stats.level}\nGold: ${parsed.stats.gold}\n\nOverwrite current progress?`)) {
                    dispatch({ type: 'IMPORT_DATA', payload: payloadToDispatch as GameState });
                    showToast("Save data imported successfully", undefined, 'default');
                }
            } catch (err: any) {
                console.error(err);
                alert(`Import Failed:\n${err.message}`);
            } finally { event.target.value = ''; }
        };
        reader.onerror = () => { alert("Error reading file."); event.target.value = ''; };
        reader.readAsText(file);
    };

    // --- Metrics Calculation ---
    const activeDaysCount = Object.keys(state.stats.history || {}).length;
    const avgXPPerDay = activeDaysCount > 0 ? Math.round((state.stats.lifetimeXP || 0) / activeDaysCount) : 0;

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24 animate-fade-in min-h-screen">
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-cinzel text-gray-200 mb-1 flex items-center gap-3">
                        <Settings size={32} className="text-gray-500" /> System
                    </h1>
                    <p className="text-gray-400 text-sm">Configure your experience and analyze your legacy.</p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-gray-900 p-1 rounded-lg flex w-full md:w-auto gap-1 border border-gray-800 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('STATS')}
                        className={`flex-1 md:flex-none flex justify-center items-center px-3 sm:px-6 py-2 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'STATS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('SETTINGS')}
                        className={`flex-1 md:flex-none flex justify-center items-center px-3 sm:px-6 py-2 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'SETTINGS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('MODIFIERS')}
                        className={`flex-1 md:flex-none flex justify-center items-center px-3 sm:px-6 py-2 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'MODIFIERS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Modifiers
                    </button>
                    <button
                        onClick={() => setActiveTab('DEBUG')}
                        className={`flex-1 md:flex-none flex justify-center items-center px-3 sm:px-6 py-2 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'DEBUG' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Debug
                    </button>
                </div>
            </header>

            {/* --- PANEL 1: STATS --- */}
            {activeTab === 'STATS' && (
                <div className="space-y-6 animate-fade-in">
                    <StatGraph history={state.stats.history || {}} />

                    {/* All-Time Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col gap-1 shadow-lg">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Trophy size={12} className="text-indigo-500" /> Lifetime Level
                            </div>
                            <div className="text-2xl font-cinzel text-white">{state.stats.level}</div>
                            <div className="text-xs text-indigo-400/70 truncate">{state.stats.titles[state.stats.titles.length - 1]}</div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col gap-1 shadow-lg">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Coins size={12} className="text-yellow-500" /> Lifetime Gold
                            </div>
                            <div className="text-2xl font-mono text-white">{(state.stats.lifetimeGold || 0).toLocaleString()}</div>
                            <div className="text-xs text-yellow-500/50">Total Earnings</div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col gap-1 shadow-lg">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Zap size={12} className="text-blue-500" /> Lifetime XP
                            </div>
                            <div className="text-2xl font-mono text-white">{(state.stats.lifetimeXP || 0).toLocaleString()}</div>
                            <div className="text-xs text-blue-500/50">~{avgXPPerDay}/day avg</div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col gap-1 shadow-lg">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-emerald-500" /> Quests Done
                            </div>
                            <div className="text-2xl font-mono text-white">{state.stats.totalQuestsCompleted || 0}</div>
                            <div className="text-xs text-emerald-500/50">Tasks Crushed</div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col gap-1 shadow-lg">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Flame size={12} className="text-orange-500" /> Current Streak
                            </div>
                            <div className="text-2xl font-mono text-white">{state.stats.globalStreak || 0}</div>
                            <div className="text-xs text-orange-500/50">Days Consistent</div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col gap-1 shadow-lg">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <History size={12} className="text-slate-400" /> Days Active
                            </div>
                            <div className="text-2xl font-mono text-white">{activeDaysCount}</div>
                            <div className="text-xs text-slate-500/50">Journey Length</div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PANEL 2: SETTINGS (Profile, Data, Danger) --- */}
            {activeTab === 'SETTINGS' && (
                <div className="space-y-6 animate-fade-in">
                    {/* 1. Identity & Time */}
                    <section className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
                        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-indigo-400" />
                                <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wider">Identity & Time</h3>
                            </div>
                            {!isEditingProfile ? (
                                <button onClick={() => setIsEditingProfile(true)} className="text-gray-500 hover:text-white transition">
                                    <Edit2 size={16} />
                                </button>
                            ) : (
                                <button onClick={saveProfile} className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 text-xs font-bold uppercase">
                                    <Save size={14} /> Save
                                </button>
                            )}
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Character Name</label>
                                    {isEditingProfile ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white focus:border-indigo-500"
                                        />
                                    ) : (
                                        <div className="text-lg font-cinzel text-white">{state.stats.name}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Wake Up Time</label>
                                    {isEditingProfile ? (
                                        <input
                                            type="time"
                                            value={editWakeTime === 'NA' ? '' : editWakeTime}
                                            onChange={(e) => setEditWakeTime(e.target.value)}
                                            className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white focus:border-indigo-500"
                                        />
                                    ) : (
                                        <div className="text-lg font-mono text-white">{state.stats.wakeUpTime === 'NA' ? 'Unset' : state.stats.wakeUpTime}</div>
                                    )}
                                </div>
                            </div>

                            {/* Ideal Days Config */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                    <Calendar size={12} /> Ideal Event Days
                                </label>
                                {isEditingProfile ? (
                                    <div className="flex gap-2">
                                        {WEEKDAYS.map((day, idx) => (
                                            <button
                                                key={day}
                                                onClick={() => toggleIdealDay(idx)}
                                                className={`w-10 h-10 rounded flex items-center justify-center text-xs font-bold transition border ${editIdealDays.includes(idx) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                            >
                                                {day[0]}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex gap-2 flex-wrap">
                                        {state.stats.idealDays && state.stats.idealDays.length > 0 ? (
                                            state.stats.idealDays.sort().map(d => (
                                                <span key={d} className="bg-gray-800 border border-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                                                    {WEEKDAYS[d]}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-600 text-sm italic">No days preferred.</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* 2. Data Management */}
                    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
                        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                            <Settings size={16} className="text-gray-400" />
                            <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wider">Save Data</h3>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                            <button
                                onClick={exportData}
                                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 text-xs py-3 rounded transition"
                            >
                                <Download size={14} /> Export JSON
                            </button>
                            <label className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 text-xs py-3 rounded transition cursor-pointer">
                                <Upload size={14} /> Import JSON
                                <input type="file" accept=".json" onChange={importData} className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* 3. Danger Zone */}
                    <div className="bg-red-950/10 border border-red-900/30 rounded-lg overflow-hidden shadow-lg">
                        <div className="bg-red-950/30 px-4 py-3 border-b border-red-900/30 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-400" />
                            <h3 className="font-bold text-red-400 text-sm uppercase tracking-wider">Danger Zone</h3>
                        </div>

                        <div className="p-6">
                            {!showResetConfirm ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-gray-200">Reset Progress</h4>
                                        <p className="text-xs text-gray-500 mt-1">Deletes all quests, resets level, gold, and XP to zero.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowResetConfirm(true)}
                                        className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 hover:border-red-800 text-sm font-bold py-2 px-4 rounded transition"
                                    >
                                        Reset
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-red-950/50 p-4 rounded border border-red-900/50 animate-fade-in text-center">
                                    <AlertTriangle size={32} className="text-red-500 mx-auto mb-2" />
                                    <h4 className="font-bold text-red-200 mb-1">Are you absolutely sure?</h4>
                                    <p className="text-xs text-red-300/70 mb-4">This action cannot be undone. You will lose everything.</p>

                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => setShowResetConfirm(false)}
                                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2 px-6 rounded transition border border-gray-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                dispatch({ type: 'FULL_RESET' });
                                                setShowResetConfirm(false);
                                                showToast("System Reset Complete", undefined, 'default');
                                            }}
                                            className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2 px-6 rounded transition shadow-lg shadow-red-900/20"
                                        >
                                            Confirm Reset
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- PANEL 3: MODIFIERS (Rules, Content Pools) --- */}
            {activeTab === 'MODIFIERS' && (
                <div className="space-y-8 animate-fade-in">

                    {/* 1. Game Rules */}
                    <section className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
                        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                            <Sliders size={16} className="text-emerald-400" />
                            <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wider">Game Rules</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                        <Flame size={12} className="text-red-400" /> Fail Penalty
                                    </label>
                                    <span className="text-red-400 font-mono">-{Math.round((1 - settings.dailyFailPenalty) * 100)}% Rewards</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="90"
                                    step="10"
                                    value={Math.round((1 - settings.dailyFailPenalty) * 100)}
                                    onChange={(e) => {
                                        const lossPercentage = Number(e.target.value);
                                        const multiplier = 1 - (lossPercentage / 100);
                                        handleSettingChange('dailyFailPenalty', Number(multiplier.toFixed(2)));
                                    }}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                            </div>
                            <div className="border-t border-gray-800 pt-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-emerald-500/80 uppercase flex items-center gap-1">
                                            <Sword size={12} /> Side Quest Risk Probability
                                        </label>
                                        <span className="text-emerald-400 font-mono">{Math.round(settings.sideQuestRiskChance * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={settings.sideQuestRiskChance}
                                        onChange={(e) => handleSettingChange('sideQuestRiskChance', Number(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Content Pools (Migrated from QuestLog) */}
                    <section className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
                        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sword size={16} className="text-emerald-400" />
                                <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wider">Side Quest Templates</h3>
                            </div>
                            <button
                                onClick={() => setIsAddingTemplate(true)}
                                className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/30 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition"
                            >
                                <Plus size={12} /> Add
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sideQuestTemplates.length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-600 text-xs italic">
                                    No templates defined. Notice board will be empty.
                                </div>
                            )}
                            {sideQuestTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    onClick={() => setEditingTemplate(template)}
                                    className="bg-gray-800 border border-gray-700 p-3 rounded hover:border-emerald-500 cursor-pointer group flex justify-between items-center"
                                >
                                    <div>
                                        <div className="font-mono text-sm text-gray-200 group-hover:text-emerald-100">{template.template}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            Range: {template.min}-{template.max} | XP: {template.unitXP}/unit
                                        </div>
                                    </div>
                                    <Edit2 size={12} className="text-gray-600 group-hover:text-emerald-400" />
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
                        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-400" />
                                <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wider">Event Templates</h3>
                            </div>
                            <button
                                onClick={() => setIsAddingEvent(true)}
                                className="flex items-center gap-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-600/30 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition"
                            >
                                <Plus size={12} /> Add
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(!eventTemplates || eventTemplates.length === 0) && (
                                <div className="col-span-full text-center py-8 text-gray-600 text-xs italic">
                                    No events configured.
                                </div>
                            )}
                            {eventTemplates?.map((template) => (
                                <div
                                    key={template.id}
                                    onClick={() => setEditingEvent(template)}
                                    className="bg-gray-800 border border-gray-700 p-3 rounded hover:border-purple-500 cursor-pointer group flex justify-between items-center"
                                >
                                    <div>
                                        <div className="font-bold text-sm text-gray-200 group-hover:text-purple-100">{template.title}</div>
                                        <div className="text-[10px] text-gray-500 mt-1 flex gap-2">
                                            <span>Chance: {Math.round(template.spawnChance * 100)}%</span>
                                            <span>Days: {template.allowedDays.length}</span>
                                        </div>
                                    </div>
                                    <Edit2 size={12} className="text-gray-600 group-hover:text-purple-400" />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* --- PANEL 4: DEBUG --- */}
            {activeTab === 'DEBUG' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
                        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                            <Terminal size={16} className="text-gray-400" />
                            <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wider">Debug Controls</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    dispatch({ type: 'REFRESH_NOTICE_BOARD' });
                                    showToast("Notice board rerolled", undefined, 'default');
                                }}
                                className="flex items-center justify-center gap-2 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-900/50 text-xs py-3 rounded transition"
                            >
                                <RotateCcw size={14} /> Refresh Notice Board
                            </button>
                            <button
                                onClick={() => {
                                    dispatch({ type: 'TEST_ADD_XP', payload: 50 });
                                    showToast("Added 50 XP", undefined, 'default');
                                }}
                                className="flex items-center justify-center gap-2 bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-900/50 text-xs py-3 rounded transition"
                            >
                                <Plus size={14} /> Add 50 XP
                            </button>
                            <button
                                onClick={() => {
                                    dispatch({ type: 'TEST_ADD_GOLD', payload: 100 });
                                    showToast("Added 100 Gold", undefined, 'default');
                                }}
                                className="flex items-center justify-center gap-2 bg-amber-900/20 hover:bg-amber-900/40 text-amber-300 border border-amber-900/50 text-xs py-3 rounded transition"
                            >
                                <Coins size={14} /> Add 100 Gold
                            </button>
                            <button
                                onClick={() => {
                                    dispatch({ type: 'TEST_ADD_STREAK' });
                                    showToast("Streak boosted (+3 days)", undefined, 'default');
                                }}
                                className="flex items-center justify-center gap-2 bg-orange-900/20 hover:bg-orange-900/40 text-orange-300 border border-orange-900/50 text-xs py-3 rounded transition"
                            >
                                <Flame size={14} /> Add 3 Streak
                            </button>
                            <button
                                onClick={() => {
                                    dispatch({ type: 'TEST_FAIL_ALL_QUESTS' });
                                    showToast("Day forced ended. Streak reset.", undefined, 'default');
                                }}
                                className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 text-xs py-3 rounded transition"
                            >
                                <RotateCcw size={14} /> Force Fail / Day End
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals for Modifiers Tab */}
            {(isAddingTemplate || editingTemplate) && (
                <TemplateModal
                    initialTemplate={editingTemplate || undefined}
                    onClose={() => {
                        setIsAddingTemplate(false);
                        setEditingTemplate(null);
                    }}
                    onSave={handleSaveTemplate}
                    onDelete={handleDeleteTemplate}
                />
            )}

            {(isAddingEvent || editingEvent) && (
                <EventTemplateModal
                    initialTemplate={editingEvent || undefined}
                    onClose={() => {
                        setIsAddingEvent(false);
                        setEditingEvent(null);
                    }}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                />
            )}
        </div>
    );
};

export default SettingsView;