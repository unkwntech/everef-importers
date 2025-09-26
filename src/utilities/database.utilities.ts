import { Pool } from "pg";

export default class Database {
    public static _instance: Pool;
    public static GetInstance(): Pool {
        if (!this._instance) {
            this._instance = new Pool({
                connectionString:
                    "postgresql://eve_market:vAEtUHM8ZlkhMn9q@10.69.3.5/eve_market",
            });
        }

        return this._instance;
    }
}
