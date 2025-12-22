
import React, { useEffect } from 'react';
import { useGame } from '../store';
import { useToast } from './ToastContext';
import { GameEvent } from '../types';

const GameEventHandler: React.FC = () => {
    const { state, dispatch } = useGame();
    const { showToast } = useToast();

    useEffect(() => {
        if (state.eventQueue.length > 0) {
            // Process events sequentially (or just the first one if we want to throttle, but loop is better)
            state.eventQueue.forEach((event: GameEvent) => {
                
                // Determine Undo Action based on event payload
                let undoAction: (() => void) | undefined = undefined;

                if (event.type === 'QUEST_COMPLETED' && event.payload && event.payload.id) {
                    undoAction = () => dispatch({ type: 'TOGGLE_QUEST', payload: event.payload.id });
                } else if (event.payload && event.payload.undoType === 'RESTORE_QUEST') {
                    undoAction = () => dispatch({ type: 'RESTORE_QUEST', payload: event.payload.id });
                }

                // Map GameEventType to ToastType
                let toastType: 'default' | 'success' | any = 'default';
                if (event.type === 'QUEST_COMPLETED') {
                     // Pass through the specific QuestType if available (DAILY, SIDE, etc) for styling
                     toastType = event.questType || 'success';
                } else if (event.type === 'LEVEL_UP' || event.type === 'QUEST_ACCEPTED') {
                    toastType = 'success';
                }

                showToast(event.message, undoAction, toastType);
            });

            // Clear events after processing
            dispatch({ type: 'ACKNOWLEDGE_EVENTS' });
        }
    }, [state.eventQueue, dispatch, showToast]);

    return null; // Headless component
};

export default GameEventHandler;
