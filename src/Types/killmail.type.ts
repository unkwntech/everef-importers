interface killmail {
    killmail_id: number;
    killmail_time: Date;
    solar_system_id: number;
    victim: victim;
    hash: string;
}

interface victim {
    ship_type_id: number;
}
