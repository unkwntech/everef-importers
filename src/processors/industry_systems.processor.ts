import { Pool } from "pg";
import Datasets from "../datasets";
import { IndustrySystem } from "../Types/industry_systems.type";
import Utilities from "../utilities/utilities";

export default class IndustrySystemsProcessor {
    public static readonly TableName = "system_index";
    private static _pool: Pool = new Pool({
        connectionString:
            "postgresql://eve_market:vAEtUHM8ZlkhMn9q@10.69.3.5/eve_market",
    });
    private static _isConnected: boolean = false;
    public static async Process(url: string): Promise<IndustrySystem[]> {
        let ts = url
            .split("/")[7]
            .split(".")[0]
            .replaceAll(
                Datasets.IndustrySystems.substring(
                    0,
                    Datasets.IndustrySystems.length - 1
                ),
                ""
            )
            .substring(1);
        let d = ts.split("_")[0];

        let t = ts.split("_")[1].replaceAll("-", ":");

        let date: Date = new Date(`${d} ${t}Z`);

        console.log(`Parse ${date}`);
        using disposer = new DisposableStack();
        let stream = disposer.adopt(await Utilities.DownloadAndExpandBZ2(url), () => {});
        return JSON.parse(await Utilities.StreamToString(stream)).map((x: IndustrySystem) => {
            x.date = date;
            return x;
        });
    }
    public static async Insert(
        industrySystems: IndustrySystem[]
    ): Promise<void> {
        const values: string[] = [];
        for (let is of industrySystems) {
            for (let index of is.cost_indices) {
                values.push(
                    `('${is.date.toISOString()}', ${is.solar_system_id}, ${
                        index.cost_index
                    }, '${index.activity}')`
                );
            }
        }
        if (!this._isConnected) {
            this._isConnected = true;
            this._pool.connect();
        }
        await this._pool.query(
            `INSERT INTO ${this.TableName} VALUES ${values.join(",")}`
        );
    }
    public static async DownloadAndInsert(url: string): Promise<void> {
        this.Insert(await this.Process(url));
    }
}
