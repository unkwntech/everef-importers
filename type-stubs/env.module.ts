namespace NodeJS {
    export interface ProcessEnv {
        LOG_WEBHOOK: string;
        REDIS_HOST: string;
        DB_HOST: string;
        DB_USER: string;
        DB_PASS: string;
        ZKILL_QUEUE_ID: string;
        MONGO_CONN_STRIG: string;
    }
}
