
import React, { useState } from 'react';
import { useGame } from '../store';
import { useToast } from './ToastContext'; // Only kept for custom messages if needed, though mostly moved to event handler
import { QuestType, Quest } from '../types';
import QuestCard from './QuestCard';
import { QuestModal } from './QuestModal';
import { Plus, Clock, Flame, Coins, Zap, Sparkles, Star, RefreshCw, Trophy, CheckCircle2, Lock, Flag, Settings, Hourglass } from 'lucide-react';

interface DashboardProps {
    onDelete: (id: string) => void;
    onEdit: (quest: Quest) => void;
    onToggle: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onDelete, onEdit, onToggle }) => {
    const { state, dispatch } = useGame();
    const { showToast } = useToast();

    // Modal State
    const [isAdding, setIsAdding] = useState<QuestType | null>(null);
    
    // Animation State
    const [celebratingQuestId, setCelebratingQuestId] = useState<string | null>(null);
    const [completingStepId, setCompletingStepId] = useState<string | null>(null);
    const [acceptingQuestId, setAcceptingQuestId] = useState<string | null>(null);

    // UI Logic
    const activeSideQuestsCount = state.quests.filter(q => q.type === QuestType.SIDE && !q.completed).length;
    const isSideQuestActiveLimitReached = activeSideQuestsCount >= 5;
    const isDailyAcceptLimitReached = (state.stats.dailySideQuestsTaken || 0) >= 2;
    const canAcceptSideQuest = !isSideQuestActiveLimitReached && !isDailyAcceptLimitReached;

    const isQuestActive = (q: Quest) => {
        if (q.completed) return false;
        if (q.dueDate && new Date(q.dueDate) < new Date()) return false;
        return true;
    };

    const heroQuests = state.quests.filter(q => q.type === QuestType.GRANDMASTER && isQuestActive(q));
    const hasActiveHeroQuest = heroQuests.length > 0;

    const dailyQuests = state.quests.filter(q => q.type === QuestType.DAILY && isQuestActive(q));
    const sideQuests = state.quests.filter(q => q.type === QuestType.SIDE && isQuestActive(q));
    const eventQuests = state.quests.filter(q => q.type === QuestType.EVENT && isQuestActive(q));
    const focusQuests = state.quests.filter(q => q.type === QuestType.FOCUS && isQuestActive(q));

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

    const toggleStep = (questId: string, stepId: string) => {
        const q = state.quests.find(x => x.id === questId);
        const step = q?.steps?.find(s => s.id === stepId);
        if (!step) return;

        // Visual feedback immediate
        if (!step.completed) {
            setCompletingStepId(stepId);
            setTimeout(() => setCompletingStepId(null), 500); // Reset after animation
            // NOTE: Step completion doesn't trigger a main toast usually, just local feedback
            // or we could add it to event queue if we want robust undo for steps. 
            // For now, simple toast is fine for minor actions.
            showToast(`Milestone Reached: ${step.title}`, undefined, 'success');
        }

        dispatch({ type: 'TOGGLE_QUEST_STEP', payload: { questId, stepId } });
    };

    const handleHeroQuestToggle = (questId: string) => {
        // Trigger Grande Animation
        setCelebratingQuestId(questId);
        
        // Delay actual state change slightly to let animation play
        setTimeout(() => {
            onToggle(questId);
            setTimeout(() => setCelebratingQuestId(null), 1000); 
        }, 1200);
    };

    const handleAcceptSideQuest = (quest: Quest) => {
        if (acceptingQuestId) return; // Prevent multiple clicks
        setAcceptingQuestId(quest.id);
        
        // Wait for animation to finish before updating state
        setTimeout(() => {
            dispatch({ type: 'ACCEPT_SIDE_QUEST', payload: quest });
            setAcceptingQuestId(null);
        }, 400); // 400ms matches the CSS animation duration
    };

    const handleReroll = (e: React.MouseEvent, quest: Quest) => {
        e.stopPropagation();
        const rerollCost = (quest.isRisk || quest.hasPenalty) ? 30 : 15;

        if (state.stats.gold < rerollCost) {
            showToast(`Not enough gold! Need ${rerollCost}g.`, undefined, 'default');
            return;
        }

        dispatch({ type: 'REROLL_NOTICE_BOARD_SLOT', payload: quest.id });
        // Toast handled by event 'QUEST_REROLLED'
    };

    const rerollsLeft = 2 - (state.stats.dailyRerolls || 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-24 relative animate-fade-in">

            {/* Victory Animation Overlay */}
            {celebratingQuestId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-fade-in pointer-events-none">
                    <div className="relative flex flex-col items-center justify-center">
                        <div className="absolute w-[600px] h-[600px] bg-amber-500/20 animate-ping rounded-full" />
                        <div className="absolute w-96 h-96 bg-amber-400/30 rounded-full blur-3xl animate-pulse" />
                        <div className="relative z-10 animate-bounce">
                            <Star size={140} className="text-amber-100 drop-shadow-[0_0_50px_rgba(245,158,11,1)]" fill="currentColor" />
                        </div>
                        <div className="mt-12 text-center animate-fade-in-up">
                            <h1 className="text-5xl font-cinzel font-bold text-amber-100 tracking-[0.2em] drop-shadow-lg">VICTORY</h1>
                            <p className="text-amber-300/80 text-sm font-bold uppercase tracking-widest mt-2">Saga Completed</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Hero's Journey (Top Priority) */}
            <section className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/20 rounded-2xl p-5 shadow-2xl animate-fade-in relative min-h-[120px]">
                {/* Background decoration in container to prevent overflow clipping of tooltips */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                         <Star size={200} />
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <Star size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-xl font-cinzel text-amber-400 font-bold tracking-widest leading-none">Hero's Journey</h2>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Saga of your Legacy</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!hasActiveHeroQuest && (
                            <button
                                onClick={() => setIsAdding(QuestType.GRANDMASTER)}
                                className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-300 bg-amber-950/50 px-3 py-1.5 rounded border border-amber-900/50 transition-all hover:bg-amber-900/50"
                            >
                                <Plus size={14} /> Begin Saga
                            </button>
                        )}
                        {hasActiveHeroQuest && (
                            <button
                                onClick={() => onEdit(heroQuests[0])}
                                className="p-2 text-amber-500/50 hover:text-amber-400 hover:bg-amber-900/30 rounded transition-colors"
                                title="Modify Journey"
                            >
                                <Settings size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-8 relative z-10">
                    {heroQuests.length === 0 && (
                        <div className="text-center py-4 opacity-50">
                            <p className="text-sm text-amber-200/50 font-cinzel italic">No active saga.</p>
                        </div>
                    )}

                    {heroQuests.map(q => {
                        const isCelebrating = celebratingQuestId === q.id;
                        const steps = q.steps || [];
                        
                        const visualNodes = [
                            { id: 'start', type: 'START', title: 'Start', date: q.createdAt, completed: true, locked: false },
                            ...steps.map((s, i) => {
                                const prevStep = i > 0 ? steps[i-1] : null;
                                const locked = prevStep ? !prevStep.completed : false;
                                return {
                                    ...s,
                                    type: 'STEP',
                                    date: s.dueDate ? new Date(s.dueDate).getTime() : undefined,
                                    locked
                                };
                            }),
                            { 
                                id: 'end', 
                                type: 'END', 
                                title: 'Victory', 
                                date: q.dueDate ? new Date(q.dueDate).getTime() : undefined, 
                                completed: q.completed || isCelebrating,
                                locked: steps.some(s => !s.completed)
                            }
                        ];

                        return (
                            <div key={q.id} className="relative pb-6">
                                <div className="flex justify-between items-end mb-8 px-1">
                                    <div>
                                        <h3 className="text-white font-cinzel font-bold text-lg flex items-center gap-2">
                                            {q.title}
                                        </h3>
                                        {q.description && <p className="text-xs text-gray-400 mt-1 max-w-md">{q.description}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between w-full px-2">
                                    {visualNodes.map((node, idx) => {
                                        const isLastNode = idx === visualNodes.length - 1;
                                        const nextNode = visualNodes[idx + 1];
                                        const isNextCompleted = nextNode?.completed;
                                        const isCurrent = !node.completed && (idx === 0 || visualNodes[idx - 1].completed);
                                        const canInteract = !node.locked && (node.type === 'STEP' || node.type === 'END');
                                        const isJustCompleted = completingStepId === node.id;

                                        // Label Visibility Logic: Start, End, and Current only
                                        const showLabel = node.type === 'START' || node.type === 'END' || isCurrent;

                                        return (
                                            <React.Fragment key={node.id}>
                                                <div
                                                    className={`relative z-10 flex flex-col items-center group ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                                                    onClick={() => {
                                                        if (!canInteract) return;
                                                        if (node.type === 'STEP') toggleStep(q.id, node.id);
                                                        if (node.type === 'END') handleHeroQuestToggle(q.id);
                                                    }}
                                                >
                                                    {/* Tooltip on Hover */}
                                                    <div className="absolute bottom-full mb-3 bg-gray-950 border border-gray-700 px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 flex flex-col items-center">
                                                        <div className="font-bold text-amber-100 text-xs">{node.title}</div>
                                                        {node.date && (
                                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                                {node.type === 'START' ? 'Started: ' : 'Due: '} 
                                                                {new Date(node.date).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                        {/* Tooltip Arrow */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-700"></div>
                                                    </div>

                                                    {isJustCompleted && (
                                                         <div className="absolute inset-0 bg-amber-500/50 rounded-full animate-ping z-0" />
                                                    )}

                                                    <div
                                                        className={`
                                                transition-all duration-300 flex items-center justify-center rounded-full border-2 relative z-10
                                                ${node.type === 'START' ? 'w-3 h-3 bg-amber-900 border-amber-700' : ''}
                                                ${node.type === 'STEP' ? 'w-5 h-5' : ''}
                                                ${node.type === 'END' ? 'w-8 h-8' : ''}
                                                ${node.completed
                                                                ? 'bg-amber-500 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                                                : node.locked 
                                                                    ? 'bg-slate-900 border-slate-700'
                                                                    : isCurrent
                                                                        ? 'bg-slate-900 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse scale-110'
                                                                        : 'bg-slate-900 border-amber-800'
                                                            }
                                                ${isJustCompleted ? 'ring-4 ring-amber-500/50 scale-125 bg-amber-400 border-amber-400' : ''}
                                            `}
                                                    >
                                                        {node.locked && !node.completed && <Lock size={10} className="text-slate-600" />}
                                                        
                                                        {node.completed && node.type !== 'START' && <CheckCircle2 size={node.type === 'END' ? 16 : 12} className="text-black" strokeWidth={4} />}
                                                        
                                                        {!node.completed && !node.locked && node.type === 'END' && <Flag size={14} className={isCurrent ? "text-amber-400" : "text-gray-600"} fill="currentColor" />}
                                                    </div>

                                                    <div className={`
                                            absolute top-full mt-3 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap px-2 py-1 rounded transition-all pointer-events-none
                                            ${showLabel ? 'opacity-100' : 'opacity-0'}
                                            ${isCurrent ? 'text-amber-400 bg-amber-950/90 -translate-y-1 shadow-lg border border-amber-900/50' : node.completed ? 'text-gray-500' : 'text-gray-700'}
                                            ${node.type === 'END' ? 'text-amber-200' : ''}
                                        `}>
                                                        {node.title}
                                                    </div>
                                                </div>

                                                {!isLastNode && (
                                                    <div className="flex-1 h-0.5 mx-1 bg-slate-800 relative rounded-full overflow-hidden">
                                                        <div
                                                            className={`absolute inset-0 bg-amber-600 transition-transform duration-700 origin-left ${isNextCompleted ? 'scale-x-100' : 'scale-x-0'}`}
                                                        />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* 2. Daily Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                {/* Stats Stack */}
                <div className="flex flex-col gap-4 col-span-1">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Momentum</h3>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-950/30 rounded-lg text-orange-500 border border-orange-900/30">
                                    <Flame size={20} />
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-white leading-none">{state.stats.globalStreak} Days</div>
                                    <div className="text-[10px] text-orange-500/60 font-bold uppercase mt-1">Active Streak</div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-700/50">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Quests Done</span>
                            <span className="text-sm font-mono text-white">{state.stats.dailyQuestsCompleted}</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between group relative overflow-hidden shadow-lg">
                        <div className="absolute -bottom-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                            <Coins size={80} />
                        </div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Today's Loot</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-yellow-500 mb-1">
                                    <Coins size={14} /> <span className="text-xs font-bold">Gold</span>
                                </div>
                                <span className="text-lg font-mono text-white">+{state.stats.dailyGold}</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-indigo-400 mb-1">
                                    <Zap size={14} /> <span className="text-xs font-bold">XP</span>
                                </div>
                                <span className="text-lg font-mono text-white">+{state.stats.dailyXP}</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                                    <Trophy size={14} /> <span className="text-xs font-bold">QP</span>
                                </div>
                                <span className="text-lg font-mono text-white">+{state.stats.dailyQP}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notice Board */}
                <div className="col-span-1 lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col shadow-lg">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/50">
                        <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                            <span>Notice Board</span>
                            <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-700">
                                Re-rolls: {rerollsLeft}/2
                            </span>
                        </h2>

                        <div className="flex gap-4 text-[10px] uppercase font-bold text-slate-500">
                            <div className={`flex items-center gap-1 ${isDailyAcceptLimitReached ? 'text-red-400' : ''}`}>
                                Limit: {(state.stats.dailySideQuestsTaken || 0)}/2 Today
                            </div>
                            <div className={`flex items-center gap-1 ${isSideQuestActiveLimitReached ? 'text-red-400' : ''}`}>
                                Capacity: {activeSideQuestsCount}/5 Active
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                        {state.availableSideQuests.map(quest => {
                            const rerollCost = (quest.isRisk || quest.hasPenalty) ? 30 : 15;
                            const canReroll = rerollsLeft > 0 && state.stats.gold >= rerollCost;
                            const isDisabled = !canAcceptSideQuest;
                            const isAccepting = acceptingQuestId === quest.id;

                            return (
                                <div
                                    key={quest.id}
                                    className={`relative group/card h-full ${isDisabled ? 'opacity-60 grayscale-[0.8] select-none' : ''} ${isAccepting ? 'animate-accept-quest pointer-events-none' : ''}`}
                                >
                                    <QuestCard
                                        quest={quest}
                                        compact
                                        onSelect={isDisabled || isAccepting ? undefined : () => handleAcceptSideQuest(quest)}
                                    >
                                        {/* INJECTED REROLL BUTTON - Now moves with tilt */}
                                        {!isDisabled && !isAccepting && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <button
                                                    onClick={(e) => handleReroll(e, quest)}
                                                    disabled={!canReroll}
                                                    className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded shadow-lg border ${canReroll ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600' : 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'}`}
                                                    title={canReroll ? "Re-roll this offer" : "Not enough gold or rerolls"}
                                                >
                                                    <RefreshCw size={10} />
                                                    <span className={canReroll ? "text-yellow-400" : ""}>{rerollCost}g</span>
                                                </button>
                                            </div>
                                        )}
                                    </QuestCard>
                                </div>
                            )
                        })}

                        {state.availableSideQuests.length === 0 && (
                            <div className="col-span-full w-full bg-slate-900/50 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-center opacity-50 min-h-[120px]">
                                <Clock size={20} className="mb-2" />
                                <h3 className="text-xs font-bold text-slate-400">No active offers</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Global Event Section */}
            {eventQuests.length > 0 && (
                <section className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={20} className="text-purple-400" />
                        <h2 className="text-xl font-cinzel text-purple-400 font-bold tracking-wide">Current Event</h2>
                    </div>
                    <div className="space-y-3">
                        {eventQuests.map(q => <QuestCard key={q.id} quest={q} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} />)}
                    </div>
                </section>
            )}

            {/* 4. Time Chamber Section */}
            <section className="animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                    <h2 className="text-xl font-bold text-cyan-400 font-cinzel tracking-wide flex items-center gap-2">
                        <Hourglass size={20} /> Time Chamber
                    </h2>
                    <button onClick={() => setIsAdding(QuestType.FOCUS)} className="text-slate-500 hover:text-cyan-400 transition">
                        <Plus size={20} />
                    </button>
                </div>
                <div className="space-y-3">
                    {focusQuests.length === 0 && <p className="text-slate-600 text-sm italic py-4">No active focus sessions.</p>}
                    {focusQuests.map(q => <QuestCard key={q.id} quest={q} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} />)}
                </div>
            </section>

            {/* 5. Grid for Daily & Side Quests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                        <h2 className="text-xl font-bold text-indigo-400 font-cinzel tracking-wide">Daily Quests</h2>
                        <button onClick={() => setIsAdding(QuestType.DAILY)} className="text-slate-500 hover:text-indigo-400 transition">
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {dailyQuests.length === 0 && <p className="text-slate-600 text-sm italic py-4">Your schedule is clear.</p>}
                        {dailyQuests.map(q => <QuestCard key={q.id} quest={q} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} />)}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                        <h2 className="text-xl font-bold text-emerald-400 font-cinzel tracking-wide">Side Quests</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-bold">{activeSideQuestsCount}/5</span>
                            <button onClick={() => setIsAdding(QuestType.SIDE)} className="text-slate-500 hover:text-emerald-400 transition">
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {sideQuests.length === 0 && <p className="text-slate-600 text-sm italic py-4">No active side adventures.</p>}
                        {sideQuests.map(q => <QuestCard key={q.id} quest={q} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} />)}
                    </div>
                </section>
            </div>

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

export default Dashboard;
