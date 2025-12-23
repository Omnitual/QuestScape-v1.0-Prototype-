

export enum QuestType {
    GRANDMASTER = 'GRANDMASTER',
    DAILY = 'DAILY',
    SIDE = 'SIDE',
    EVENT = 'EVENT',
    FOCUS = 'FOCUS'
}

export enum DifficultyModifier {
    EASY = 1.1,
    NORMAL = 1.25,
    HARD = 1.5,
    EXTREME = 2.0
}

export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export const REWARD_MULTIPLIERS: Record<QuestDifficulty, number> = {
    EASY: 0.5,
    MEDIUM: 1.0,
    HARD: 2.0
};

export interface QuestStep {
    id: string;
    title: string;
    dueDate?: string;
    completed: boolean;
}

export interface Quest {
    id: string;
    title: string;
    description?: string;
    type: QuestType;
    completed: boolean;
    xpReward: number;
    goldReward: number;
    qpReward: number;
    createdAt: number;
    streak?: number; // Only for dailies
    dueDate?: string; // ISO Date string
    difficulty?: QuestDifficulty;
    hasPenalty?: boolean; // Main flag for "Fail Risk"
    isRisk?: boolean; // Legacy/Compat flag for "Risky" side quests
    progress?: number; // 0-100 for multi-stage quests
    steps?: QuestStep[]; // Detailed milestones
    // Focus Quest Specifics
    focusDurationMinutes?: number; // Target time (e.g., 45 mins)
    focusSecondsRemaining?: number; // Current state
}

export interface HistoryRecord {
    xp: number;
    gold: number;
    qp: number;
    completed: number;
    fails: number;
    focusMinutes: number; // New metric tracking
}

export interface ActivityLogEntry {
    id: string;
    timestamp: number;
    formattedDate: string;
    action: string;
    details: string;
}

export interface UserStats {
    name: string;
    level: number;
    currentXP: number;
    gold: number;
    questPoints: number;
    titles: string[];
    wakeUpTime: string | 'NA';
    xpModifier: DifficultyModifier;
    lastLoginDate: string;
    idealDays: number[]; // 0-6, Days user prefers for events
    // Lifetime Stats
    lifetimeGold: number;
    lifetimeXP: number;
    totalQuestsCompleted: number;
    focusScore: number; // New: Total minutes focused
    // Daily Progress Tracking
    dailyGold: number;
    dailyXP: number;
    dailyQP: number; // Added: Track daily QP gains
    dailyQuestsCompleted: number;
    dailyRerolls: number; // Track notice board rerolls (max 2)
    dailySideQuestsTaken: number; // New: Limit 2 per day
    // Global Streak Tracking
    globalStreak: number;
    completionHistory: Record<string, boolean>; // Key: YYYY-MM-DD
    history: Record<string, HistoryRecord>; // New Ledger for Graph
}

export interface SideQuestTemplate {
    id: string;
    template: string;
    min: number;
    max: number;
    unitXP: number;
    unitGold: number;
    baseQP: number;
    tags: string[];
}

export interface EventTemplate {
    id: string;
    title: string;
    description: string;
    allowedDays: number[]; // 0 (Sun) - 6 (Sat)
    spawnChance: number; // 0.0 - 1.0
    xpReward: number;
    goldReward: number;
    qpReward: number;
}

export interface FocusTemplate {
    id: string;
    title: string;
    duration: number; // minutes
}

export interface GameSettings {
    dailyFailPenalty: number; // Multiplier for fatigue
    sideQuestRiskChance: number; // 0.15 (15% chance)
}

// --- GAME EVENT SYSTEM ---
export type GameEventType = 
    | 'LEVEL_UP' 
    | 'QUEST_COMPLETED' 
    | 'QUEST_ACCEPTED' 
    | 'QUEST_REROLLED' 
    | 'SYSTEM_MESSAGE'
    | 'ACHIEVEMENT_UNLOCKED';

export interface GameEvent {
    id: string;
    type: GameEventType;
    message: string;
    payload?: any; // Flexible payload for undo actions or extra data
    questType?: QuestType;
}

export interface GameState {
    hasOnboarded: boolean;
    stats: UserStats;
    settings: GameSettings;
    quests: Quest[];
    archivedQuests: Quest[];
    availableSideQuests: Quest[];
    sideQuestsChosenCount: number;
    lastSideQuestGenDate: string;
    sideQuestTemplates: SideQuestTemplate[];
    eventTemplates: EventTemplate[];
    focusTemplates: FocusTemplate[]; // New Template Type
    activityLog: ActivityLogEntry[];
    eventQueue: GameEvent[]; // The centralized event bus
}

export const TITLES = [
    "The Awakened",
    "Novice Adventurer",
    "Apprentice of Order",
    "Journeyman of Focus",
    "Warrior of Will",
    "Knight of Routine",
    "Master of Discipline",
    "Grandmaster of Habits",
    "Legend of Productivity",
    "Demigod of Getting Things Done",
    "Ascended Entity"
];

// --- Dynamic Generation Templates (Defaults) ---
export const DEFAULT_SIDE_QUEST_TEMPLATES: Omit<SideQuestTemplate, 'id'>[] = [
    { template: "Do {n} Pushups", min: 5, max: 20, unitXP: 2, unitGold: 0.2, baseQP: 1, tags: ['FITNESS'] },
    { template: "Read {n} pages", min: 2, max: 10, unitXP: 5, unitGold: 1, baseQP: 1, tags: ['MIND'] },
    { template: "Declutter {n} items", min: 1, max: 5, unitXP: 5, unitGold: 1, baseQP: 1, tags: ['ORDER'] },
    { template: "Drink {n} glasses of water", min: 1, max: 4, unitXP: 2, unitGold: 0.1, baseQP: 1, tags: ['HEALTH'] },
    { template: "Walk {n}00 steps", min: 10, max: 50, unitXP: 1, unitGold: 0.1, baseQP: 1, tags: ['FITNESS'] },
    { template: "Write {n}00 words", min: 2, max: 10, unitXP: 4, unitGold: 0.5, baseQP: 2, tags: ['CREATIVITY'] },
];

export const DEFAULT_EVENT_TEMPLATES: Omit<EventTemplate, 'id'>[] = [
    {
        title: "Double XP Weekend",
        description: "The stars align for learning. All gains doubled.",
        allowedDays: [0, 6], // Sat, Sun
        spawnChance: 0.4,
        xpReward: 100,
        goldReward: 0,
        qpReward: 5
    }
];

export const DEFAULT_FOCUS_TEMPLATES: Omit<FocusTemplate, 'id'>[] = [
    { title: "Pomodoro Session", duration: 25 },
    { title: "Quick Reset", duration: 5 },
    { title: "Deep Work Block", duration: 60 },
    // Translated from Side Quests
    { title: "Mindfulness", duration: 10 },
    { title: "Deep Focus", duration: 45 },
    { title: "Morning Stretch", duration: 15 }
];

export const SIDE_QUEST_POOL: string[] = [];
export const EVENTS_POOL: any[] = [];