import React, { useState, useEffect } from 'react';
import { Quest, QuestType, QuestDifficulty, QuestStep, REWARD_MULTIPLIERS } from '../types';
import { X, Clock, AlertTriangle, Trash2, ChevronDown, ChevronUp, Star, Sword, Repeat, Trophy, Coins, Zap, Sparkles, Map, Plus, GripVertical, Settings, Lock, BrainCircuit, Flag, ArrowDown } from 'lucide-react';

interface QuestModalProps {
    type: QuestType;
    initialQuest?: Quest;
    onClose: () => void;
    onSave: (questData: Partial<Quest>) => void;
    onDelete?: (id: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ type, initialQuest, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState(initialQuest?.title || '');
    const [description, setDescription] = useState(initialQuest?.description || '');
    const [dueDate, setDueDate] = useState(initialQuest?.dueDate || '');
    const [hasPenalty, setHasPenalty] = useState(initialQuest?.hasPenalty || initialQuest?.isRisk || false);
    const [difficulty, setDifficulty] = useState<QuestDifficulty>(initialQuest?.difficulty || 'MEDIUM');

    // Focus Quest State
    const [focusDuration, setFocusDuration] = useState(initialQuest?.focusDurationMinutes || 30);

    // Default isJourney to true if it is a GRANDMASTER quest, even if fresh
    const [isJourney, setIsJourney] = useState(type === QuestType.GRANDMASTER || initialQuest?.progress !== undefined || initialQuest?.steps !== undefined);

    // Steps management
    const [steps, setSteps] = useState<QuestStep[]>(initialQuest?.steps || []);
    const [showValidation, setShowValidation] = useState(false);

    const [isEditExpanded, setIsEditExpanded] = useState(type !== QuestType.GRANDMASTER && !initialQuest);

    // --- Reward Calculation Logic ---

    // Standard Baselines for new quests
    const getBaseByType = (t: QuestType) => {
        if (t === QuestType.GRANDMASTER) return 500;
        if (t === QuestType.SIDE) return 15;
        if (t === QuestType.EVENT) return 75;
        if (t === QuestType.FOCUS) return 30; // Base focus value
        return 50; // Daily
    };

    // Derive Base Values for this session
    const getInitialBaseValues = () => {
        if (initialQuest) {
            const d = initialQuest.difficulty || 'MEDIUM';
            const mult = REWARD_MULTIPLIERS[d];
            const safeMult = mult || 1; // Safety check

            let xpBase = initialQuest.xpReward / safeMult;
            let goldBase = initialQuest.goldReward / safeMult;
            let qpBase = initialQuest.qpReward / safeMult;

            if (initialQuest.type === QuestType.SIDE && (initialQuest.hasPenalty || initialQuest.isRisk)) {
                goldBase = Math.max(0, goldBase - 6);
            }

            return {
                xp: xpBase,
                gold: goldBase,
                qp: qpBase
            };
        }

        const standard = getBaseByType(type);

        // Auto-scale Focus rewards by duration if it's new
        if (type === QuestType.FOCUS) {
            // Rule: 1 minute = 2 XP, 0.2 Gold approx
            return {
                xp: focusDuration * 2,
                gold: focusDuration * 0.2,
                qp: Math.ceil(focusDuration / 15)
            };
        }

        return {
            xp: standard,
            gold: standard / 5,
            qp: standard / 10
        };
    };

    const [baseValues] = useState(getInitialBaseValues());

    // Current calculated rewards based on difficulty multiplier
    const currentMult = REWARD_MULTIPLIERS[difficulty];

    // Check if Side Quest Risk Bonus applies
    const isSideQuestRisk = type === QuestType.SIDE && hasPenalty;

    // Special Calc for Focus
    const calculatedXP = type === QuestType.FOCUS
        ? Math.floor((focusDuration * 2) * currentMult)
        : Math.floor(baseValues.xp * currentMult);

    const baseGoldWithBonus = baseValues.gold + (isSideQuestRisk ? 6 : 0);
    const calculatedGold = type === QuestType.FOCUS
        ? Math.floor((focusDuration * 0.2) * currentMult)
        : Math.floor(baseGoldWithBonus * currentMult);

    const calculatedQP = type === QuestType.FOCUS
        ? Math.ceil((focusDuration / 15) * currentMult)
        : Math.ceil(baseValues.qp * currentMult);

    // Reward State
    const [rewardXP, setRewardXP] = useState<number>(initialQuest?.xpReward ?? calculatedXP);
    const [rewardGold, setRewardGold] = useState<number>(initialQuest?.goldReward ?? calculatedGold);
    const [rewardQP, setRewardQP] = useState<number>(initialQuest?.qpReward ?? calculatedQP);

    // Customization Tracking
    const [isRewardsExpanded, setIsRewardsExpanded] = useState(false);
    const [hasCustomizedRewards, setHasCustomizedRewards] = useState(false);

    // Enforce Rules Logic (Fail Risk)
    const isPenaltyLocked = type === QuestType.DAILY || difficulty === 'HARD';

    useEffect(() => {
        if (isPenaltyLocked) {
            setHasPenalty(true);
        }
    }, [type, difficulty, isPenaltyLocked]);

    // Auto-recalculate rewards if difficulty/risk changes AND user hasn't manually customized in this session
    useEffect(() => {
        if (!hasCustomizedRewards) {
            setRewardXP(calculatedXP);
            setRewardGold(calculatedGold);
            setRewardQP(calculatedQP);
        }
    }, [difficulty, hasPenalty, hasCustomizedRewards, calculatedXP, calculatedGold, calculatedQP, focusDuration]);

    const cycleDifficulty = () => {
        setDifficulty(prev => {
            if (prev === 'EASY') return 'MEDIUM';
            if (prev === 'MEDIUM') return 'HARD';
            return 'EASY';
        });
    };

    const addStep = () => {
        if (steps.length >= 7) return;
        setSteps([...steps, { id: `step-${Date.now()}`, title: '', completed: false }]);
    };

    const updateStep = (id: string, updates: Partial<QuestStep>) => {
        setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    const handleSave = () => {
        if (!title.trim()) return;

        // Filter out empty steps
        const filteredSteps = steps.filter(s => s.title.trim() !== '');

        // For GRANDMASTER quests, REQUIRE at least 1 step
        if (type === QuestType.GRANDMASTER && filteredSteps.length === 0) {
            setShowValidation(true);
            return;
        }

        const shouldSaveAsJourney = isJourney || type === QuestType.GRANDMASTER;

        const currentProgress = filteredSteps.length > 0
            ? Math.floor((filteredSteps.filter(s => s.completed).length / filteredSteps.length) * 100)
            : (shouldSaveAsJourney ? (initialQuest?.progress ?? 0) : undefined);

        onSave({
            title,
            description,
            type,
            xpReward: rewardXP,
            goldReward: rewardGold,
            qpReward: rewardQP,
            dueDate: dueDate || undefined,
            difficulty,
            hasPenalty,
            isRisk: hasPenalty,
            progress: shouldSaveAsJourney ? currentProgress : undefined,
            steps: shouldSaveAsJourney ? filteredSteps : undefined,
            focusDurationMinutes: type === QuestType.FOCUS ? focusDuration : undefined,
            focusSecondsRemaining: type === QuestType.FOCUS ? (initialQuest?.focusSecondsRemaining ?? (focusDuration * 60)) : undefined
        });
        onClose();
    };

    const handleDelete = () => {
        if (initialQuest && onDelete) {
            onDelete(initialQuest.id);
            onClose();
        }
    };

    const getTypeIcon = () => {
        switch (type) {
            case QuestType.GRANDMASTER: return <Star className="text-amber-400" size={16} />;
            case QuestType.DAILY: return <Repeat className="text-indigo-400" size={16} />;
            case QuestType.SIDE: return <Sword className="text-emerald-400" size={16} />;
            case QuestType.EVENT: return <Sparkles className="text-purple-400" size={16} />;
            case QuestType.FOCUS: return <BrainCircuit className="text-cyan-400" size={16} />;
            default: return null;
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case QuestType.GRANDMASTER: return 'Hero Quest';
            case QuestType.DAILY: return 'Daily Quest';
            case QuestType.SIDE: return 'Side Quest';
            case QuestType.EVENT: return 'World Event';
            case QuestType.FOCUS: return 'Mind Sanctum';
            default: return 'Quest';
        }
    };

    // --- Hero Quest Layout (Timeline Style) ---
    if (type === QuestType.GRANDMASTER) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
                <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
                    <div className="flex justify-between items-center p-4 bg-gray-900/50 border-b border-gray-800">
                        <div className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-wider">
                            <Star size={16} fill="currentColor" />
                            <span>Create Saga</span>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1 p-6 bg-gradient-to-b from-gray-900 to-gray-950">
                        <div className="space-y-6">
                            
                            {/* Intro */}
                            <div className="text-center space-y-2">
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">The Path to Greatness</h3>
                                <p className="text-gray-500 text-xs italic">Define the steps that lead to your ultimate victory.</p>
                            </div>

                            {/* Timeline Steps */}
                            <div className="relative pl-4 border-l-2 border-gray-800 space-y-6">
                                
                                {/* 1. The Steps */}
                                {steps.map((step, idx) => (
                                    <div key={step.id} className="relative group animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-gray-800 border-2 border-gray-600 group-hover:border-indigo-500 transition-colors" />
                                        
                                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 group-hover:bg-gray-800 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Milestone {idx + 1}</span>
                                                <button onClick={() => removeStep(step.id)} className="text-gray-600 hover:text-red-400"><X size={12} /></button>
                                            </div>
                                            <input
                                                type="text"
                                                value={step.title}
                                                onChange={(e) => updateStep(step.id, { title: e.target.value })}
                                                placeholder={`Step ${idx + 1} Objective...`}
                                                className="w-full bg-transparent border-none p-0 text-sm text-white placeholder-gray-600 focus:ring-0 mb-2 font-medium"
                                                autoFocus={idx === steps.length - 1}
                                            />
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-gray-500" />
                                                <input
                                                    type="date"
                                                    value={step.dueDate?.split('T')[0] || ''}
                                                    onChange={(e) => updateStep(step.id, { dueDate: e.target.value })}
                                                    className="bg-gray-900/50 border border-gray-700 rounded px-2 py-0.5 text-[10px] text-gray-400"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="absolute left-4 -bottom-4 flex justify-center w-full">
                                            <ArrowDown size={12} className="text-gray-800" />
                                        </div>
                                    </div>
                                ))}

                                {/* Add Step Button */}
                                {steps.length < 7 && (
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-2 w-3 h-3 rounded-full bg-gray-800 border-2 border-gray-700" />
                                        <button 
                                            onClick={addStep}
                                            className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 text-xs font-bold uppercase hover:border-gray-500 hover:text-gray-300 transition flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Add Milestone
                                        </button>
                                        {showValidation && steps.length === 0 && (
                                            <p className="text-red-400 text-[10px] mt-1 text-center font-bold">At least one milestone is required.</p>
                                        )}
                                    </div>
                                )}

                                {/* 2. The Final Step (Title & Date) */}
                                <div className="relative pt-4">
                                    <div className="absolute -left-[25px] top-8 w-5 h-5 rounded-full bg-amber-900 border-2 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)] z-10 flex items-center justify-center">
                                        <Flag size={10} className="text-amber-400" fill="currentColor" />
                                    </div>

                                    <div className="bg-gradient-to-r from-amber-950/40 to-gray-900 border border-amber-500/30 rounded-lg p-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Trophy size={60} />
                                        </div>
                                        
                                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            Final Objective
                                        </h4>

                                        <div className="space-y-4 relative z-10">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="Name of your Saga (e.g. Run a Marathon)"
                                                    className="w-full bg-gray-900/80 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-amber-500 transition font-cinzel text-lg font-bold placeholder-gray-600"
                                                />
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Victory Deadline</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={dueDate}
                                                        onChange={(e) => setDueDate(e.target.value)}
                                                        className="w-full bg-gray-900/80 border border-gray-700 rounded p-2 text-white text-xs"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                     <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Difficulty</label>
                                                    <div className="flex bg-gray-900/80 rounded p-1 border border-gray-700">
                                                        {(['EASY', 'MEDIUM', 'HARD'] as QuestDifficulty[]).map(d => (
                                                            <button
                                                                key={d}
                                                                onClick={() => setDifficulty(d)}
                                                                className={`flex-1 py-1 text-[10px] font-bold rounded ${difficulty === d ? 'bg-amber-600 text-white' : 'text-gray-500'}`}
                                                            >
                                                                {d[0]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                         <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold shadow-lg shadow-amber-900/20 transition-all text-sm flex items-center gap-2">
                            <Sword size={16} /> Begin Saga
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Default Layout (Non-Hero Quests) ---
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                <div className="flex justify-between items-center p-4 shrink-0 bg-gray-900/50 border-b border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        {getTypeIcon()}
                        <span>{getTypeLabel()}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
                </div>

                <div className="overflow-y-auto custom-scrollbar">
                    <div className="p-6 text-center space-y-4 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
                        <div>
                            <h2 className="text-xl md:text-2xl font-cinzel font-bold text-white leading-tight mb-2">
                                {title || <span className="text-gray-600 italic">Untitled Quest</span>}
                            </h2>
                            {description ? (
                                <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
                            ) : (
                                <p className="text-xs text-gray-600 italic">No description provided.</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                            <button
                                onClick={cycleDifficulty}
                                className="bg-gray-800 border border-gray-700 p-2 rounded flex flex-col items-center hover:border-indigo-500 transition-colors group"
                            >
                                <span className="text-[10px] text-gray-500 uppercase font-bold group-hover:text-indigo-400">Difficulty</span>
                                <span className={`text-sm font-bold ${difficulty === 'HARD' ? 'text-red-400' : difficulty === 'EASY' ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {difficulty === 'MEDIUM' ? 'NORMAL' : difficulty}
                                </span>
                            </button>

                            {/* Toggle Button for Fail Risk */}
                            <button
                                disabled={isPenaltyLocked}
                                onClick={() => !isPenaltyLocked && setHasPenalty(!hasPenalty)}
                                className={`bg-gray-800 border border-gray-700 p-2 rounded flex flex-col items-center transition-colors group ${!isPenaltyLocked ? 'hover:border-red-500/50 cursor-pointer' : 'opacity-80 cursor-not-allowed'}`}
                                title={isPenaltyLocked ? "Required for this quest type/difficulty" : "Toggle Fail Risk"}
                            >
                                <span className="text-[10px] text-gray-500 uppercase font-bold group-hover:text-red-400 flex items-center gap-1">
                                    Fail Risk {isPenaltyLocked && <Lock size={8} />}
                                </span>
                                {hasPenalty ? (
                                    <span className="text-sm font-bold text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> Active</span>
                                ) : (
                                    <span className="text-sm font-bold text-gray-500">None</span>
                                )}
                            </button>
                        </div>

                        {type === QuestType.FOCUS && (
                            <div className="bg-cyan-900/20 border border-cyan-800/50 p-3 rounded-lg max-w-xs mx-auto">
                                <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-2">Duration</label>
                                <div className="flex items-center justify-center gap-2">
                                    <input
                                        type="range"
                                        min="5"
                                        max="120"
                                        step="5"
                                        value={focusDuration}
                                        onChange={(e) => setFocusDuration(Number(e.target.value))}
                                        className="w-full accent-cyan-400 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-white font-mono font-bold w-12 text-right">{focusDuration}m</span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-6 py-2 bg-gray-900/30 rounded-lg border border-gray-800/50">
                            <div className="flex items-center gap-1.5">
                                <Zap size={16} className="text-indigo-400" />
                                <span className="font-bold text-indigo-100">{rewardXP}</span>
                            </div>
                            <div className="flex items-center gap-1.5 relative group/gold">
                                <Coins size={16} className="text-yellow-500" />
                                <span className="font-bold text-yellow-100">{rewardGold}</span>
                                {isSideQuestRisk && (
                                    <span className="absolute -top-3 -right-6 text-[9px] bg-yellow-500/20 text-yellow-300 px-1 rounded border border-yellow-500/30 animate-pulse">
                                        +6g
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Trophy size={16} className="text-blue-400" />
                                <span className="font-bold text-blue-100">{rewardQP}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800">
                        <button
                            onClick={() => setIsEditExpanded(!isEditExpanded)}
                            className="w-full flex items-center justify-between p-4 text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                            <span className="flex items-center gap-2"><Settings size={14} /> Config</span>
                            {isEditExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isEditExpanded && (
                            <div className="p-6 space-y-6 bg-gray-900 animate-fade-in border-t border-gray-800">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="The Grand Objective"
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-indigo-500 transition"
                                    />
                                </div>

                                {/* Reward Calibration Dropdown */}
                                <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setIsRewardsExpanded(!isRewardsExpanded)}
                                        className="w-full flex items-center justify-between p-3 text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                    >
                                        <span>Reward Calibration (Multi: {REWARD_MULTIPLIERS[difficulty]}x)</span>
                                        {isRewardsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>

                                    {isRewardsExpanded && (
                                        <div className="p-3 grid grid-cols-3 gap-3 border-t border-gray-700 animate-fade-in bg-gray-900/50">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Zap size={10} /> XP</label>
                                                <input
                                                    type="number"
                                                    value={rewardXP}
                                                    onChange={(e) => {
                                                        setRewardXP(Number(e.target.value));
                                                        setHasCustomizedRewards(true);
                                                    }}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-indigo-300 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Coins size={10} /> Gold</label>
                                                <input
                                                    type="number"
                                                    value={rewardGold}
                                                    onChange={(e) => {
                                                        setRewardGold(Number(e.target.value));
                                                        setHasCustomizedRewards(true);
                                                    }}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-yellow-300 text-xs font-bold focus:border-yellow-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Trophy size={10} /> QP</label>
                                                <input
                                                    type="number"
                                                    value={rewardQP}
                                                    onChange={(e) => {
                                                        setRewardQP(Number(e.target.value));
                                                        setHasCustomizedRewards(true);
                                                    }}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-blue-300 text-xs font-bold focus:border-blue-500 focus:outline-none"
                                                />
                                            </div>
                                            {hasCustomizedRewards && (
                                                <div className="col-span-3 flex justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setRewardXP(calculatedXP);
                                                            setRewardGold(calculatedGold);
                                                            setRewardQP(calculatedQP);
                                                            setHasCustomizedRewards(false);
                                                        }}
                                                        className="text-[10px] text-gray-500 hover:text-white underline"
                                                    >
                                                        Reset to Auto-Calc
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Final Deadline</label>
                                        <input
                                            type="datetime-local"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">XP Difficulty</label>
                                        <div className="flex bg-gray-800 rounded p-1">
                                            {(['EASY', 'MEDIUM', 'HARD'] as QuestDifficulty[]).map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setDifficulty(d)}
                                                    className={`flex-1 py-1 text-[10px] font-bold rounded ${difficulty === d ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}
                                                >
                                                    {d[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 border-t border-gray-800 shrink-0 bg-gray-900 z-10">
                    <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-2">
                        <Trash2 size={16} /> <span className="hidden sm:inline">Discard</span>
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg shadow-indigo-900/20 transition-all text-sm">
                            {initialQuest ? 'Update Quest' : 'Embark'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};