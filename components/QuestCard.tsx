

import React, { useState, useEffect, useRef } from 'react';
import { Quest, QuestType, QuestDifficulty } from '../types';
import { Check, Repeat, Star, Sword, Clock, AlertTriangle, XCircle, Sparkles, Zap, Coins, Hourglass, Compass, Settings } from 'lucide-react';
import { useGame } from '../store';

// --- Decoupled Tag Component for Scale & Consistency ---
interface QuestTagProps {
    icon?: React.ElementType;
    label?: React.ReactNode;
    colorClasses: string;
    title?: string;
}

const QuestTag: React.FC<QuestTagProps> = ({ icon: Icon, label, colorClasses, title }) => (
    <span 
        className={`flex items-center justify-center gap-1.5 px-2 rounded text-[10px] font-bold uppercase border shadow-sm h-6 whitespace-nowrap transition-colors ${colorClasses}`} 
        title={title}
    >
        {Icon && <Icon size={12} strokeWidth={2.5} />}
        {label}
    </span>
);

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

    // Interaction State
    const [isEditMode, setIsEditMode] = useState(false);
    const holdTimerRef = useRef<number | null>(null);

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

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // If in edit mode, this button is the gear icon
        if (isEditMode && onEdit) {
            onEdit(quest);
            setIsEditMode(false);
            return;
        }
        
        // Focus Logic: Toggle Timer if active
        if (isFocus && timeLeft > 0 && !quest.completed) {
            toggleTimer(e);
            return;
        }
        
        // Default Logic: Complete/Uncomplete
        handleToggle(e);
    };

    // --- Hold-to-Edit Logic ---
    const handlePressStart = () => {
        if (!onEdit || compact) return;
        
        holdTimerRef.current = window.setTimeout(() => {
            setIsEditMode(true);
            // Optional: Haptic feedback if supported/wanted
            if (navigator.vibrate) navigator.vibrate(50);
        }, 800); // 800ms hold time
    };

    const handlePressEnd = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // If we are in edit mode and click elsewhere on the card (not the button), reset mode
        if (isEditMode) {
            // But if it's the notice board (onSelect), trigger that
            if (onSelect) onSelect();
            else setIsEditMode(false);
        } else if (onSelect) {
            onSelect();
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

    // Colors for the Type Tag
    const getTypeTagStyles = (type: QuestType) => {
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

    const getQuestIconComponent = (type: QuestType) => {
        switch (type) {
            case QuestType.GRANDMASTER: return Star;
            case QuestType.DAILY: return Repeat;
            case QuestType.SIDE: return Sword;
            case QuestType.EVENT: return Sparkles;
            case QuestType.FOCUS: return Hourglass;
            default: return Star;
        }
    };

    // Compact date logic for Action Area
    const getDaysRemainingShort = (isoString?: string) => {
        if (!isoString) return null;
        const due = new Date(isoString);
        const now = new Date();
        now.setHours(0,0,0,0); // compare start of days
        
        // Approx diff
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { text: `${Math.abs(diffDays)}d ago`, isLate: true };
        if (diffDays === 0) return { text: 'Today', isLate: false };
        if (diffDays === 1) return { text: 'Tmrw', isLate: false };
        return { text: `${diffDays}d`, isLate: false };
    };

    const getDaysRemaining = (isoString?: string) => {
        if (!isoString) return null;
        const due = new Date(isoString);
        const now = new Date();
        const diffTime = Math.abs(due.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getDifficultyDot = (difficulty?: QuestDifficulty) => {
        if (!difficulty) return null;
        let colorClass = "bg-gray-500";
        if (difficulty === 'EASY') colorClass = "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]";
        if (difficulty === 'MEDIUM') colorClass = "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]";
        if (difficulty === 'HARD') colorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";

        return (
            <div className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`} title={`Difficulty: ${difficulty}`} />
        );
    };

    // --- 1. Compact View (Notice Board Selection) ---
    if (compact) {
        const daysLeft = getDaysRemaining(quest.dueDate);

        return (
            <div
                onClick={onSelect}
                className={`
                    cursor-pointer group/card relative overflow-hidden bg-emerald-950/30 border rounded-lg p-5 flex flex-col h-full border-gray-600 
                    transition-all duration-300 ease-out origin-bottom-left
                    hover:z-20 hover:scale-[1.05] hover:rotate-2 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)] hover:border-emerald-400 hover:bg-emerald-950/50
                    shadow-sm
                `}
            >
                {children}

                <div className="flex justify-between items-start mb-3 relative z-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                            {quest.type === QuestType.FOCUS ? 'Protocol' : 'Side Quest'}
                        </span>
                        {daysLeft && (
                            <span className="text-[10px] text-emerald-500/70 border border-emerald-500/20 px-1.5 rounded bg-emerald-950/50 flex items-center gap-1">
                                <Clock size={10} /> {daysLeft}d
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-start justify-between gap-2 mb-6 flex-1">
                    <h4 className="font-semibold text-gray-200 group-hover/card:text-white leading-tight">{quest.title}</h4>
                    <div className="mt-1.5">{getDifficultyDot(quest.difficulty)}</div>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 items-end">
                    <QuestTag 
                        icon={Zap} 
                        label={`${quest.xpReward}`} 
                        colorClasses="bg-purple-900/20 border-purple-800 text-purple-400" 
                    />
                    
                    <QuestTag 
                        icon={Coins} 
                        label={`${quest.goldReward}`} 
                        colorClasses="bg-yellow-900/20 border-yellow-800 text-yellow-500" 
                    />

                    <QuestTag 
                        icon={Compass} 
                        label={`${quest.qpReward}`} 
                        colorClasses="bg-blue-900/20 border-blue-800 text-blue-400" 
                    />
                    
                    {(quest.hasPenalty || quest.isRisk) && (
                         <QuestTag 
                             icon={AlertTriangle} 
                             label={null}
                             colorClasses="bg-red-900/20 border-red-800 text-red-400"
                             title="Failure results in debuff"
                         />
                    )}
                </div>
            </div>
        )
    }

    // --- 2. Standard Horizontal Row View ---
    const dateStatus = getDaysRemainingShort(quest.dueDate);
    
    // Dynamic Styles for the Combined Action Button
    const getActionBtnStyles = () => {
        let styles = "h-8 min-w-[2rem] px-2 rounded-md border flex items-center justify-center transition-all duration-200 shadow-sm shrink-0 ";
        
        if (isEditMode) {
             return styles + "bg-gray-700 border-gray-500 text-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.2)]";
        }

        // Completed State
        if (quest.completed || isAnimatingSuccess) {
            return styles + "bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(22,163,74,0.6)]";
        }
        
        // Focus Active/Paused State
        if (isFocus) {
            if (timeLeft > 0) {
                return styles + (isRunning 
                   ? "bg-cyan-900/80 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]" 
                   : "bg-gray-800 border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300");
            } else {
                // Focus Ready to Complete
                return styles + "bg-cyan-600 border-cyan-500 text-white animate-bounce shadow-[0_0_10px_rgba(8,145,178,0.6)] hover:bg-cyan-500";
            }
        }

        // Expired State
        if (isExpired) {
            return styles + "bg-red-900/20 border-red-800 hover:border-red-500 hover:bg-red-900/40 text-red-500/50";
        }
        
        // Late Warning
        if (dateStatus && dateStatus.isLate) {
            return styles + "bg-gray-900/50 border-red-500/50 text-red-400 hover:bg-red-900/20";
        }

        // Default Incomplete
        return styles + "bg-gray-900/50 border-gray-600 hover:border-gray-400 hover:bg-gray-800 text-gray-400";
    };

    // Content for the Combined Action Button
    const getActionBtnContent = () => {
        if (isEditMode) {
            return <Settings size={16} />;
        }

        if (quest.completed || isAnimatingSuccess) {
            return <Check size={16} strokeWidth={4} />;
        }
        
        if (isFocus) {
             if (timeLeft > 0) {
                 return (
                    <span className={`font-mono text-xs font-bold ${isRunning ? 'animate-pulse' : ''}`}>
                        {formatTime(timeLeft)}
                    </span>
                 );
             } else {
                 return <Check size={16} strokeWidth={3} />; // Ready to complete
             }
        }

        if (isExpired) {
            return <XCircle size={16} />;
        }

        if (dateStatus) {
            return <span className="text-[10px] font-bold uppercase tracking-tighter leading-none">{dateStatus.text}</span>;
        }

        // Default empty state (looks like a checkbox)
        return null;
    };

    return (
        <div className="relative overflow-hidden rounded-lg">
            {/* Main Card Layer */}
            <div
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                onClick={handleCardClick}
                className={`
                    relative z-10
                    border rounded-lg p-3 sm:p-4 transition-transform duration-300 ease-out flex items-center gap-3 sm:gap-4 overflow-hidden
                    ${getTypeColorStyles(quest.type)} 
                    ${quest.completed && !isAnimatingSuccess ? 'opacity-60 grayscale-[0.5]' : isInteractive ? 'shadow-md' : 'opacity-80'}
                    ${isInteractive ? 'cursor-pointer active:scale-[0.99] group select-none' : 'cursor-default'}
                `}
            >
                {/* Plasma Animation */}
                {(isAnimatingSuccess || (quest.completed && !isExpired)) && (quest.type === QuestType.DAILY || quest.type === QuestType.SIDE) && (
                    <div 
                        className={`absolute top-0 bottom-0 right-0 w-48 bg-gradient-to-l to-transparent animate-plasma pointer-events-none z-0 
                        ${quest.type === QuestType.DAILY ? 'from-indigo-500/40 via-indigo-400/20' : 'from-emerald-500/40 via-emerald-400/20'}`} 
                    />
                )}

                {/* Content Section */}
                <div className="flex-1 min-w-0 relative z-10 pointer-events-none sm:pointer-events-auto">
                    <div className="flex flex-col gap-0.5 w-full">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h3 className={`text-base sm:text-lg font-bold leading-tight ${quest.completed && !isAnimatingSuccess ? 'text-gray-500 line-through' : isExpired ? 'text-red-300/80' : 'text-gray-200'}`}>
                                {quest.title}
                            </h3>
                            {getDifficultyDot(quest.difficulty)}
                        </div>

                        {quest.description && (
                            <p className="text-xs sm:text-sm text-gray-500 line-clamp-1 mt-0.5">{quest.description}</p>
                        )}
                    </div>
                    
                    {/* Injected Content (Milestones, etc.) - Moved here for better visual flow below title */}
                    {children && (
                        <div className="mt-3 mb-2 w-full animate-fade-in relative z-20 pointer-events-auto">
                            {children}
                        </div>
                    )}

                    {/* Footer / Tags */}
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                        
                        {/* Quest Type Tag (Icon Only) */}
                        <QuestTag 
                            icon={getQuestIconComponent(quest.type)} 
                            colorClasses={getTypeTagStyles(quest.type)} 
                            title={quest.type}
                        />

                        {(!quest.completed || isAnimatingSuccess) && (
                            <>
                                <QuestTag 
                                    icon={Zap} 
                                    label={`${quest.xpReward}`} 
                                    colorClasses="bg-purple-900/20 border-purple-800 text-purple-400" 
                                />
                                
                                <QuestTag 
                                    icon={Coins} 
                                    label={`${quest.goldReward}`} 
                                    colorClasses="bg-yellow-900/20 border-yellow-800 text-yellow-500" 
                                />

                                <QuestTag 
                                    icon={Compass} 
                                    label={`${quest.qpReward}`} 
                                    colorClasses="bg-blue-900/20 border-blue-800 text-blue-400" 
                                />
                            </>
                        )}

                        {(quest.hasPenalty || quest.isRisk) && (!quest.completed || isAnimatingSuccess) && !isExpired && (
                            <QuestTag 
                                icon={AlertTriangle} 
                                label={null}
                                colorClasses="bg-red-900/20 border-red-800 text-red-400"
                                title="Failure results in debuff"
                            />
                        )}
                    </div>
                </div>

                {/* Action Section - Unified Button */}
                <div className="shrink-0 ml-auto pl-2 relative z-10 flex flex-col justify-center h-full pointer-events-auto">
                    {isInteractive ? (
                        <button
                            onClick={handleActionClick}
                            disabled={isAnimatingSuccess} // Prevent double clicking during animation
                            className={getActionBtnStyles()}
                        >
                            {getActionBtnContent()}
                        </button>
                    ) : (
                        <div className={getActionBtnStyles().replace('hover:border-gray-400 hover:bg-gray-800', '')}>
                            {getActionBtnContent()}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default QuestCard;