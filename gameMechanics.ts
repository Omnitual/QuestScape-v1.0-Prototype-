
import { 
    UserStats, 
    TITLES, 
    ActivityLogEntry, 
    GameEvent, 
    QuestType, 
    Quest, 
    QuestDifficulty, 
    SideQuestTemplate, 
    EventTemplate, 
    GameSettings, 
    REWARD_MULTIPLIERS, 
    GameState 
} from './types';

// --- Constants ---
export const MAX_SIDE_QUESTS_ACTIVE = 5; 
export const MAX_DAILY_SIDE_ACCEPTS = 2; 
export const MAX_DAILY_REROLLS = 2;

// --- Helper Functions ---

export const calculateMaxXP = (level: number, modifier: number) => {
    return Math.floor(100 * Math.pow(modifier, level));
};

export const getTitleForLevel = (level: number) => {
    const index = Math.floor(level / 10);
    return TITLES[Math.min(index, TITLES.length - 1)];
};

export const getFormattedDate = (date: Date = new Date()) => {
    return date.toISOString().split('T')[0];
};

export const createLogEntry = (action: string, details: string): ActivityLogEntry => {
    return {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        formattedDate: new Date().toLocaleString(),
        action,
        details
    };
};

export const createGameEvent = (type: GameEvent['type'], message: string, payload?: any, questType?: QuestType): GameEvent => {
    return {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        message,
        payload,
        questType
    };
};

export const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const applyRngVariance = (base: number, variancePercent: number = 0.2): number => {
    const variance = base * variancePercent;
    const min = base - variance;
    const max = base + variance;
    return Math.floor(Math.random() * (max - min) + min);
};

export const getStreakMultiplier = (streak: number): number => {
    if (streak < 3) return 1.0;
    const baseBonus = 0.1;
    const growthPerDay = 0.1;
    const bonus = baseBonus + Math.max(0, streak - 3) * growthPerDay;
    return Math.min(1.5, 1.0 + bonus);
};

export const calculateTotalMultiplier = (stats: UserStats): number => {
    return getStreakMultiplier(stats.globalStreak || 0);
};

export const calculateGlobalStreak = (history: Record<string, boolean>): number => {
    let streak = 0;
    let checkDate = new Date();
    const todayStr = getFormattedDate(checkDate);
    if (!history[todayStr]) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
        const dateStr = getFormattedDate(checkDate);
        if (history[dateStr]) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
};

// --- Content Generation Logic ---

// Side Quest Generation with Risk Logic
export const generateDynamicSideQuests = (templates: SideQuestTemplate[], settings: GameSettings, count: number = 3): Quest[] => {
    if (!templates || templates.length === 0) return [];
    const shuffled = [...templates].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, count).map((template, idx) => {
        const baseQuantity = getRandomInt(template.min, template.max);
        const range = template.max - template.min;
        const progress = (baseQuantity - template.min) / (range || 1);
        const difficulty: QuestDifficulty = progress > 0.7 ? 'HARD' : progress > 0.3 ? 'MEDIUM' : 'EASY';
        const isRisk = Math.random() < settings.sideQuestRiskChance;
        const finalRisk = isRisk || difficulty === 'HARD';
        const multiplier = REWARD_MULTIPLIERS[difficulty];
        const finalQuantity = Math.ceil(baseQuantity * multiplier);
        const riskGoldBonus = finalRisk ? 6 : 0;
        const calcXP = Math.ceil(finalQuantity * template.unitXP * multiplier);
        const rawGoldValue = (finalQuantity * template.unitGold) + riskGoldBonus;
        const calcGold = Math.ceil(rawGoldValue * multiplier);
        const extraQP = Math.floor(progress * 2);
        const calcQP = Math.ceil(((template.baseQP || 1) + extraQP) * multiplier);

        const durationDays = getRandomInt(3, 7);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + durationDays);
        dueDate.setHours(23, 59, 59, 999);

        return {
            id: `sq-dyn-${Date.now()}-${idx}`,
            title: template.template.replace('{n}', finalQuantity.toString()),
            type: QuestType.SIDE,
            completed: false,
            xpReward: applyRngVariance(calcXP),
            goldReward: Math.max(1, applyRngVariance(calcGold)),
            qpReward: calcQP,
            createdAt: Date.now(),
            difficulty: difficulty,
            hasPenalty: finalRisk,
            isRisk: finalRisk,
            dueDate: dueDate.toISOString()
        };
    });
};

export const generateEventsFromPool = (templates: EventTemplate[], settings: GameSettings): Quest[] => {
    if (!templates) return [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const allowed = templates.filter(t => t.allowedDays.includes(dayOfWeek));
    const generated: Quest[] = [];

    allowed.forEach(t => {
        if (Math.random() < t.spawnChance) {
            generated.push({
                id: `evt-pool-${t.id}-${Date.now()}`,
                title: t.title,
                description: t.description,
                type: QuestType.EVENT,
                completed: false,
                xpReward: t.xpReward,
                goldReward: t.goldReward,
                qpReward: t.qpReward,
                createdAt: Date.now(),
                difficulty: 'MEDIUM',
                hasPenalty: false,
                dueDate: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
            });
        }
    });

    return generated;
};

// Internal function to handle the core "Day Transition" logic (failures + resets)
export const performDayTransition = (state: GameState): GameState => {
    const todayStr = new Date().toDateString();
    let activeQuests = [...state.quests];
    let newArchivedQuests = [...(state.archivedQuests || [])];

    // 1. Failure Check
    const riskyFailures = activeQuests.filter(q => {
        const isDaily = q.type === QuestType.DAILY;
        const isSide = q.type === QuestType.SIDE;
        if (q.completed) return false;
        if (q.hasPenalty || q.isRisk) {
            if (isDaily) return true;
            if (isSide) return true;
        }
        return false;
    });

    let newHistory = { ...state.stats.history };
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = getFormattedDate(yesterday);

    if (riskyFailures.length > 0) {
        if (!newHistory[dateKey]) {
            newHistory[dateKey] = { xp: 0, gold: 0, qp: 0, completed: 0, fails: 0, focusMinutes: 0 };
        }
        newHistory[dateKey].fails = riskyFailures.length;
    }

    // 2. Reset Dailies & Archive Old Quests
    const resetQuests = activeQuests.map(q => {
        if (q.type === QuestType.DAILY) {
            return { ...q, completed: false, dueDate: undefined };
        }
        newArchivedQuests.unshift(q);
        return null;
    }).filter(Boolean) as Quest[];

    // 3. Generate New Daily Content
    const newEvents = generateEventsFromPool(state.eventTemplates, state.settings);
    resetQuests.push(...newEvents);

    const logEntry = createLogEntry("DAY_TRANSITION", `Daily reset performed. ${riskyFailures.length} failures recorded.`);
    
    // Add event for reset
    const eventQueue = [...state.eventQueue, createGameEvent('SYSTEM_MESSAGE', "A new day begins. Dailies reset.")];

    return {
        ...state,
        stats: {
            ...state.stats,
            lastLoginDate: todayStr,
            dailyGold: 0,
            dailyXP: 0,
            dailyQP: 0,
            dailyQuestsCompleted: 0,
            dailyRerolls: 0,
            dailySideQuestsTaken: 0,
            history: newHistory,
            globalStreak: calculateGlobalStreak(state.stats.completionHistory)
        },
        quests: resetQuests,
        archivedQuests: newArchivedQuests,
        availableSideQuests: generateDynamicSideQuests(state.sideQuestTemplates, state.settings),
        sideQuestsChosenCount: 0,
        lastSideQuestGenDate: todayStr,
        activityLog: [...state.activityLog, logEntry],
        eventQueue
    };
};
