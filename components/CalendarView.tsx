import React, { useMemo, useState } from 'react';
import { useGame } from '../store';
import { Quest, QuestType } from '../types';
import { Flame, Calendar as CalendarIcon, CheckCircle2, Star, Sparkles } from 'lucide-react';
import QuestCard from './QuestCard';

interface CalendarViewProps {
    onEdit: (quest: Quest) => void;
    onToggle: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onEdit, onToggle }) => {
    const { state } = useGame();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const getDateStr = (day: number) => {
        const year = currentYear;
        const month = String(currentMonth + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${month}-${d}`;
    };

    const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const calendarDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    }, [currentYear, currentMonth, firstDayOfMonth, daysInMonth]);

    const getDayData = (day: number) => {
        const dateStr = getDateStr(day);
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = dateObj.getDay();
        const isDayToday = dateStr === todayStr;
        const isPast = dateStr < todayStr;

        const isStreakDay = state.stats.completionHistory && state.stats.completionHistory[dateStr];

        let hasHeroStep = false;
        let hasQuestDue = false;
        let hasEventActive = false;

        state.quests.forEach(q => {
            if (q.completed) return;

            // Check Hero Steps (Grandmaster steps due)
            if (q.type === QuestType.GRANDMASTER && q.steps) {
                if (q.steps.some(s => !s.completed && s.dueDate && s.dueDate.startsWith(dateStr))) {
                    hasHeroStep = true;
                }
            }

            // Check Main Due Date
            if (q.dueDate && q.dueDate.startsWith(dateStr)) {
                if (q.type === QuestType.EVENT) hasEventActive = true;
                else hasQuestDue = true;
            }

            // Dailies (Today Only)
            if (isDayToday && q.type === QuestType.DAILY && !q.dueDate) {
                hasQuestDue = true;
            }
        });

        let hasEventScheduled = false;
        if (!isPast) {
            hasEventScheduled = state.eventTemplates.some(t => {
                return t.allowedDays.includes(dayOfWeek);
            });
        }

        return { 
            isStreakDay, 
            dateStr, 
            hasQuestDue, 
            hasHeroStep, 
            hasEvent: hasEventActive || hasEventScheduled, 
            isPast 
        };
    };

    const isToday = (day: number) => {
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    };

    const selectedDayQuests = useMemo(() => {
        const isSelectedToday = selectedDateStr === todayStr;

        const existing = state.quests.filter(q => {
            // Check main due date
            if (q.dueDate && q.dueDate.startsWith(selectedDateStr)) return true;
            // Check if any step is due on this day
            if (q.steps && q.steps.some(s => s.dueDate && s.dueDate.startsWith(selectedDateStr))) return true;
            // Today's Dailies
            if (isSelectedToday && q.type === QuestType.DAILY && !q.dueDate) return true;
            return false;
        });

        if (selectedDateStr > todayStr) {
            const projected = state.eventTemplates.filter(t => {
                return t.allowedDays.includes(new Date(selectedDateStr + 'T00:00:00').getDay());
            }).map(t => ({
                id: `virtual-${t.id}`,
                title: t.title + ' (Potential)',
                description: t.description,
                type: QuestType.EVENT,
                completed: false,
                xpReward: t.xpReward,
                goldReward: t.goldReward,
                qpReward: t.qpReward,
                createdAt: Date.now(),
                difficulty: 'MEDIUM',
                dueDate: selectedDateStr
            } as Quest));

            return [...existing, ...projected];
        }

        return existing;
    }, [state.quests, state.eventTemplates, selectedDateStr, todayStr]);

    const selectedDayIsStreak = state.stats.completionHistory && state.stats.completionHistory[selectedDateStr];

    return (
        <div className="w-full animate-fade-in">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-cinzel text-slate-200 mb-1">Schedule</h1>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        <CalendarIcon size={14} />
                        {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5"><Flame size={12} className="text-orange-500" /> Streak</div>
                    <div className="flex items-center gap-1.5"><Star size={12} className="text-amber-400" /> Hero Step</div>
                    <div className="flex items-center gap-1.5"><Sparkles size={12} className="text-purple-400" /> Event</div>
                </div>
            </header>

            <div className="bg-slate-900/50 rounded-2xl p-6 backdrop-blur-sm border border-white/5 shadow-2xl mb-8">
                <div className="grid grid-cols-7 mb-4 pb-4 border-b border-slate-700/50">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-6">
                    {calendarDays.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} />;

                        const { isStreakDay, hasQuestDue, hasHeroStep, hasEvent, dateStr, isPast } = getDayData(day);
                        const isCurrentDay = isToday(day);
                        const isFuture = dateStr > todayStr;
                        const isSelected = dateStr === selectedDateStr;

                        // Connector Logic
                        // Draw line to the right if:
                        // 1. Not last column
                        // 2. Next day exists
                        // 3. Current day is NOT future (it's a node)
                        // 4. Next day is NOT future (it's a node)
                        const isColLast = (idx + 1) % 7 === 0;
                        const nextDay = calendarDays[idx + 1];
                        let showConnector = false;
                        
                        if (!isColLast && nextDay && !isFuture) {
                            const nextDateStr = getDateStr(nextDay);
                             if (nextDateStr <= todayStr) {
                                 showConnector = true;
                             }
                        }

                        return (
                            <div key={day} className="relative flex flex-col items-center justify-start h-10 w-full group cursor-pointer" onClick={() => setSelectedDateStr(dateStr)}>
                                
                                {/* Connector Line (Behind Node) */}
                                {showConnector && (
                                    <div className="absolute top-[16px] left-1/2 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
                                )}

                                <button
                                    className={`
                                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 relative z-10
                                    ${isCurrentDay
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-110 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900'
                                            : isPast
                                                ? 'bg-slate-900 border-2 border-slate-700 text-slate-400'
                                                : 'text-slate-600'
                                        }
                                    ${isSelected ? (isFuture ? 'bg-slate-800 text-slate-200 ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900') : ''}
                                    ${!isCurrentDay && !isPast && !isSelected ? 'hover:text-slate-300' : ''}
                                `}
                                >
                                    {day}
                                </button>

                                {/* Icons Layer - High Z-Index to overlap if needed */}
                                <div className="absolute -bottom-2 left-0 right-0 flex justify-center items-center gap-0.5 z-20 pointer-events-none">
                                    {isStreakDay && (
                                        <div className="bg-black/75 rounded-full p-[3px] shadow-sm flex items-center justify-center backdrop-blur-[1px]">
                                            <Flame size={12} className="text-orange-500 fill-orange-500/20" />
                                        </div>
                                    )}
                                    {hasHeroStep && (
                                        <div className="bg-black/75 rounded-full p-[3px] shadow-sm flex items-center justify-center backdrop-blur-[1px]">
                                            <Star size={12} className="text-amber-400 fill-amber-400/20" />
                                        </div>
                                    )}
                                    {hasEvent && (
                                        <div className="bg-black/75 rounded-full p-[3px] shadow-sm flex items-center justify-center backdrop-blur-[1px]">
                                            <Sparkles size={12} className="text-purple-400 fill-purple-400/20" />
                                        </div>
                                    )}
                                    {hasQuestDue && !hasHeroStep && !hasEvent && !isStreakDay && (
                                        <div className={`w-1.5 h-1.5 rounded-full border border-black/50 ${isPast ? 'bg-red-900' : 'bg-red-400'} shadow-md mb-1`}></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4 animate-fade-in-up">
                <h3 className="text-slate-400 font-cinzel text-lg border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>
                        {new Date(selectedDateStr).toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                    {selectedDayIsStreak && (
                        <span className="text-orange-500 text-xs font-sans flex items-center gap-1 bg-orange-950/30 px-2 py-1 rounded-full">
                            <Flame size={12} /> Perfect Focus
                        </span>
                    )}
                </h3>

                {selectedDayQuests.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {selectedDayQuests.map(q => {
                            // Highlight steps due on this specific day within the card context
                            const stepsDueToday = q.steps?.filter(s => s.dueDate && s.dueDate.startsWith(selectedDateStr));
                            return (
                                <div key={q.id} className="space-y-2">
                                    <QuestCard
                                        quest={q}
                                        onEdit={q.id.startsWith('virtual') ? undefined : onEdit}
                                        onToggle={q.id.startsWith('virtual') ? undefined : onToggle}
                                    />
                                    {stepsDueToday && stepsDueToday.length > 0 && (
                                        <div className="ml-8 space-y-1">
                                            {stepsDueToday.map(s => (
                                                <div key={s.id} className="text-[10px] bg-slate-900/50 border border-slate-800 p-1.5 rounded flex items-center gap-2 text-slate-400">
                                                    <div className={`w-2 h-2 rounded-full ${s.completed ? 'bg-green-500' : 'bg-red-400'}`} />
                                                    <span className="font-bold uppercase tracking-tight">Milestone Due:</span>
                                                    <span>{s.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-600 space-y-2">
                        <CheckCircle2 size={32} className="opacity-10" />
                        <p className="text-sm italic">The path is clear.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarView;