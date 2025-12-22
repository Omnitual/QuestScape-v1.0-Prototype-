import React from 'react';
import { RotateCcw, X, CheckCircle, Star, Repeat, Sword, Info, Sparkles } from 'lucide-react';
import { QuestType } from '../types';

interface ToastProps {
    message: string;
    onUndo?: () => void;
    onClose: () => void;
    type?: 'default' | 'success' | QuestType;
}

const Toast: React.FC<ToastProps> = ({ message, onUndo, onClose, type = 'default' }) => {
    let styles = 'bg-gray-900 border-gray-700 text-white';
    let Icon = Info;
    let iconColor = 'text-gray-400';
    let label = '';
    
    // Animation Logic
    const isHeroVictory = type === QuestType.GRANDMASTER;
    const animationClass = isHeroVictory ? 'animate-toast-mega' : 'animate-toast-bounce';

    switch (type) {
        case 'success':
            styles = 'bg-emerald-900/95 border-emerald-500/50 text-white';
            Icon = CheckCircle;
            iconColor = 'text-emerald-400';
            break;
        case QuestType.GRANDMASTER:
            styles = 'bg-amber-950/95 border-amber-500/50 text-amber-50 shadow-[0_0_30px_rgba(245,158,11,0.3)]';
            Icon = Star;
            iconColor = 'text-amber-400';
            label = 'Hero Quest Completed';
            break;
        case QuestType.DAILY:
            styles = 'bg-indigo-950/95 border-indigo-500/50 text-indigo-50';
            Icon = Repeat;
            iconColor = 'text-indigo-400';
            label = 'Daily Completed';
            break;
        case QuestType.SIDE:
            styles = 'bg-emerald-950/95 border-emerald-500/50 text-emerald-50';
            Icon = Sword;
            iconColor = 'text-emerald-400';
            label = 'Side Quest Completed';
            break;
        case QuestType.EVENT:
            styles = 'bg-purple-950/95 border-purple-500/50 text-purple-50';
            Icon = Sparkles;
            iconColor = 'text-purple-400';
            label = 'Event Completed';
            break;
        default:
            styles = 'bg-gray-900 border-gray-700 text-white';
            Icon = Info;
            iconColor = 'text-gray-400';
    }

    return (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 border px-4 py-3 rounded-lg shadow-2xl flex items-center gap-4 z-[100] min-w-[320px] max-w-[90vw] justify-between ${styles} ${animationClass}`}>
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full bg-black/20 ${iconColor}`}>
                    <Icon size={18} />
                </div>
                <div className="flex flex-col">
                    {label && <span className={`text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5`}>{label}</span>}
                    <span className="text-sm font-medium leading-tight">{message}</span>
                </div>
            </div>

            <div className={`flex items-center gap-3 pl-4 border-l ${type === 'default' ? 'border-gray-700' : 'border-white/20'}`}>
                {onUndo && (
                    <button
                        onClick={onUndo}
                        className="hover:bg-white/10 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition uppercase tracking-wide"
                    >
                        <RotateCcw size={12} /> Undo
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="opacity-60 hover:opacity-100 transition p-1"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default Toast;