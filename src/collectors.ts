import { Job, Queue } from "bullmq";
import Datasets from "./datasets";
import { CollectJobData } from "./jobdata";
import JobTypes from "./jobtypes";
import TimeSpan, { TimeSpecial } from "./Types/timespan.type";

let startDate = new Date();
startDate.setDate(startDate.getDate() - 730);
let endDate = new Date();

const DAILY = 1000 * 60 * 60 * 24;
const HOURLY = 1000 * 60 * 60;

let jobs: job[] = [
    {
        data: {
            Data: JobTypes.FW_STATS_BUNDLE.toString(),
            JobType: JobTypes.COLLECT,
            Dataset: Datasets.FWStats,
            TargetJobType: JobTypes.FW_STATS_BUNDLE,
            DateRange: {
                EndDate: TimeSpecial.TODAY,
                Duration: -7,
            } as TimeSpan,
        } as CollectJobData,
        interval: HOURLY * 2,
    },
    {
        data: {
            Data: JobTypes.INDUSTRY_SYSTEM_BUNDLE.toString(),
            JobType: JobTypes.COLLECT,
            Dataset: Datasets.IndustrySystems,
            TargetJobType: JobTypes.INDUSTRY_SYSTEM_BUNDLE,
            DateRange: {
                EndDate: TimeSpecial.TODAY,
                Duration: -7,
            } as TimeSpan,
        } as CollectJobData,
        interval: HOURLY * 2,
    },
    {
        data: {
            Data: JobTypes.MARKET_HISTORY_BUNDLE.toString(),
            JobType: JobTypes.COLLECT,
            Dataset: Datasets.MarketHistory,
            TargetJobType: JobTypes.MARKET_HISTORY_BUNDLE,
            DateRange: {
                EndDate: TimeSpecial.TODAY,
                Duration: -7,
            } as TimeSpan,
        } as CollectJobData,
        interval: HOURLY * 2,
    },
];

interface job {
    data: Job | CollectJobData;
    interval: number;
}
const COLLECTOR_QUEUE = "COLLECTOR";
const cQueue = new Queue(COLLECTOR_QUEUE, {
    connection: {
        host: "10.69.3.5",
        port: 6379,
    },
});

for (let j of jobs) {
    setInterval(() => {
        console.log(
            `Starting collector ${(j.data as CollectJobData).TargetJobType}`
        );
        cQueue.add("COLLECT", j.data);
    }, j.interval);
    console.log(
        `Starting collector ${(j.data as CollectJobData).TargetJobType}`
    );
    cQueue.add("COLLECT", j.data);
}
