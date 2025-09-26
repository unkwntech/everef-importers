export interface IndustrySystemCostIndex {
    cost_index: number;
    activity: string;
}
export interface IndustrySystem {
    solar_system_id: number;
    cost_indices: IndustrySystemCostIndex[];
    date: Date;
}
