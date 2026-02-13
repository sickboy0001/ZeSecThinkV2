export type HabitItem = {
    id: number;
    name: string;
    short_name?: string;
    description?: string;
    parent_flag: boolean;
    visible_flag: boolean;
    item_style?: {
        color?: string;
        icon?: string;
    };
};

export type HabitTree = {
    item_id: number;
    parent_id: number | null;
    order_no: number;
};

export type HabitLog = {
    id: number;
    item_id: number;
    done_at: string;
    comment?: string;
};

export const MOCK_CATEGORIES: HabitItem[] = [
    { id: 1, name: "運動", parent_flag: true, visible_flag: true, item_style: { color: "blue", icon: "activity" } },
    { id: 2, name: "学習", parent_flag: true, visible_flag: true, item_style: { color: "green", icon: "book" } },
    { id: 3, name: "余暇", parent_flag: true, visible_flag: true, item_style: { color: "orange", icon: "coffee" } },
];

export const MOCK_ITEMS: HabitItem[] = [
    { id: 101, name: "階段利用", short_name: "階段", parent_flag: false, visible_flag: true },
    { id: 102, name: "ランニング", short_name: "走る", parent_flag: false, visible_flag: true },
    { id: 103, name: "スクワット", short_name: "スクワット", parent_flag: false, visible_flag: true },
    { id: 201, name: "Schoo", parent_flag: false, visible_flag: true },
    { id: 202, name: "Audible", parent_flag: false, visible_flag: true },
    { id: 301, name: "飲み", parent_flag: false, visible_flag: true },
    { id: 302, name: "外食", parent_flag: false, visible_flag: true },
];

export const MOCK_TREES: HabitTree[] = [
    { item_id: 1, parent_id: null, order_no: 1 },
    { item_id: 2, parent_id: null, order_no: 2 },
    { item_id: 3, parent_id: null, order_no: 3 },
    { item_id: 101, parent_id: 1, order_no: 1 },
    { item_id: 102, parent_id: 1, order_no: 2 },
    { item_id: 103, parent_id: 1, order_no: 3 },
    { item_id: 201, parent_id: 2, order_no: 1 },
    { item_id: 202, parent_id: 2, order_no: 2 },
    { item_id: 301, parent_id: 3, order_no: 1 },
    { item_id: 302, parent_id: 3, order_no: 2 },
];

export const MOCK_LOGS: HabitLog[] = [
    { id: 1, item_id: 101, done_at: new Date().toISOString() },
    { id: 2, item_id: 201, done_at: new Date().toISOString() },
];
