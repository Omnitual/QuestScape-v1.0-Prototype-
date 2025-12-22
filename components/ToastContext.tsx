import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { QuestType } from '../types';
import Toast from './Toast';

interface ToastMessage {
    id: string;
    message: string;
    undoAction?: () => void;
    type: 'default' | 'success' | QuestType;
}

interface ToastContextType {
    showToast: (message: string, undoAction?: () => void, type?: 'default' | 'success' | QuestType) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
    const timerRef = useRef<number | null>(null);

    const hideToast = useCallback(() => {
        setActiveToast(null);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const showToast = useCallback((message: string, undoAction?: () => void, type: 'default' | 'success' | QuestType = 'default') => {
        // 1. Clear existing timer to prevent race conditions
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // 2. Immediate State Update (Last Write Wins strategy)
        setActiveToast({
            id: Date.now().toString(),
            message,
            undoAction,
            type
        });

        // 3. Set new timer
        timerRef.current = window.setTimeout(() => {
            setActiveToast(null);
        }, 5000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {activeToast && (
                <Toast
                    key={activeToast.id} // Key forces re-mount on rapid updates so animation replays
                    message={activeToast.message}
                    onUndo={activeToast.undoAction}
                    onClose={hideToast}
                    type={activeToast.type}
                />
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};