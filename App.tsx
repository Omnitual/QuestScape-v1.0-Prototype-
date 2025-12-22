
import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './store';
import { ToastProvider, useToast } from './components/ToastContext';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import PlayerBar from './components/PlayerBar';
import Navbar from './components/Navbar';
import QuestLog from './components/QuestLog';
import SettingsView from './components/SettingsView';
import { QuestModal } from './components/QuestModal';
import { Quest } from './types';
import GameEventHandler from './components/GameEventHandler';

const AppContent: React.FC = () => {
    const { state, dispatch } = useGame();
    // Removed useToast usage here as generic notifications are now handled by GameEventHandler or specialized components
    const [currentView, setCurrentView] = useState<'HOME' | 'JOURNAL' | 'SETTINGS'>('HOME');
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

    // Scroll to top on view change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentView]);

    if (!state.hasOnboarded) {
        return <Onboarding />;
    }

    const handleQuestDelete = (id: string) => {
        dispatch({ type: 'DELETE_QUEST', payload: id });
        // Toast handled by event bus now
    };

    const handleQuestToggle = (id: string) => {
        dispatch({ type: 'TOGGLE_QUEST', payload: id });
    };

    const handleQuestEditSave = (updatedData: Partial<Quest>) => {
        if (editingQuest) {
            dispatch({
                type: 'EDIT_QUEST',
                payload: { ...editingQuest, ...updatedData }
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            {/* The Event Handler sits here watching the store */}
            <GameEventHandler />
            
            <PlayerBar />

            {/* View Switcher */}
            {currentView === 'HOME' && (
                <Dashboard
                    onDelete={handleQuestDelete}
                    onEdit={setEditingQuest}
                    onToggle={handleQuestToggle}
                />
            )}
            {currentView === 'JOURNAL' && (
                <QuestLog
                    onDelete={handleQuestDelete}
                    onEdit={setEditingQuest}
                    onToggle={handleQuestToggle}
                />
            )}
            {currentView === 'SETTINGS' && <SettingsView />}

            <Navbar currentView={currentView} setView={setCurrentView} />

            {/* Global Edit Modal */}
            {editingQuest && (
                <QuestModal
                    type={editingQuest.type}
                    initialQuest={editingQuest}
                    onClose={() => setEditingQuest(null)}
                    onSave={handleQuestEditSave}
                    onDelete={handleQuestDelete}
                />
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <GameProvider>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </GameProvider>
    );
};

export default App;
