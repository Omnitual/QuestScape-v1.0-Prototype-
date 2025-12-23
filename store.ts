

import React, { useReducer, useEffect, createContext, useContext, ReactNode } from 'react';
import { Quest, QuestType, GameState, DifficultyModifier, TITLES, DEFAULT_SIDE_QUEST_TEMPLATES, DEFAULT_EVENT_TEMPLATES, DEFAULT_FOCUS_TEMPLATES, SideQuestTemplate, EventTemplate, FocusTemplate, GameSettings } from './types';
import { 
    calculateMaxXP, 
    getTitleForLevel, 
    getFormattedDate, 
    createLogEntry, 
    createGameEvent, 
    calculateTotalMultiplier, 
    generateDynamicSideQuests, 
    performDayTransition, 
    MAX_SIDE_QUESTS_ACTIVE,
    MAX_FOCUS_QUESTS_ACTIVE,
    MAX_DAILY_SIDE_ACCEPTS, 
    MAX_DAILY_REROLLS, 
    calculateGlobalStreak 
} from './gameMechanics';

// --- Constants ---
const STORAGE_KEY = 'questlife_save_v2';

// --- Action Type Definition ---
type Action =
    | { type: 'INIT_SAVE' | 'IMPORT_DATA'; payload: any }
    | { type: 'COMPLETE_ONBOARDING'; payload: { name: string; wakeUpTime: string; xpModifier: number; firstQuest: string } }
    | { type: 'UPDATE_PROFILE'; payload: { name: string; wakeUpTime: string; idealDays: number[] } }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
    | { type: 'ADD_QUEST' | 'EDIT_QUEST'; payload: any }
    | { type: 'DELETE_QUEST' | 'RESTORE_QUEST' | 'PERMANENT_DELETE_QUEST' | 'TOGGLE_QUEST' | 'REROLL_NOTICE_BOARD_SLOT' | 'DELETE_SIDE_QUEST_TEMPLATE' | 'DELETE_EVENT_TEMPLATE' | 'DELETE_FOCUS_TEMPLATE'; payload: string }
    | { type: 'TOGGLE_QUEST_STEP'; payload: { questId: string; stepId: string } }
    | { type: 'UPDATE_QUEST_PROGRESS'; payload: { id: string; progress: number } }
    | { type: 'UPDATE_FOCUS_TIMER'; payload: { id: string; remainingSeconds: number } }
    | { type: 'ACCEPT_SIDE_QUEST'; payload: Quest }
    | { type: 'SAVE_SIDE_QUEST_TEMPLATE'; payload: SideQuestTemplate }
    | { type: 'SAVE_EVENT_TEMPLATE'; payload: EventTemplate }
    | { type: 'SAVE_FOCUS_TEMPLATE'; payload: FocusTemplate }
    | { type: 'TEST_ADD_XP' | 'TEST_ADD_GOLD'; payload: number }
    | { type: 'DAILY_RESET' | 'REFRESH_NOTICE_BOARD' | 'TEST_ADD_STREAK' | 'TEST_FAIL_ALL_QUESTS' | 'FULL_RESET' | 'ACKNOWLEDGE_EVENTS' };

// --- Initial State Factory ---
const getInitialState = (): GameState => {
    const sideQuestTemplates = DEFAULT_SIDE_QUEST_TEMPLATES.map((t, i) => ({ ...t, id: `sqt-${i}` }));
    const focusTemplates = DEFAULT_FOCUS_TEMPLATES.map((t, i) => ({ ...t, id: `foc-tmpl-${i}` }));
    const settings: GameSettings = {
        dailyFailPenalty: 0.75,
        sideQuestRiskChance: 0.15
    };
    
    // Auto-fill first daily quest
    const firstQuest: Quest = {
        id: `dq-init-${Date.now()}`,
        title: 'Complete my first daily task',
        type: QuestType.DAILY,
        completed: false,
        xpReward: 50,
        goldReward: 10,
        qpReward: 5,
        createdAt: Date.now(),
        streak: 0,
        difficulty: 'MEDIUM',
        hasPenalty: true
    };

    // --- Hero's Journey Setup ---
    const today = new Date();
    
    const day2 = new Date(today);
    day2.setDate(today.getDate() + 1);
    
    const day3 = new Date(today);
    day3.setDate(today.getDate() + 2);
    
    const day4 = new Date(today);
    day4.setDate(today.getDate() + 3);

    const onboardingHeroQuest: Quest = {
        id: `hq-awakening-${Date.now()}`,
        title: 'The Path of Awakening',
        description: 'Learn the ways of the system to become a true adventurer.',
        type: QuestType.GRANDMASTER,
        completed: false,
        xpReward: 500,
        goldReward: 100,
        qpReward: 25,
        createdAt: Date.now(),
        dueDate: day4.toISOString(),
        difficulty: 'EASY',
        progress: 0,
        steps: [
            { id: 's1', title: 'Accept & Complete a Side Quest', completed: false, dueDate: today.toISOString() },
            { id: 's2', title: 'Create a Custom Side Quest', completed: false, dueDate: day2.toISOString() },
            { id: 's3', title: 'View Lifetime Stats', completed: false, dueDate: day3.toISOString() },
            { id: 's4', title: 'Attend a World Event', completed: false, dueDate: day4.toISOString() }
        ]
    };

    return {
        hasOnboarded: false, // Re-enabled onboarding
        stats: {
            name: 'Adventurer', // Auto-filled
            level: 1,
            currentXP: 0,
            gold: 0,
            questPoints: 0,
            titles: [TITLES[0]],
            wakeUpTime: '08:00',
            xpModifier: DifficultyModifier.NORMAL,
            lastLoginDate: new Date().toDateString(),
            idealDays: [0, 1, 2, 3, 4, 5, 6],
            lifetimeGold: 0,
            lifetimeXP: 0,
            totalQuestsCompleted: 0,
            focusScore: 0,
            dailyGold: 0,
            dailyXP: 0,
            dailyQP: 0,
            dailyQuestsCompleted: 0,
            dailyRerolls: 0,
            dailySideQuestsTaken: 0,
            globalStreak: 0,
            completionHistory: {},
            history: {}
        },
        settings,
        quests: [onboardingHeroQuest, firstQuest],
        archivedQuests: [],
        availableSideQuests: generateDynamicSideQuests(sideQuestTemplates, settings, 3, focusTemplates),
        sideQuestsChosenCount: 0,
        lastSideQuestGenDate: new Date().toDateString(),
        sideQuestTemplates,
        eventTemplates: DEFAULT_EVENT_TEMPLATES.map((t, i) => ({ ...t, id: `evt-tmpl-${i}` })),
        focusTemplates,
        activityLog: [createLogEntry("AUTO_INIT", "Hero Adventurer initialized.")],
        eventQueue: [createGameEvent('SYSTEM_MESSAGE', "Welcome to QuestLife. Your journey is ready.")]
    };
};

// --- Reducer ---
const gameReducer = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'ACKNOWLEDGE_EVENTS':
            return { ...state, eventQueue: [] };

        case 'INIT_SAVE':
        case 'IMPORT_DATA':
            const initialState = getInitialState();
            const payload = action.payload;

            const mergedStats = { ...initialState.stats, ...(payload.stats || {}) };
            if (!mergedStats.history) mergedStats.history = {};
            if (mergedStats.idealDays === undefined) mergedStats.idealDays = [0, 1, 2, 3, 4, 5, 6];
            if (mergedStats.dailyRerolls === undefined) mergedStats.dailyRerolls = 0;
            if (mergedStats.dailyQP === undefined) mergedStats.dailyQP = 0;
            if (mergedStats.dailySideQuestsTaken === undefined) mergedStats.dailySideQuestsTaken = 0;
            if (mergedStats.focusScore === undefined) mergedStats.focusScore = 0;

            if ('activeBuffs' in mergedStats) delete (mergedStats as any).activeBuffs;

            const mergedSettings = { ...initialState.settings, ...(payload.settings || {}) };

            if ('globalBuffMultiplier' in mergedSettings) delete (mergedSettings as any).globalBuffMultiplier;
            if ('minDuration' in mergedSettings) delete (mergedSettings as any).minDuration;
            if ('maxDuration' in mergedSettings) delete (mergedSettings as any).maxDuration;

            const postImportState = {
                ...initialState,
                ...payload,
                stats: mergedStats,
                settings: mergedSettings,
                quests: payload.quests || [],
                archivedQuests: payload.archivedQuests || [],
                sideQuestTemplates: payload.sideQuestTemplates || initialState.sideQuestTemplates,
                eventTemplates: payload.eventTemplates || initialState.eventTemplates,
                focusTemplates: payload.focusTemplates || initialState.focusTemplates,
                availableSideQuests: payload.availableSideQuests || [],
                activityLog: payload.activityLog || [],
                eventQueue: [] // Always clean queue on load
            };

            return postImportState;

        case 'COMPLETE_ONBOARDING': {
            const { name, wakeUpTime, xpModifier, firstQuest } = action.payload;
            
            // Re-generate the hero quest with new dates/ids based on onboarding time
            const today = new Date();
            const day2 = new Date(today); day2.setDate(today.getDate() + 1);
            const day3 = new Date(today); day3.setDate(today.getDate() + 2);
            const day4 = new Date(today); day4.setDate(today.getDate() + 3);

            const heroQuest: Quest = {
                id: `hq-awakening-${Date.now()}`,
                title: 'The Path of Awakening',
                description: 'Learn the ways of the system to become a true adventurer.',
                type: QuestType.GRANDMASTER,
                completed: false,
                xpReward: 500,
                goldReward: 100,
                qpReward: 25,
                createdAt: Date.now(),
                dueDate: day4.toISOString(),
                difficulty: 'EASY',
                progress: 0,
                steps: [
                    { id: 's1', title: 'Accept & Complete a Side Quest', completed: false, dueDate: today.toISOString() },
                    { id: 's2', title: 'Create a Custom Side Quest', completed: false, dueDate: day2.toISOString() },
                    { id: 's3', title: 'View Lifetime Stats', completed: false, dueDate: day3.toISOString() },
                    { id: 's4', title: 'Attend a World Event', completed: false, dueDate: day4.toISOString() }
                ]
            };

            const initialQuest: Quest = {
                id: `dq-${Date.now()}`,
                title: firstQuest,
                type: QuestType.DAILY,
                completed: false,
                xpReward: 50,
                goldReward: 10,
                qpReward: 5,
                createdAt: Date.now(),
                streak: 0,
                difficulty: 'MEDIUM',
                hasPenalty: true
            };
            const log = createLogEntry("ONBOARDING_COMPLETE", `Hero ${name} awakened.`);
            return {
                ...state,
                hasOnboarded: true,
                stats: { ...state.stats, name, wakeUpTime, xpModifier },
                quests: [heroQuest, initialQuest],
                availableSideQuests: generateDynamicSideQuests(state.sideQuestTemplates, state.settings, 3, state.focusTemplates),
                lastSideQuestGenDate: new Date().toDateString(),
                activityLog: [...state.activityLog, log],
                eventQueue: [createGameEvent('SYSTEM_MESSAGE', `Welcome, ${name}. Your journey begins.`)]
            };
        }

        case 'UPDATE_PROFILE': {
            const log = createLogEntry("PROFILE_UPDATE", `Updated profile settings.`);
            return {
                ...state,
                stats: {
                    ...state.stats,
                    name: action.payload.name,
                    wakeUpTime: action.payload.wakeUpTime,
                    idealDays: action.payload.idealDays
                },
                activityLog: [...state.activityLog, log],
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Profile updated.")]
            };
        }

        case 'UPDATE_SETTINGS': {
            const log = createLogEntry("SETTINGS_UPDATE", `Game modifiers updated.`);
            return {
                ...state,
                settings: { ...state.settings, ...action.payload },
                activityLog: [...state.activityLog, log]
            };
        }

        case 'ADD_QUEST': {
            const enforcedQuest = { ...action.payload };
            if (enforcedQuest.type === QuestType.DAILY || enforcedQuest.difficulty === 'HARD') {
                enforcedQuest.hasPenalty = true;
                enforcedQuest.isRisk = true;
            }
            if (enforcedQuest.type === QuestType.GRANDMASTER) {
                const hasActiveGM = state.quests.some(q => q.type === QuestType.GRANDMASTER && !q.completed);
                if (hasActiveGM) return state;
            }
            const log = createLogEntry("QUEST_CREATED", `Created ${enforcedQuest.type} quest: "${enforcedQuest.title}"`);
            return {
                ...state,
                quests: [...state.quests, enforcedQuest],
                activityLog: [...state.activityLog, log]
            };
        }

        case 'EDIT_QUEST': {
            const enforcedQuest = { ...action.payload };
            if (enforcedQuest.type === QuestType.DAILY || enforcedQuest.difficulty === 'HARD') {
                enforcedQuest.hasPenalty = true;
                enforcedQuest.isRisk = true;
            }
            const log = createLogEntry("QUEST_EDITED", `Edited quest: "${enforcedQuest.title}"`);
            return {
                ...state,
                quests: state.quests.map(q => q.id === enforcedQuest.id ? enforcedQuest : q),
                activityLog: [...state.activityLog, log]
            };
        }

        case 'DELETE_QUEST': {
            const questToArchive = state.quests.find(q => q.id === action.payload);
            if (!questToArchive) return state;
            const log = createLogEntry("QUEST_ARCHIVED", `Moved to trash: "${questToArchive.title}"`);
            const undoEvent = createGameEvent('SYSTEM_MESSAGE', "Quest moved to archive.", { undoType: 'RESTORE_QUEST', id: action.payload });
            
            return {
                ...state,
                quests: state.quests.filter(q => q.id !== action.payload),
                archivedQuests: [questToArchive, ...(state.archivedQuests || [])],
                activityLog: [...state.activityLog, log],
                eventQueue: [...state.eventQueue, undoEvent]
            };
        }

        case 'RESTORE_QUEST': {
            const questToRestore = state.archivedQuests.find(q => q.id === action.payload);
            if (!questToRestore) return state;
            const log = createLogEntry("QUEST_RESTORED", `Restored from trash: "${questToRestore.title}"`);
            return {
                ...state,
                archivedQuests: state.archivedQuests.filter(q => q.id !== action.payload),
                quests: [...state.quests, questToRestore],
                activityLog: [...state.activityLog, log],
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Quest restored.")]
            };
        }

        case 'PERMANENT_DELETE_QUEST': {
            const q = state.archivedQuests.find(x => x.id === action.payload);
            const log = createLogEntry("QUEST_DELETED_FOREVER", `Permanently deleted: "${q?.title || 'Unknown'}"`);
            return {
                ...state,
                archivedQuests: state.archivedQuests.filter(q => q.id !== action.payload),
                activityLog: [...state.activityLog, log]
            };
        }

        case 'TOGGLE_QUEST': {
            const questIndex = state.quests.findIndex(q => q.id === action.payload);
            if (questIndex === -1) return state;

            const quest = state.quests[questIndex];

            if (quest.type === QuestType.GRANDMASTER && !quest.completed) {
                if (quest.steps && quest.steps.some(s => !s.completed)) return state;
            }

            const isCompleting = !quest.completed;
            let newStats = { ...state.stats };
            let newHistory = { ...(newStats.history || {}) };
            const todayKey = getFormattedDate();
            let newEventQueue = [...state.eventQueue];

            if (!newHistory[todayKey]) {
                newHistory[todayKey] = { xp: 0, gold: 0, qp: 0, completed: 0, fails: 0, focusMinutes: 0 };
            }

            const totalMultiplier = calculateTotalMultiplier(state.stats);
            const adjustedXP = Math.floor(quest.xpReward * totalMultiplier);
            const adjustedGold = Math.floor(quest.goldReward * totalMultiplier);

            const log = createLogEntry(
                isCompleting ? "QUEST_COMPLETED" : "QUEST_UNCOMPLETED",
                `${isCompleting ? 'Completed' : 'Unchecked'} quest: "${quest.title}"`
            );

            if (isCompleting) {
                newStats.currentXP += adjustedXP;
                newStats.gold += adjustedGold;
                newStats.questPoints += quest.qpReward;

                newStats.lifetimeXP = (newStats.lifetimeXP || 0) + adjustedXP;
                newStats.lifetimeGold = (newStats.lifetimeGold || 0) + adjustedGold;
                newStats.totalQuestsCompleted = (newStats.totalQuestsCompleted || 0) + 1;

                newStats.dailyXP = (newStats.dailyXP || 0) + adjustedXP;
                newStats.dailyGold = (newStats.dailyGold || 0) + adjustedGold;
                newStats.dailyQP = (newStats.dailyQP || 0) + quest.qpReward;
                newStats.dailyQuestsCompleted = (newStats.dailyQuestsCompleted || 0) + 1;

                newHistory[todayKey].xp += adjustedXP;
                newHistory[todayKey].gold += adjustedGold;
                newHistory[todayKey].qp += quest.qpReward;
                newHistory[todayKey].completed += 1;

                if (quest.type === QuestType.FOCUS && quest.focusDurationMinutes) {
                    newStats.focusScore = (newStats.focusScore || 0) + quest.focusDurationMinutes;
                    newHistory[todayKey].focusMinutes = (newHistory[todayKey].focusMinutes || 0) + quest.focusDurationMinutes;
                }

                let maxXP = calculateMaxXP(newStats.level, newStats.xpModifier);
                let leveledUp = false;
                
                while (newStats.currentXP >= maxXP) {
                    newStats.level += 1;
                    newStats.currentXP -= maxXP;
                    leveledUp = true;
                    maxXP = calculateMaxXP(newStats.level, newStats.xpModifier);
                    
                    const newTitle = getTitleForLevel(newStats.level);
                    if (!newStats.titles.includes(newTitle)) {
                        newStats.titles.push(newTitle);
                    }
                }

                if (leveledUp) {
                    newEventQueue.push(createGameEvent('LEVEL_UP', `Level Up! You are now level ${newStats.level}.`));
                }

                newEventQueue.push(createGameEvent(
                    'QUEST_COMPLETED', 
                    `+${adjustedXP} XP  +${adjustedGold}g`, 
                    { id: quest.id, xp: adjustedXP, gold: adjustedGold }, 
                    quest.type
                ));

            } else {
                newStats.currentXP = Math.max(0, newStats.currentXP - adjustedXP);
                newStats.gold = Math.max(0, newStats.gold - adjustedGold);
                newStats.questPoints = Math.max(0, newStats.questPoints - quest.qpReward);

                newStats.lifetimeXP = Math.max(0, (newStats.lifetimeXP || 0) - adjustedXP);
                newStats.lifetimeGold = Math.max(0, (newStats.lifetimeGold || 0) - adjustedGold);
                newStats.totalQuestsCompleted = Math.max(0, (newStats.totalQuestsCompleted || 0) - 1);

                newStats.dailyXP = Math.max(0, (newStats.dailyXP || 0) - adjustedXP);
                newStats.dailyGold = Math.max(0, (newStats.dailyGold || 0) - adjustedGold);
                newStats.dailyQP = Math.max(0, (newStats.dailyQP || 0) - quest.qpReward);
                newStats.dailyQuestsCompleted = Math.max(0, (newStats.dailyQuestsCompleted || 0) - 1);

                newHistory[todayKey].xp = Math.max(0, newHistory[todayKey].xp - adjustedXP);
                newHistory[todayKey].gold = Math.max(0, newHistory[todayKey].gold - adjustedGold);
                newHistory[todayKey].qp = Math.max(0, newHistory[todayKey].qp - quest.qpReward);
                newHistory[todayKey].completed = Math.max(0, newHistory[todayKey].completed - 1);

                if (quest.type === QuestType.FOCUS && quest.focusDurationMinutes) {
                    newStats.focusScore = Math.max(0, (newStats.focusScore || 0) - quest.focusDurationMinutes);
                    newHistory[todayKey].focusMinutes = Math.max(0, (newHistory[todayKey].focusMinutes || 0) - quest.focusDurationMinutes);
                }
            }

            newStats.history = newHistory;

            let newQuestStreak = quest.streak || 0;
            if (quest.type === QuestType.DAILY) {
                if (isCompleting) newQuestStreak += 1;
                else newQuestStreak = Math.max(0, newQuestStreak - 1);
            }

            const updatedQuests = [...state.quests];
            updatedQuests[questIndex] = {
                ...quest,
                completed: isCompleting,
                streak: newQuestStreak,
                progress: isCompleting ? 100 : quest.progress,
                steps: quest.steps?.map(s => ({ ...s, completed: isCompleting }))
            };

            const allDailies = updatedQuests.filter(q => q.type === QuestType.DAILY);
            const allDailiesCompleted = allDailies.length > 0 && allDailies.every(q => q.completed);
            const completionHistory = { ...(newStats.completionHistory || {}) };
            const todayStr = getFormattedDate();

            if (allDailiesCompleted) completionHistory[todayStr] = true;
            else delete completionHistory[todayStr];

            newStats.completionHistory = completionHistory;
            newStats.globalStreak = calculateGlobalStreak(completionHistory);

            return { 
                ...state, 
                stats: newStats, 
                quests: updatedQuests, 
                activityLog: [...state.activityLog, log],
                eventQueue: newEventQueue 
            };
        }

        case 'TOGGLE_QUEST_STEP': {
            const { questId, stepId } = action.payload;
            const questIndex = state.quests.findIndex(q => q.id === questId);
            if (questIndex === -1) return state;

            const quest = state.quests[questIndex];
            const stepIndex = quest.steps?.findIndex(s => s.id === stepId) ?? -1;
            if (stepIndex === -1) return state;

            const targetStep = quest.steps![stepIndex];
            const isCompleting = !targetStep.completed;

            if (isCompleting && stepIndex > 0) {
                const previousStep = quest.steps![stepIndex - 1];
                if (!previousStep.completed) return state;
            }

            const updatedSteps = quest.steps!.map((s, idx) => {
                if (idx === stepIndex) return { ...s, completed: isCompleting };
                if (!isCompleting && idx > stepIndex && s.completed) {
                    return { ...s, completed: false };
                }
                return s;
            });

            if (quest.completed && !isCompleting) return state;

            const completedCount = updatedSteps.filter(s => s.completed).length;
            const newProgress = Math.floor((completedCount / updatedSteps.length) * 100);

            const updatedQuests = [...state.quests];
            updatedQuests[questIndex] = { ...quest, steps: updatedSteps, progress: newProgress };

            let newEvents = [...state.eventQueue];
            if (isCompleting) {
                newEvents.push(createGameEvent('SYSTEM_MESSAGE', `Step Complete: ${targetStep.title}`, null, undefined));
            }

            return { ...state, quests: updatedQuests, eventQueue: newEvents };
        }

        case 'UPDATE_QUEST_PROGRESS': {
            const questIndex = state.quests.findIndex(q => q.id === action.payload.id);
            if (questIndex === -1) return state;
            const updatedQuests = [...state.quests];
            updatedQuests[questIndex] = { ...state.quests[questIndex], progress: action.payload.progress };
            return { ...state, quests: updatedQuests };
        }

        case 'UPDATE_FOCUS_TIMER': {
            const questIndex = state.quests.findIndex(q => q.id === action.payload.id);
            if (questIndex === -1) return state;
            const updatedQuests = [...state.quests];
            updatedQuests[questIndex] = {
                ...updatedQuests[questIndex],
                focusSecondsRemaining: action.payload.remainingSeconds
            };
            return { ...state, quests: updatedQuests };
        }

        case 'ACCEPT_SIDE_QUEST': {
            const acceptedQuest = action.payload;
            
            // Limit Checks
            if (acceptedQuest.type === QuestType.SIDE) {
                 const activeSideQuests = state.quests.filter(q => q.type === QuestType.SIDE && !q.completed).length;
                 if (activeSideQuests >= MAX_SIDE_QUESTS_ACTIVE) return state;
                 if ((state.stats.dailySideQuestsTaken || 0) >= MAX_DAILY_SIDE_ACCEPTS) return state;
            } else if (acceptedQuest.type === QuestType.FOCUS) {
                 const activeFocusQuests = state.quests.filter(q => q.type === QuestType.FOCUS && !q.completed).length;
                 if (activeFocusQuests >= MAX_FOCUS_QUESTS_ACTIVE) return state;
            }

            const log = createLogEntry("QUEST_ACCEPTED", `Accepted ${acceptedQuest.type}: "${acceptedQuest.title}"`);
            
            // Generate replacement logic
            // Note: We need to pass focusTemplates here to mix them in, similar to init/reset
            const replacements = generateDynamicSideQuests(state.sideQuestTemplates, state.settings, 1, state.focusTemplates);
            const replacement = replacements.length > 0 ? replacements[0] : null;
            if (replacement) replacement.id = `rep-${Date.now()}`;

            let newAvailable = state.availableSideQuests.filter(q => q.id !== acceptedQuest.id);
            if (replacement) newAvailable = [...newAvailable, replacement];

            return {
                ...state,
                stats: {
                    ...state.stats,
                    // Only increment counter for Side Quests, not Focus sessions (Time Chambers are generally repeatable tools)
                    dailySideQuestsTaken: acceptedQuest.type === QuestType.SIDE 
                        ? (state.stats.dailySideQuestsTaken || 0) + 1 
                        : state.stats.dailySideQuestsTaken
                },
                quests: [...state.quests, acceptedQuest],
                availableSideQuests: newAvailable,
                sideQuestsChosenCount: state.sideQuestsChosenCount + 1,
                activityLog: [...state.activityLog, log],
                eventQueue: [...state.eventQueue, createGameEvent('QUEST_ACCEPTED', `Accepted: ${acceptedQuest.title}`)]
            };
        }

        case 'REROLL_NOTICE_BOARD_SLOT': {
            const questId = action.payload;
            if ((state.stats.dailyRerolls || 0) >= MAX_DAILY_REROLLS) return state;
            const questToSwap = state.availableSideQuests.find(q => q.id === questId);
            if (!questToSwap) return state;
            const rerollCost = (questToSwap.isRisk || questToSwap.hasPenalty) ? 30 : 15;
            if (state.stats.gold < rerollCost) return state;

            // Generate replacement
            const replacements = generateDynamicSideQuests(state.sideQuestTemplates, state.settings, 1, state.focusTemplates);
            const replacement = replacements.length > 0 ? replacements[0] : null;
            if (!replacement) return state;
            replacement.id = `reroll-${Date.now()}`;

            const newAvailable = state.availableSideQuests.map(q => q.id === questId ? replacement : q);
            const log = createLogEntry("REROLL_NOTICE_BOARD", `Rerolled quest "${questToSwap.title}" for ${rerollCost}g`);

            return {
                ...state,
                stats: {
                    ...state.stats,
                    gold: state.stats.gold - rerollCost,
                    dailyRerolls: (state.stats.dailyRerolls || 0) + 1
                },
                availableSideQuests: newAvailable,
                activityLog: [...state.activityLog, log],
                eventQueue: [...state.eventQueue, createGameEvent('QUEST_REROLLED', "Quest rerolled.")]
            };
        }

        case 'SAVE_SIDE_QUEST_TEMPLATE': {
            const exists = state.sideQuestTemplates.find(t => t.id === action.payload.id);
            const newTemplates = exists
                ? state.sideQuestTemplates.map(t => t.id === action.payload.id ? action.payload : t)
                : [...state.sideQuestTemplates, action.payload];
            return { 
                ...state, 
                sideQuestTemplates: newTemplates,
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Template saved.")] 
            };
        }

        case 'DELETE_SIDE_QUEST_TEMPLATE':
            return { 
                ...state, 
                sideQuestTemplates: state.sideQuestTemplates.filter(t => t.id !== action.payload),
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Template deleted.")]
            };

        case 'SAVE_EVENT_TEMPLATE': {
            const exists = state.eventTemplates.find(t => t.id === action.payload.id);
            const newTemplates = exists
                ? state.eventTemplates.map(t => t.id === action.payload.id ? action.payload : t)
                : [...state.eventTemplates, action.payload];
            return { 
                ...state, 
                eventTemplates: newTemplates,
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Event saved.")]
            };
        }

        case 'DELETE_EVENT_TEMPLATE':
            return { 
                ...state, 
                eventTemplates: state.eventTemplates.filter(t => t.id !== action.payload),
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Event deleted.")]
            };

        case 'SAVE_FOCUS_TEMPLATE': {
            const exists = state.focusTemplates.find(t => t.id === action.payload.id);
            const newTemplates = exists
                ? state.focusTemplates.map(t => t.id === action.payload.id ? action.payload : t)
                : [...state.focusTemplates, action.payload];
            return { 
                ...state, 
                focusTemplates: newTemplates,
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Focus template saved.")]
            };
        }

        case 'DELETE_FOCUS_TEMPLATE':
            return { 
                ...state, 
                focusTemplates: state.focusTemplates.filter(t => t.id !== action.payload),
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Focus template deleted.")]
            };

        case 'DAILY_RESET': {
            const today = new Date().toDateString();
            if (state.lastSideQuestGenDate === today) return state;
            return performDayTransition(state);
        }

        case 'REFRESH_NOTICE_BOARD': {
            const log = createLogEntry("DEBUG_REFRESH_BOARD", "Debug: Notice board refreshed.");
            return {
                ...state,
                availableSideQuests: generateDynamicSideQuests(state.sideQuestTemplates, state.settings, 3, state.focusTemplates),
                sideQuestsChosenCount: 0,
                activityLog: [...state.activityLog, log],
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Board refreshed.")]
            };
        }

        case 'TEST_ADD_XP': {
            let newStats = { ...state.stats };
            newStats.currentXP += action.payload;
            newStats.lifetimeXP = (newStats.lifetimeXP || 0) + action.payload;
            
            let maxXP = calculateMaxXP(newStats.level, newStats.xpModifier);
            let leveledUp = false;
            while (newStats.currentXP >= maxXP) {
                newStats.level += 1;
                newStats.currentXP -= maxXP;
                leveledUp = true;
                maxXP = calculateMaxXP(newStats.level, newStats.xpModifier);
            }
            
            let events = [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', `Added ${action.payload} XP`)];
            if (leveledUp) {
                events.push(createGameEvent('LEVEL_UP', `Level Up! Level ${newStats.level}`));
            }

            return { ...state, stats: newStats, eventQueue: events };
        }

        case 'TEST_ADD_GOLD':
            return { 
                ...state, 
                stats: { ...state.stats, gold: state.stats.gold + action.payload, lifetimeGold: (state.stats.lifetimeGold || 0) + action.payload },
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', `Added ${action.payload} Gold`)]
            };

        case 'TEST_ADD_STREAK': {
            const payloadDays = 3;
            const newHistory = { ...state.stats.completionHistory };
            let check = new Date();
            if (!newHistory[getFormattedDate(check)]) check.setDate(check.getDate() - 1);
            while (newHistory[getFormattedDate(check)]) check.setDate(check.getDate() - 1);
            for (let i = 0; i < payloadDays; i++) {
                newHistory[getFormattedDate(check)] = true;
                check.setDate(check.getDate() - 1);
            }
            return { 
                ...state, 
                stats: { ...state.stats, completionHistory: newHistory, globalStreak: calculateGlobalStreak(newHistory) },
                eventQueue: [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Streak boosted.")]
            };
        }

        case 'TEST_FAIL_ALL_QUESTS': {
            const afterTransition = performDayTransition(state);
            return {
                ...afterTransition,
                stats: {
                    ...afterTransition.stats,
                    globalStreak: 0,
                    completionHistory: {}
                },
                eventQueue: [...afterTransition.eventQueue, createGameEvent('SYSTEM_MESSAGE', "Forced Fail triggered.")]
            };
        }

        case 'FULL_RESET':
            return {
                ...state,
                ...getInitialState(),
                sideQuestTemplates: getInitialState().sideQuestTemplates,
                eventTemplates: getInitialState().eventTemplates,
                focusTemplates: getInitialState().focusTemplates,
                eventQueue: [createGameEvent('SYSTEM_MESSAGE', "System Reset Complete.")]
            };

        default:
            return state;
    }
};

// --- Context ---
interface GameContextType {
    state: GameState;
    dispatch: React.Dispatch<Action>;
    maxXP: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, null, getInitialState);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                dispatch({ type: 'INIT_SAVE', payload: parsed });
                const today = new Date().toDateString();
                if (parsed.stats.lastLoginDate !== today) {
                    dispatch({ type: 'DAILY_RESET' });
                }
            } catch (e) {
                console.error("Failed to load save", e);
            }
        }
    }, []);

    // --- Persistence Throttling (Debounce) ---
    useEffect(() => {
        // Wait 1 second after last state change before saving to disk
        const timeoutId = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }, 1000);

        // Cleanup: If state changes again before 1s, clear timeout and restart it
        return () => clearTimeout(timeoutId);
    }, [state]);

    const maxXP = calculateMaxXP(state.stats.level, state.stats.xpModifier);

    return React.createElement(GameContext.Provider, { value: { state, dispatch, maxXP } }, children);
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within GameProvider");
    return context;
};