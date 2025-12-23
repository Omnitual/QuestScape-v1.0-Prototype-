
import React from 'react';
import { useGame } from '../store';
import { getStreakMultiplier } from '../gameMechanics';
import { Coins, Compass, Flame, Hourglass } from 'lucide-react';

const MomentumWidget: React.FC<{ streak: number; multiplier: number }> = ({ streak, multiplier }) => {
    const isStreakActive = streak > 0;
    
    return (
        <div className="flex items-center gap-3 bg-gray-900/80 border border-gray-700/50 rounded-full px-4 py-1.5 shadow-sm backdrop-blur-md">
            {/* Count & Icon */}
            <div className="flex items-center gap-1.5 min-w-[3.5rem]">
                <Flame size={14} className={`${isStreakActive ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-slate-600'}`} />
                <span className={`text-xs font-bold font-mono ${isStreakActive ? 'text-white' : 'text-slate-500'}`}>{streak}</span>
            </div>

            {/* Visual Tracker */}
            <div className="relative w-24 h-3 flex items-center">
                {/* Track Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-gradient-to-r from-orange-900 to-orange-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (Math.max(0, Math.min(streak, 7) - 1)) / 6 * 100)}%` }}
                     />
                </div>

                {/* Dots */}
                <div className="absolute inset-0 flex justify-between items-center">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const dayNum = i + 1;
                        const isCompleted = streak >= dayNum;
                        return (
                            <div 
                                key={i}
                                className={`
                                    w-2 h-2 rounded-full border transition-all duration-300 z-10
                                    ${isCompleted 
                                        ? 'bg-orange-500 border-orange-400 shadow-[0_0_4px_rgba(249,115,22,0.5)]' 
                                        : 'bg-gray-900 border-gray-700'}
                                `}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Multiplier Badge */}
            {multiplier > 1.0 && (
                <div className="hidden sm:block text-[9px] font-bold text-orange-300 bg-orange-900/30 px-1.5 py-0.5 rounded border border-orange-500/20">
                    x{multiplier.toFixed(1)}
                </div>
            )}
        </div>
    );
};

const PlayerBar: React.FC = () => {
    const { state, maxXP } = useGame();
    const { stats } = state;

    const xpPercentage = Math.min(100, (stats.currentXP / maxXP) * 100);
    const currentTitle = stats.titles[stats.titles.length - 1];
    const streakMultiplier = getStreakMultiplier(stats.globalStreak || 0);

    return (
        <div className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur border-b border-gray-800 shadow-lg transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 py-3">

                {/* Primary Header Row */}
                <div className="flex items-center justify-between gap-4 relative">
                    
                    {/* Left: Identity */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 bg-indigo-900/80 rounded-lg border border-indigo-500/50 flex items-center justify-center text-lg font-bold font-cinzel text-white relative overflow-hidden shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                            {stats.level}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-pulse"></div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-white font-bold text-sm leading-tight truncate max-w-[120px] sm:max-w-none">{stats.name}</h1>
                            <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold truncate max-w-[120px] sm:max-w-none">{currentTitle}</span>
                        </div>
                    </div>

                    {/* Center (Desktop): Momentum */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <MomentumWidget streak={stats.globalStreak || 0} multiplier={streakMultiplier} />
                    </div>

                    {/* Right (Desktop): Resources */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-2" title="Gold">
                            <Coins size={16} className="text-yellow-500" />
                            <span className="text-sm font-bold text-gray-200">{stats.gold}</span>
                        </div>
                        <div className="flex items-center gap-2" title="Quest Points">
                            <Compass size={16} className="text-blue-400" />
                            <span className="text-sm font-bold text-gray-200">{stats.questPoints}</span>
                        </div>
                        <div className="flex items-center gap-2" title="Focus Time">
                            <Hourglass size={16} className="text-cyan-400" />
                            <span className="text-sm font-bold text-gray-200">{stats.focusScore || 0}</span>
                        </div>
                    </div>

                    {/* Right (Mobile): Momentum */}
                    <div className="md:hidden flex">
                        <MomentumWidget streak={stats.globalStreak || 0} multiplier={streakMultiplier} />
                    </div>
                </div>

                {/* Mobile Resources Row (Secondary) */}
                <div className="flex md:hidden items-center justify-between mt-3 pt-2 border-t border-white/5 gap-4">
                     <div className="flex items-center gap-1.5" title="Gold">
                        <Coins size={14} className="text-yellow-500" />
                        <span className="text-xs font-bold text-gray-200">{stats.gold}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Quest Points">
                        <Compass size={14} className="text-blue-400" />
                        <span className="text-xs font-bold text-gray-200">{stats.questPoints}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Focus Time">
                        <Hourglass size={14} className="text-cyan-400" />
                        <span className="text-xs font-bold text-gray-200">{stats.focusScore || 0}</span>
                    </div>
                </div>

                {/* XP Bar (Bottom) */}
                <div className="mt-3 relative h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-800 to-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out"
                        style={{ width: `${xpPercentage}%` }}
                    />
                </div>

            </div>
        </div>
    );
};

export default PlayerBar;
