import React, { useMemo, useState } from 'react';
import { HistoryRecord } from '../types';
import { BarChart2 } from 'lucide-react';
import { useGame } from '../store';

interface StatGraphProps {
    history: Record<string, HistoryRecord>;
}

type TimeRange = 'WEEK' | 'MONTH' | 'YEAR';

const StatGraph: React.FC<StatGraphProps> = ({ history }) => {
    const { dispatch } = useGame();
    const [range, setRange] = useState<TimeRange>('WEEK');

    const dataPoints = useMemo(() => {
        const points = [];
        const today = new Date();
        let daysToLookBack = 7;

        if (range === 'MONTH') daysToLookBack = 30;
        if (range === 'YEAR') daysToLookBack = 365;

        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const record = history[dateStr] || { xp: 0, gold: 0, qp: 0, fails: 0, completed: 0, focusMinutes: 0 };

            points.push({
                date: dateStr,
                displayDate: range === 'YEAR' && i % 30 !== 0 ? '' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                ...record
            });
        }

        // Aggregate for Year view to reduce noise? 
        // For simplicity in SVG rendering without external libs, keeping daily points is fine but might get crowded.
        // If YEAR, let's group by Month for cleaner lines.
        if (range === 'YEAR') {
            const aggregated = [];
            const monthMap = new Map<string, HistoryRecord & { count: number }>();

            points.forEach(p => {
                const monthKey = p.date.substring(0, 7); // YYYY-MM
                const existing = monthMap.get(monthKey) || { xp: 0, gold: 0, qp: 0, fails: 0, completed: 0, focusMinutes: 0, count: 0 };
                monthMap.set(monthKey, {
                    xp: existing.xp + p.xp,
                    gold: existing.gold + p.gold,
                    qp: existing.qp + p.qp,
                    fails: existing.fails + p.fails,
                    completed: existing.completed + (p.completed || 0),
                    focusMinutes: existing.focusMinutes + (p.focusMinutes || 0),
                    count: existing.count + 1
                });
            });

            for (const [key, val] of monthMap.entries()) {
                const [y, m] = key.split('-');
                const dateObj = new Date(Number(y), Number(m) - 1, 1);
                aggregated.push({
                    date: key,
                    displayDate: dateObj.toLocaleDateString('en-US', { month: 'short' }),
                    ...val
                });
            }
            return aggregated.sort((a, b) => a.date.localeCompare(b.date));
        }

        return points;
    }, [history, range]);

    const maxValues = useMemo(() => {
        let maxXp = 100;
        let maxGold = 50;
        let maxQp = 10;
        let maxFails = 5;

        dataPoints.forEach(d => {
            if (d.xp > maxXp) maxXp = d.xp;
            if (d.gold > maxGold) maxGold = d.gold;
            if (d.qp > maxQp) maxQp = d.qp;
            if (d.fails > maxFails) maxFails = d.fails;
        });
        return { maxXp, maxGold, maxQp, maxFails };
    }, [dataPoints]);

    // SVG Dimensions
    const height = 150;
    const width = 1000;
    const padding = 20;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const getX = (index: number) => padding + (index / (dataPoints.length - 1)) * graphWidth;
    const getY = (value: number, max: number) => height - padding - (value / max) * graphHeight;

    // Generate Path Strings
    const makePath = (key: 'xp' | 'gold' | 'qp', max: number) => {
        if (dataPoints.length < 2) return "";
        return dataPoints.map((d, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key] as number, max)}`
        ).join(' ');
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative group">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <BarChart2 size={20} className="text-indigo-400" />
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Growth Metrics</h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-800 rounded p-0.5">
                        {(['WEEK', 'MONTH', 'YEAR'] as TimeRange[]).map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${range === r ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-4 text-[10px] font-bold uppercase tracking-wider justify-center">
                <div className="flex items-center gap-1.5 text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-400" /> XP</div>
                <div className="flex items-center gap-1.5 text-yellow-500"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Gold</div>
                <div className="flex items-center gap-1.5 text-cyan-400"><div className="w-2 h-2 rounded-full bg-cyan-400" /> Quest Points</div>
                <div className="flex items-center gap-1.5 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500" /> Fails</div>
            </div>

            {/* Chart */}
            <div className="relative w-full aspect-[4/1] min-h-[150px]">
                {dataPoints.length > 0 ? (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">

                        {/* Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(t => (
                            <line
                                key={t}
                                x1={padding}
                                y1={height - padding - (t * graphHeight)}
                                x2={width - padding}
                                y2={height - padding - (t * graphHeight)}
                                stroke="#334155"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                opacity="0.3"
                            />
                        ))}

                        {/* Fails (Bars) - Rendered first to be behind lines */}
                        {dataPoints.map((d, i) => {
                            if (d.fails === 0) return null;
                            const barHeight = (d.fails / maxValues.maxFails) * (graphHeight * 0.4); // Cap bar height at 40% of graph
                            return (
                                <rect
                                    key={`fail-${i}`}
                                    x={getX(i) - 2}
                                    y={height - padding - barHeight}
                                    width={4}
                                    height={barHeight}
                                    fill="#ef4444"
                                    opacity="0.6"
                                />
                            );
                        })}

                        {/* Lines */}
                        <path d={makePath('xp', maxValues.maxXp)} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={makePath('gold', maxValues.maxGold)} fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={makePath('qp', maxValues.maxQp)} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                        {/* X-Axis Labels */}
                        {dataPoints.map((d, i) => (
                            d.displayDate && (
                                <text
                                    key={`label-${i}`}
                                    x={getX(i)}
                                    y={height}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#94a3b8"
                                >
                                    {d.displayDate}
                                </text>
                            )
                        ))}
                    </svg>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs italic">
                        Not enough data to display growth.
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatGraph;