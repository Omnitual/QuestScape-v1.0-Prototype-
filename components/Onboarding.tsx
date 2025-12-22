import React, { useState, useEffect } from 'react';
import { useGame } from '../store';
import { DifficultyModifier } from '../types';
import { ArrowRight, Clock, Scroll, Calendar, Check } from 'lucide-react';

const Onboarding: React.FC = () => {
    const { dispatch } = useGame();
    const [step, setStep] = useState(0); // Start at 0 for Time Check
    const [name, setName] = useState('');
    const [xpModifier, setXpModifier] = useState<DifficultyModifier>(DifficultyModifier.NORMAL);
    const [wakeUpTime, setWakeUpTime] = useState('08:00');
    const [isWakeUpNA, setIsWakeUpNA] = useState(false);
    const [firstQuest, setFirstQuest] = useState('');

    // Time check state
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleNext = () => {
        if (step === 3) {
            dispatch({
                type: 'COMPLETE_ONBOARDING',
                payload: {
                    name,
                    wakeUpTime: isWakeUpNA ? 'NA' : wakeUpTime,
                    xpModifier: Number(xpModifier),
                    firstQuest: firstQuest || 'Embark on my journey'
                }
            });
        } else {
            setStep(step + 1);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden relative">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-800 w-full">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${((step + 1) / 4) * 100}%` }}
                    />
                </div>

                <div className="p-8 h-[500px] flex flex-col">

                    <div className="flex-1">
                        {/* STEP 0: Time Check */}
                        {step === 0 && (
                            <div className="space-y-6 animate-fade-in text-center">
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold text-indigo-400 font-cinzel">Temporal Check</h1>
                                    <p className="text-gray-400 text-sm">We must synchronize your timeline.</p>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                    <div className="text-4xl font-mono text-white mb-2 tracking-widest">
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-indigo-400 font-bold uppercase tracking-wider text-sm">
                                        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 italic">
                                    Is this date and time correct? Your daily quests will reset based on this clock.
                                </p>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center space-y-2">
                                    <h1 className="text-3xl font-bold text-indigo-400 font-cinzel">Who are you?</h1>
                                    <p className="text-gray-400 text-sm">Every legend has a name.</p>
                                </div>

                                <div>
                                    <label className="block text-gray-500 text-xs uppercase font-bold mb-2">Character Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-indigo-500 transition"
                                        placeholder="e.g. Aelthas the Brave"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-500 text-xs uppercase font-bold mb-2">Progression Pace</label>
                                    <select
                                        value={xpModifier}
                                        onChange={(e) => setXpModifier(Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value={DifficultyModifier.EASY}>Easy (Fast Leveling)</option>
                                        <option value={DifficultyModifier.NORMAL}>Normal (Balanced)</option>
                                        <option value={DifficultyModifier.HARD}>Hard (Slower Leveling)</option>
                                        <option value={DifficultyModifier.EXTREME}>Extreme (Grind Heavy)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">Determines how much XP is needed per level.</p>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center space-y-2">
                                    <h1 className="text-3xl font-bold text-indigo-400 font-cinzel">Morning Routine</h1>
                                    <p className="text-gray-400 text-sm">Discipline starts with the sun.</p>
                                </div>

                                <div className="flex flex-col items-center justify-center py-6">
                                    <div className="p-4 bg-gray-800 rounded-full mb-4 text-indigo-400">
                                        <Clock size={48} />
                                    </div>

                                    {!isWakeUpNA && (
                                        <input
                                            type="time"
                                            value={wakeUpTime}
                                            onChange={(e) => setWakeUpTime(e.target.value)}
                                            className="bg-gray-900 border border-gray-700 rounded p-4 text-2xl text-white focus:outline-none focus:border-indigo-500 text-center"
                                        />
                                    )}

                                    <div className="mt-6 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="na-toggle"
                                            checked={isWakeUpNA}
                                            onChange={(e) => setIsWakeUpNA(e.target.checked)}
                                            className="w-4 h-4 accent-indigo-500"
                                        />
                                        <label htmlFor="na-toggle" className="text-gray-400 text-sm">I don't have a set wake-up time (N/A)</label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center space-y-2">
                                    <h1 className="text-3xl font-bold text-indigo-400 font-cinzel">Your First Quest</h1>
                                    <p className="text-gray-400 text-sm">A journey of a thousand miles begins with a single step.</p>
                                </div>

                                <div className="flex justify-center mb-4">
                                    <Scroll size={48} className="text-amber-500" />
                                </div>

                                <div>
                                    <label className="block text-gray-500 text-xs uppercase font-bold mb-2">Create a Daily Habit</label>
                                    <input
                                        type="text"
                                        value={firstQuest}
                                        onChange={(e) => setFirstQuest(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-indigo-500 transition"
                                        placeholder="e.g. Make the Bed"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={step === 1 && !name}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-900/20"
                        >
                            {step === 3 ? 'Begin Adventure' : step === 0 ? 'Yes, Correct' : 'Next'} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;