import { Pool } from "pg";
import { FactionWarfareStats } from "../Types/fw_stats.type";
import Utilities from "../utilities/utilities";

export default class FWStatsProcessor {
    public static readonly TableName = "factionwarfare_stats";
    private static _pool: Pool = new Pool({
        connectionString:
            "postgresql://eve_market:vAEtUHM8ZlkhMn9q@10.69.3.5/eve_market",
    });
    private static _isConnected: boolean = false;

    public static async Process(url: string): Promise<FactionWarfareStats[]> {
        let date: Date = new Date(
            `${url
                .split("/")[7]
                .split(".")[0]
                .split("_")[0]
                .split("-")
                .splice(3, 3)
                .join("-")}Z`
        );

        console.log(`Parse ${date}`);

        return JSON.parse(
            await Utilities.StreamToString(
                await Utilities.DownloadAndExpandBZ2(url)
            )
        ).map((f: FactionWarfareStats) => {
            f.date = date;
            return f;
        });
    }

    public static async Insert(
        FactionWarfareStats: FactionWarfareStats[]
    ): Promise<void> {
        const values: string[] = [];
        for (let fws of FactionWarfareStats) {
            values.push(
                `(${fws.faction_id}, ${fws.pilots}, ${
                    fws.systems_controlled
                }, ${fws.victory_points.last_week}, ${
                    fws.victory_points.total
                }, ${fws.victory_points.yesterday}, ${fws.kills.last_week}, ${
                    fws.kills.total
                }, ${fws.kills.yesterday}, '${fws.date.toISOString()}')`
            );
        }
        if (!this._isConnected) {
            this._isConnected = true;
            this._pool.connect();
        }
        try {
            let qres = await this._pool.query(
                `INSERT INTO ${this.TableName} VALUES ${values.join(",")}`
            );
        } catch (e) {
            console.error(e);
        }
    }
    public static async DownloadAndInsert(url: string): Promise<void> {
        this.Insert(await this.Process(url));
    }
}
