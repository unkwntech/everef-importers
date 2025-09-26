export interface MarketHistory {
    date: Date;
    type_id: number;
    region_id: number;
    average: number;
    highest: number;
    lowest: number;
    order_count: number;
    volume: number;
    http_last_modified: Date;
}
