

import React, { useState, useMemo } from 'react';
import { useGame } from '../store';
import { useToast } from './ToastContext';
import { Quest, QuestType, QuestDifficulty } from '../types';
import QuestCard from './QuestCard';
import CalendarView from './CalendarView';
import { QuestModal } from './QuestModal';
import { MAX_SIDE_QUESTS_ACTIVE } from '../gameMechanics';
import { BookOpen, Archive, Filter, CheckCircle2, XCircle, ChevronDown, ChevronUp, Trash2, RotateCcw, Star, Repeat, Sword, Sparkles, Calendar as CalendarIcon, Plus } from 'lucide-react';

interface QuestLogProps {
    onEdit: (quest: Quest) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string) => void;
}

type MainTab = 'CHRONICLE' | 'GRAVEYARD';
type ChronicleTab = 'ACTIVE' | 'CALENDAR' | 'HISTORY';
type SortOption = 'NEWEST' | 'A_Z' | 'DUE_SOON';

const QuestLog: React.FC<QuestLogProps> = ({ onEdit, onDelete, onToggle }) => {
    const { state, dispatch } = useGame();
    const { showToast } = useToast();

    // Navigation State
    const [mainTab, setMainTab] = useState<MainTab>('CHRONICLE');
    const [chronicleTab, setChronicleTab] = useState<ChronicleTab>('ACTIVE');

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
    const [filterTypes, setFilterTypes] = useState<QuestType[]>([]);
    const [filterDifficulty, setFilterDifficulty] = useState<QuestDifficulty[]>([]);
    const [filterStatus, setFilterStatus] = useState<('COMPLETED' | 'FAILED')[]>([]); // For History tab

    const { archivedQuests } = state;

    // Active Quest Management (Copied/Adapted from Dashboard for Top View)
    const [isAdding, setIsAdding] = useState<QuestType | null>(null);

    const isQuestActive = (q: Quest) => {
        if (q.completed) return false;
        if (q.dueDate && new Date(q.dueDate) < new Date()) return false;
        return true;
    };

    const activeDailyQuests = state.quests.filter(q => q.type === QuestType.DAILY && isQuestActive(q));
    const activeSideQuests = state.quests.filter(q => q.type === QuestType.SIDE && isQuestActive(q));
    const activeSideQuestsCount = activeSideQuests.length;

    const handleCreateQuest = (questData: Partial<Quest>) => {
        dispatch({
            type: 'ADD_QUEST',
            payload: {
                id: `q-${Date.now()}`,
                title: questData.title!,
                description: questData.description,
                type: questData.type!,
                completed: false,
                xpReward: questData.xpReward || 50,
                goldReward: questData.goldReward || 10,
                qpReward: questData.qpReward || 5,
                createdAt: Date.now(),
                streak: questData.type === QuestType.DAILY ? 0 : undefined,
                dueDate: questData.dueDate,
                difficulty: questData.difficulty,
                hasPenalty: questData.hasPenalty,
                progress: questData.progress,
                steps: questData.steps,
                focusDurationMinutes: questData.focusDurationMinutes,
                focusSecondsRemaining: questData.focusSecondsRemaining
            }
        });
    };

    // --- Filtering Logic ---

    const toggleFilterType = (type: QuestType) => {
        setFilterTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const toggleFilterDifficulty = (diff: QuestDifficulty) => {
        setFilterDifficulty(prev => prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]);
    };

    const toggleFilterStatus = (status: 'COMPLETED' | 'FAILED') => {
        setFilterStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    const processedQuests = useMemo(() => {
        let filtered = state.quests.filter(q => {
            // 1. Tab Logic
            const isFailed = !q.completed && q.dueDate && new Date(q.dueDate) < new Date();
            const isActive = !q.completed && (!q.dueDate || new Date(q.dueDate) >= new Date());

            if (chronicleTab === 'ACTIVE') return isActive;
            if (chronicleTab === 'HISTORY') return q.completed || isFailed;
            // Calendar handles its own data fetching
            return true;
        });

        // 2. Type Filter
        if (filterTypes.length > 0) {
            filtered = filtered.filter(q => filterTypes.includes(q.type));
        }

        // 3. Difficulty Filter
        if (filterDifficulty.length > 0) {
            filtered = filtered.filter(q => q.difficulty && filterDifficulty.includes(q.difficulty));
        }

        // 4. Status Filter (History Tab Only)
        if (chronicleTab === 'HISTORY' && filterStatus.length > 0) {
            filtered = filtered.filter(q => {
                const isFailed = !q.completed && q.dueDate && new Date(q.dueDate) < new Date();
                if (filterStatus.includes('COMPLETED') && q.completed) return true;
                if (filterStatus.includes('FAILED') && isFailed) return true;
                return false;
            });
        }

        // 5. Sorting
        return filtered.sort((a, b) => {
            if (sortBy === 'A_Z') return a.title.localeCompare(b.title);
            if (sortBy === 'DUE_SOON') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            // Default: Newest Created
            return b.createdAt - a.createdAt;
        });

    }, [state.quests, chronicleTab, filterTypes, filterDifficulty, filterStatus, sortBy]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24 animate-fade-in relative min-h-screen">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-cinzel text-indigo-400 mb-1">Quest Log</h1>
                <p className="text-gray-400 text-sm">Track your active tasks and review your history.</p>
            </div>

            {/* Top Section: Active Daily & Side Quests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-fade-in">
                <section>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                        <h2 className="text-xl font-bold text-indigo-400 font-cinzel tracking-wide flex items-center gap-2">
                            <Repeat size={20} /> Daily Quests
                        </h2>
                        <button onClick={() => setIsAdding(QuestType.DAILY)} className="text-slate-500 hover:text-indigo-400 transition">
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {activeDailyQuests.length === 0 && <p className="text-slate-600 text-sm italic py-4">Your schedule is clear.</p>}
                        {activeDailyQuests.map(q => <QuestCard key={q.id} quest={q} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} />)}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                        <h2 className="text-xl font-bold text-emerald-400 font-cinzel tracking-wide flex items-center gap-2">
                            <Sword size={20} /> Side Quests
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-bold">{activeSideQuestsCount}/{MAX_SIDE_QUESTS_ACTIVE}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {activeSideQuests.length === 0 && <p className="text-slate-600 text-sm italic py-4">No active side adventures.</p>}
                        {activeSideQuests.map(q => <QuestCard key={q.id} quest={q} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} />)}
                    </div>
                </section>
            </div>

            {/* Main Navigation Tabs */}
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="bg-gray-900 p-1 rounded-lg flex w-full md:w-auto gap-1 border border-gray-800 overflow-x-auto">
                    <button
                        onClick={() => setMainTab('CHRONICLE')}
                        className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${mainTab === 'CHRONICLE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <BookOpen size={14} /> Chronicle
                    </button>
                    <button
                        onClick={() => setMainTab('GRAVEYARD')}
                        className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${mainTab === 'GRAVEYARD' ? 'bg-red-900/50 text-red-200 border border-red-900/50 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Archive size={14} /> Archive
                    </button>
                </div>
            </header>

            {/* --- VIEW: CHRONICLE (Logs & Calendar) --- */}
            {mainTab === 'CHRONICLE' && (
                <div className="animate-fade-in">

                    {/* Tabs & Filter Bar */}
                    <div className="flex flex-row justify-between items-end border-b border-gray-800 mb-6 gap-4">
                        <div className="flex gap-4 overflow-x-auto">
                            <button
                                onClick={() => setChronicleTab('ACTIVE')}
                                className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${chronicleTab === 'ACTIVE' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                                <BookOpen size={16} /> <span className="hidden sm:inline">Active</span>
                            </button>
                            <button
                                onClick={() => setChronicleTab('CALENDAR')}
                                className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${chronicleTab === 'CALENDAR' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                                <CalendarIcon size={16} /> <span className="hidden sm:inline">Calendar</span>
                            </button>
                            <button
                                onClick={() => setChronicleTab('HISTORY')}
                                className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${chronicleTab === 'HISTORY' ? 'border-gray-400 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                                <Archive size={16} /> <span className="hidden sm:inline">History</span>
                            </button>
                        </div>

                        {chronicleTab !== 'CALENDAR' && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase px-3 py-1.5 rounded transition-all ${showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                            >
                                <Filter size={14} /> <span className="hidden sm:inline">Filters</span>
                                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {(filterTypes.length > 0 || filterDifficulty.length > 0 || filterStatus.length > 0) && (
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Filter Panel (Only for Lists) */}
                    {showFilters && chronicleTab !== 'CALENDAR' && (
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg mb-6 animate-fade-in space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                                {/* Sorting */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase">Sort By</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(['NEWEST', 'A_Z', 'DUE_SOON'] as SortOption[]).map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setSortBy(opt)}
                                                className={`px-2 py-1 rounded text-xs font-bold border transition ${sortBy === opt ? 'bg-indigo-900/50 border-indigo-500 text-indigo-200' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                            >
                                                {opt === 'A_Z' ? 'A-Z' : opt.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Type Toggle */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase">Quest Type</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {[QuestType.DAILY, QuestType.SIDE, QuestType.GRANDMASTER, QuestType.EVENT].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => toggleFilterType(t)}
                                                className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1 transition ${filterTypes.includes(t) ? 'bg-indigo-900/50 border-indigo-500 text-indigo-200' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                            >
                                                {t === QuestType.GRANDMASTER && <Star size={10} />}
                                                {t === QuestType.DAILY && <Repeat size={10} />}
                                                {t === QuestType.SIDE && <Sword size={10} />}
                                                {t === QuestType.EVENT && <Sparkles size={10} />}
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Difficulty Toggle */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase">Difficulty</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(['EASY', 'MEDIUM', 'HARD'] as QuestDifficulty[]).map(d => (
                                            <button
                                                key={d}
                                                onClick={() => toggleFilterDifficulty(d)}
                                                className={`px-2 py-1 rounded text-xs font-bold border transition ${filterDifficulty.includes(d) ? 'bg-indigo-900/50 border-indigo-500 text-indigo-200' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Toggle (History Only) */}
                                {chronicleTab === 'HISTORY' && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase">Outcome</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => toggleFilterStatus('COMPLETED')}
                                                className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1 transition ${filterStatus.includes('COMPLETED') ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                            >
                                                <CheckCircle2 size={10} /> Completed
                                            </button>
                                            <button
                                                onClick={() => toggleFilterStatus('FAILED')}
                                                className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1 transition ${filterStatus.includes('FAILED') ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                            >
                                                <XCircle size={10} /> Failed
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}

                    {/* Quest List or Calendar */}
                    <div className="min-h-[400px]">
                        {chronicleTab === 'CALENDAR' ? (
                            <CalendarView onEdit={onEdit} onToggle={onToggle} />
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                {processedQuests.length === 0 && (
                                    <div className="text-gray-600 text-center py-10 border border-dashed border-gray-800 rounded-lg">
                                        <p className="italic">No quests match your criteria.</p>
                                        <p className="text-xs mt-1">Try adjusting the filters or tab.</p>
                                    </div>
                                )}
                                {processedQuests.map(q => <QuestCard key={q.id} quest={q} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} />)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- VIEW: GRAVEYARD (Now ARCHIVE) --- */}
            {mainTab === 'GRAVEYARD' && (
                <div className="animate-fade-in space-y-4">
                    <div className="bg-red-950/10 border border-red-900/20 p-4 rounded-lg mb-6">
                        <h3 className="text-red-400 font-cinzel font-bold flex items-center gap-2 mb-1">
                            <Trash2 size={16} /> The Void
                        </h3>
                        <p className="text-xs text-red-300/60">
                            Historical record of old tasks (failed or completed) archived at the start of each month.
                        </p>
                    </div>

                    {(!archivedQuests || archivedQuests.length === 0) && (
                        <div className="text-center py-20 text-gray-600 flex flex-col items-center border border-dashed border-gray-800 rounded-lg">
                            <Trash2 size={48} className="mb-4 opacity-20" />
                            <p>The archives are empty.</p>
                        </div>
                    )}

                    {archivedQuests?.map((quest) => {
                        const isFailed = !quest.completed && quest.dueDate && new Date(quest.dueDate) < new Date();
                        return (
                            <div key={quest.id} className={`border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group transition shadow-sm ${isFailed ? 'bg-red-900/10 border-red-900/30' : 'bg-gray-800 border-gray-700'}`}>
                                <div className="overflow-hidden w-full sm:flex-1 sm:min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] bg-gray-900 px-2 py-0.5 rounded text-gray-500 uppercase tracking-wider">{quest.type}</span>
                                        {isFailed ? (
                                            <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase"><XCircle size={10} /> Failed</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase"><CheckCircle2 size={10} /> Completed</span>
                                        )}
                                    </div>
                                    <h4 className={`font-semibold truncate ${isFailed ? 'text-red-200' : 'text-gray-300'}`}>{quest.title}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">{new Date(quest.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                                    <button
                                        onClick={() => dispatch({ type: 'RESTORE_QUEST', payload: quest.id })}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-900/30 hover:bg-indigo-900/50 rounded text-indigo-300 hover:text-indigo-200 transition text-sm font-medium border border-indigo-900/50"
                                    >
                                        <RotateCcw size={14} /> Restore
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Permanently delete this quest? This cannot be undone.")) {
                                                dispatch({ type: 'PERMANENT_DELETE_QUEST', payload: quest.id });
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 rounded text-red-300 hover:text-red-200 transition text-sm font-medium border border-red-900/50"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            
            {isAdding && (
                <QuestModal
                    type={isAdding}
                    onClose={() => setIsAdding(null)}
                    onSave={handleCreateQuest}
                />
            )}
        </div>
    );
};

export default QuestLog;