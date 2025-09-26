import { Pool } from "pg";
import { MarketHistory } from "../Types/market_history.type";
import Utilities from "../utilities/utilities";

export default class MarketHistoryProcessor {
    public static readonly TableName = "market_history_test";
    private static _pool: Pool = new Pool({
        connectionString:
            "postgresql://eve_market:vAEtUHM8ZlkhMn9q@10.69.3.5/eve_market",
    });
    private static _isConnected: boolean = false;

    public static async Process(url: string): Promise<MarketHistory[]> {
        let date: Date = new Date(
            `${url.split("/")[5].split(".")[0].split("-").splice(2).join("-")}Z`
        );

        console.log(`Parse ${date}`);

        using disposer = new DisposableStack();
        let stream = disposer.adopt(await Utilities.DownloadAndExpandBZ2(url), () => {
            console.log("Disposing Stream");
        });
        let stringResult = await Utilities.StreamToString(stream);

        return Utilities.ParseCSV(stringResult);
    }

    public static async Insert(MarketHistory: MarketHistory[]): Promise<void> {
        const values: string[] = [];
        for (let mh of MarketHistory) {
            values.push(
                `('${new Date(mh.date).toISOString()}', ${mh.region_id}, ${
                    mh.type_id
                }, ${mh.average}, ${mh.highest}, ${mh.lowest}, ${mh.volume}, ${
                    mh.order_count
                }, '${mh.http_last_modified}')`
            );
        }
        if (!this._isConnected) {
            this._isConnected = true;
            this._pool.connect();
        }
        let qres = await this._pool.query(
            `INSERT INTO ${this.TableName} VALUES ${values.join(",")}`
        );
    }
    public static async DownloadAndInsert(url: string): Promise<void> {
        this.Insert(await this.Process(url));
    }
}
