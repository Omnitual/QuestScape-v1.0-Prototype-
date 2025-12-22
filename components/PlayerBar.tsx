
import React from 'react';
import { useGame } from '../store';
import { getStreakMultiplier } from '../gameMechanics';
import { Coins, Compass, Flame, Hourglass } from 'lucide-react';

const PlayerBar: React.FC = () => {
    const { state, maxXP } = useGame();
    const { stats } = state;

    const xpPercentage = Math.min(100, (stats.currentXP / maxXP) * 100);
    const currentTitle = stats.titles[stats.titles.length - 1];

    // Calculated Multiplier Logic
    const streakMultiplier = getStreakMultiplier(stats.globalStreak || 0);
    const isStreakActive = streakMultiplier > 1.0;

    return (
        <div className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur border-b border-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4">

                {/* Top Row: Name, Title, Gold, QP */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-900 rounded-lg border-2 border-indigo-500 flex items-center justify-center text-xl font-bold font-cinzel text-white relative overflow-hidden">
                            {stats.level}
                            {/* Level Glint */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-pulse"></div>
                        </div>
                        <div>
                            <h1 className="text-white font-bold leading-none">{stats.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-indigo-400 uppercase tracking-widest font-semibold">{currentTitle}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                        <div className="flex items-center gap-2" title="Gold">
                            <Coins size={18} className="text-yellow-500" />
                            <span className="text-sm font-bold text-gray-200">{stats.gold}</span>
                        </div>
                        <div className="flex items-center gap-2" title="Quest Points">
                            <Compass size={18} className="text-blue-400" />
                            <span className="text-sm font-bold text-gray-200">{stats.questPoints}</span>
                        </div>
                        <div className="flex items-center gap-2" title="Focus Time (Total)">
                            <Hourglass size={18} className="text-cyan-400" />
                            <span className="text-sm font-bold text-gray-200">{stats.focusScore || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Buffs Bar (Streak Bonus visualization) */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {isStreakActive && (
                        <div
                            className="flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold uppercase border bg-orange-900/20 border-orange-500/50 text-orange-300"
                            title={`Streak Bonus: ${(streakMultiplier - 1).toFixed(2)}x`}
                        >
                            <Flame size={10} />
                            <span>Momentum</span>
                            <span className="opacity-70 bg-black/20 px-1 rounded">x{streakMultiplier.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {/* Bottom Row: Bars */}
                <div className="space-y-1">
                    {/* XP Bar */}
                    <div className="relative h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-800 to-indigo-500 transition-all duration-500 ease-out"
                            style={{ width: `${xpPercentage}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                            XP {stats.currentXP} / {maxXP}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PlayerBar;
