export interface FactionWarfareStats {
    faction_id: number;
    pilots: number;
    systems_controlled: number;
    victory_points: FactionWarfareStatsStatSummary;
    kills: FactionWarfareStatsStatSummary;
    date: Date;
}

export interface FactionWarfareStatsStatSummary {
    last_week: number;
    total: number;
    yesterday: number;
}
