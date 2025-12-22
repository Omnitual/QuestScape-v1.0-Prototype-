
import React, { useState, useEffect, useRef } from 'react';
import { Quest, QuestType, QuestDifficulty } from '../types';
import { Check, Repeat, Star, Sword, Clock, AlertTriangle, XCircle, Sparkles, Zap, Coins, Play, Pause, Hourglass } from 'lucide-react';
import { useGame } from '../store';

interface QuestCardProps {
    quest: Quest;
    compact?: boolean;
    onSelect?: () => void;
    onDelete?: (id: string) => void;
    onEdit?: (quest: Quest) => void;
    onToggle?: (id: string) => void;
    children?: React.ReactNode;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, compact = false, onSelect, onEdit, onToggle, children }) => {
    const { dispatch } = useGame();
    const isExpired = quest.dueDate && new Date(quest.dueDate) < new Date() && !quest.completed;

    // Local state for "Completing" animation phase
    const [isAnimatingSuccess, setIsAnimatingSuccess] = useState(false);

    // FOCUS QUEST LOGIC
    const isFocus = quest.type === QuestType.FOCUS;
    const initialSeconds = quest.focusSecondsRemaining ?? ((quest.focusDurationMinutes || 0) * 60);
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (quest.focusSecondsRemaining !== undefined && !isRunning) {
            setTimeLeft(quest.focusSecondsRemaining);
        }
    }, [quest.focusSecondsRemaining, isRunning]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = window.setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, timeLeft]);

    const toggleTimer = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isRunning) {
            setIsRunning(false);
            dispatch({ type: 'UPDATE_FOCUS_TIMER', payload: { id: quest.id, remainingSeconds: timeLeft } });
        } else {
            setIsRunning(true);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Determine Interactivity
    const isInteractive = !!onSelect || !!onEdit || !!onToggle;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) {
            onSelect();
            return;
        }

        // For Focus Quests, only allow toggle if time is 0
        if (isFocus && timeLeft > 0 && !quest.completed) return;

        if (onToggle) {
            if (!quest.completed) {
                // 1. Trigger Animation State
                setIsAnimatingSuccess(true);

                // 2. Wait for animation (roughly 350ms to match CSS)
                setTimeout(() => {
                    onToggle(quest.id);
                    setIsAnimatingSuccess(false);
                }, 350); 
            } else {
                // Instant Toggle for undoing
                onToggle(quest.id);
            }
        }
    };

    const handleCardClick = () => {
        if (onEdit) {
            onEdit(quest);
        }
    };

    // Card Colors (Backgrounds/Borders)
    const getTypeColorStyles = (type: QuestType) => {
        if (isExpired) return 'border-red-900/50 bg-red-950/10';

        switch (type) {
            case QuestType.GRANDMASTER: return 'border-amber-600/50 bg-amber-950/20' + (isInteractive ? ' hover:bg-amber-950/30 hover:border-amber-500' : '');
            case QuestType.DAILY: return 'border-indigo-600/50 bg-indigo-950/20' + (isInteractive ? ' hover:bg-indigo-950/30 hover:border-indigo-500' : '');
            case QuestType.SIDE: return 'border-emerald-600/50 bg-emerald-950/20' + (isInteractive ? ' hover:bg-emerald-950/30 hover:border-emerald-500' : '');
            case QuestType.EVENT: return 'border-purple-600/50 bg-purple-950/20' + (isInteractive ? ' hover:bg-purple-950/30 hover:border-purple-500' : '');
            case QuestType.FOCUS: return 'border-cyan-600/50 bg-cyan-950/20' + (isInteractive ? ' hover:bg-cyan-950/30 hover:border-cyan-500' : '');
            default: return 'border-gray-700 bg-gray-800';
        }
    };

    // Icon Box Colors (For the left-side icon in standard view)
    const getTypeIconBoxStyles = (type: QuestType) => {
        if (isExpired) return 'bg-red-900/20 border-red-800 text-red-500';
        switch (type) {
            case QuestType.GRANDMASTER: return 'bg-amber-900/30 border-amber-500/50 text-amber-400';
            case QuestType.DAILY: return 'bg-indigo-900/30 border-indigo-500/50 text-indigo-400';
            case QuestType.SIDE: return 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400';
            case QuestType.EVENT: return 'bg-purple-900/30 border-purple-500/50 text-purple-400';
            case QuestType.FOCUS: return 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400';
            default: return 'bg-gray-800 border-gray-700 text-gray-400';
        }
    };

    const getTypeIcon = (type: QuestType) => {
        switch (type) {
            case QuestType.GRANDMASTER: return <Star size={14} fill="currentColor" className="opacity-80" />;
            case QuestType.DAILY: return <Repeat size={14} />;
            case QuestType.SIDE: return <Sword size={14} />;
            case QuestType.EVENT: return <Sparkles size={14} />;
            case QuestType.FOCUS: return <Hourglass size={14} />;
        }
    };

    const formatDueDate = (isoString?: string) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDaysRemaining = (isoString?: string) => {
        if (!isoString) return null;
        const due = new Date(isoString);
        const now = new Date();
        const diffTime = Math.abs(due.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // --- Badge/Tag Renderers ---

    // Standardized Badge Base Class
    const badgeBaseClass = "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase border shadow-sm";

    const getDifficultyBadge = (difficulty?: QuestDifficulty) => {
        if (!difficulty) return null;
        let colors = "text-gray-400 border-gray-700 bg-gray-900/50";
        if (difficulty === 'EASY') colors = "text-green-400 border-green-800 bg-green-900/20";
        if (difficulty === 'MEDIUM') colors = "text-yellow-400 border-yellow-800 bg-yellow-900/20";
        if (difficulty === 'HARD') colors = "text-red-400 border-red-800 bg-red-900/20";

        return (
            <span className={`${badgeBaseClass} ${colors}`}>
                {difficulty}
            </span>
        );
    };

    // --- 1. Compact View (Notice Board Selection) ---
    if (compact) {
        const daysLeft = getDaysRemaining(quest.dueDate);

        return (
            <div
                onClick={onSelect}
                className={`
                    cursor-pointer group/card relative overflow-hidden bg-emerald-950/30 border rounded-lg p-4 flex flex-col h-full border-gray-600 
                    transition-all duration-300 ease-out origin-bottom-left
                    hover:z-20 hover:scale-[1.05] hover:rotate-2 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)] hover:border-emerald-400 hover:bg-emerald-950/50
                    shadow-sm
                `}
            >
                {/* Render Injected Children (e.g. Reroll Button) */}
                {children}

                {(quest.isRisk || quest.hasPenalty) && (
                    <div className="absolute bottom-3 right-3 text-red-500/80 z-10" title="Fail Risk">
                        <AlertTriangle size={18} />
                    </div>
                )}

                <div className="flex justify-between items-start mb-2 relative z-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                            Side Quest
                        </span>
                        {daysLeft && (
                            <span className="text-[10px] text-emerald-500/70 border border-emerald-500/20 px-1.5 rounded bg-emerald-950/50 flex items-center gap-1">
                                <Clock size={10} /> {daysLeft}d
                            </span>
                        )}
                    </div>
                </div>

                <h4 className="font-semibold text-gray-200 group-hover/card:text-white mb-4 pr-4">{quest.title}</h4>

                <div className="mt-auto flex justify-between items-end">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {getDifficultyBadge(quest.difficulty)}
                        <span className={`${badgeBaseClass} bg-purple-900/20 border-purple-800 text-purple-400`}>
                            <Zap size={10} /> {quest.xpReward} XP
                        </span>
                        <span className={`${badgeBaseClass} bg-yellow-900/20 border-yellow-800 text-yellow-500`}>
                            <Coins size={10} /> {quest.goldReward}g
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    // --- 2. Standard Horizontal Row View ---
    return (
        <div
            onClick={handleCardClick}
            className={`
            border rounded-lg p-3 sm:p-4 transition-all duration-300 flex items-center gap-3 sm:gap-4 relative overflow-hidden
            ${getTypeColorStyles(quest.type)} 
            ${quest.completed && !isAnimatingSuccess ? 'opacity-60 grayscale-[0.5]' : isInteractive ? 'shadow-md' : 'opacity-80'}
            ${isInteractive ? 'cursor-pointer group' : 'cursor-default'}
        `}
        >
            {/* Plasma Animation */}
            {(isAnimatingSuccess || (quest.completed && !isExpired)) && (quest.type === QuestType.DAILY || quest.type === QuestType.SIDE) && (
                <div 
                    className={`absolute top-0 bottom-0 right-0 w-48 bg-gradient-to-l to-transparent animate-plasma pointer-events-none z-0 
                    ${quest.type === QuestType.DAILY ? 'from-indigo-500/40 via-indigo-400/20' : 'from-emerald-500/40 via-emerald-400/20'}`} 
                />
            )}

            {/* Left Column: Type Icon */}
            <div className={`relative z-10 hidden sm:flex shrink-0 w-10 h-10 rounded-md border items-center justify-center shadow-inner ${getTypeIconBoxStyles(quest.type)}`}>
                {getTypeIcon(quest.type)}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 relative z-10">
                <div className="flex flex-col gap-0.5 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Mobile Only: Inline Type Icon */}
                        <div className={`sm:hidden p-1 rounded border ${getTypeIconBoxStyles(quest.type)}`}>
                             {getTypeIcon(quest.type)}
                        </div>

                        <h3 className={`text-base sm:text-lg font-bold leading-tight ${quest.completed && !isAnimatingSuccess ? 'text-gray-500 line-through' : isExpired ? 'text-red-300/80' : 'text-gray-200'}`}>
                            {quest.title}
                        </h3>
                    </div>

                    {quest.description && (
                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">{quest.description}</p>
                    )}
                </div>

                {/* Footer / Tags */}
                <div className="flex flex-wrap gap-2 mt-3 items-center">
                    {(!quest.completed || isAnimatingSuccess) && (
                        <>
                            {getDifficultyBadge(quest.difficulty)}
                            
                            <span className={`${badgeBaseClass} bg-purple-900/20 border-purple-800 text-purple-400`}>
                                <Zap size={10} /> {quest.xpReward} XP
                            </span>
                            
                            <span className={`${badgeBaseClass} bg-yellow-900/20 border-yellow-800 text-yellow-500`}>
                                <Coins size={10} /> {quest.goldReward}g
                            </span>
                            
                            {isFocus && (
                                <span className={`${badgeBaseClass} bg-cyan-900/20 border-cyan-800 text-cyan-400`}>
                                    <Hourglass size={10} /> +{quest.focusDurationMinutes} Score
                                </span>
                            )}
                        </>
                    )}

                    {quest.dueDate && (!quest.completed || isAnimatingSuccess) && (
                        <span className={`${badgeBaseClass} ${isExpired ? 'bg-red-950/30 border-red-900/50 text-red-400' : 'bg-blue-900/10 border-blue-900/20 text-blue-400'}`}>
                            <Clock size={10} /> {isExpired ? `Expired ${formatDueDate(quest.dueDate)}` : formatDueDate(quest.dueDate)}
                        </span>
                    )}

                    {(quest.hasPenalty || quest.isRisk) && (!quest.completed || isAnimatingSuccess) && !isExpired && (
                        <span className={`${badgeBaseClass} bg-red-900/20 border-red-800 text-red-400`} title="Failure results in debuff">
                            <AlertTriangle size={10} /> <span className="hidden sm:inline">Fail Risk</span>
                        </span>
                    )}

                    {quest.type === QuestType.DAILY && quest.streak !== undefined && quest.streak > 0 && !isExpired && (
                        <span className={`${badgeBaseClass} bg-orange-900/20 border-orange-900/30 text-orange-400`}>
                            🔥 {quest.streak} <span className="hidden sm:inline">Day Streak</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Action Section (Check/Timer) */}
            <div className="shrink-0 ml-2 relative z-10 flex items-center">
                {isFocus && !quest.completed ? (
                    <div className="flex items-center gap-2">
                        <div className={`font-mono text-sm font-bold ${isRunning ? 'text-cyan-300' : 'text-gray-500'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        {timeLeft > 0 ? (
                            <button
                                onClick={toggleTimer}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isRunning ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300 animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300'}`}
                            >
                                {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                            </button>
                        ) : (
                            <button
                                onClick={handleToggle}
                                className="w-8 h-8 rounded-full border border-cyan-500 bg-cyan-600 text-white flex items-center justify-center shadow-[0_0_10px_rgba(8,145,178,0.6)] hover:bg-cyan-500 transition-all animate-bounce"
                            >
                                <Check size={16} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                ) : isInteractive ? (
                    <button
                        onClick={handleToggle}
                        disabled={isAnimatingSuccess} // Prevent double clicking during animation
                        className={`w-8 h-8 rounded-md border flex items-center justify-center transition-all duration-200 
                ${(quest.completed || isAnimatingSuccess)
                                ? 'bg-green-600 border-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.6)]'
                                : isExpired
                                    ? 'bg-red-900/20 border-red-800 hover:border-red-500 hover:bg-red-900/40 text-red-500/50'
                                    : 'bg-gray-900/50 border-gray-500 hover:border-gray-300 hover:bg-gray-800'
                            }`}
                    >
                        {(quest.completed || isAnimatingSuccess) && <Check size={16} strokeWidth={4} />}
                        {!quest.completed && !isAnimatingSuccess && isExpired && <XCircle size={16} />}
                    </button>
                ) : (
                    <div className={`w-6 h-6 flex items-center justify-center rounded border
                 ${quest.completed
                            ? 'bg-green-900/20 border-green-800 text-green-500'
                            : isExpired
                                ? 'bg-red-900/20 border-red-800 text-red-500'
                                : 'bg-gray-800 border-gray-700'
                        }
             `}>
                        {quest.completed && <Check size={14} />}
                        {isExpired && !quest.completed && <XCircle size={14} />}
                    </div>
                )}
            </div>

        </div>
    );
};

export default QuestCard;
