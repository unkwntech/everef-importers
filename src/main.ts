import { Job, Queue, Worker } from "bullmq";
import Datasets from "./datasets";
import JobData, { CollectJobData } from "./jobdata";
import JobTypes from "./jobtypes";
import "./processors";
import CollectorProcessor from "./processors/collector.processor";
import FWStatsProcessor from "./processors/fwstats.processor";
import IndustrySystemsProcessor from "./processors/industry_systems.processor";
import MarketHistoryProcessor from "./processors/market_history.processor";
import { TimeSpecial } from "./Types/timespan.type";

const WORKER_QUEUE = "EVEREF_IMPORT_WORK";
const ESI_QUEUE = "EVEREF_IMPORT_ESI";

const workerFN = async (job: Job) => {
    const jobData: JobData = job.data as JobData;
    console.log(jobData.JobType);
    try {
        switch (jobData.JobType) {
            case JobTypes.COLLECT:
                //throw new Error("Not yet implmented;");
                let d = jobData as CollectJobData;

                let endDate: Date;
                if (d.DateRange.EndDate === TimeSpecial.TODAY)
                    endDate = new Date();
                else endDate = new Date(d.DateRange.EndDate);

                let startDate = new Date(endDate);
                if (d.DateRange.StartDate === TimeSpecial.TODAY) {
                    startDate = new Date();
                } else if (d.DateRange.StartDate) {
                    startDate = d.DateRange.StartDate;
                } else {
                    startDate.setDate(
                        startDate.getDate() + (d.DateRange.Duration || 0)
                    );
                }
                await CollectorProcessor.Collect(
                    jobData.Dataset,
                    d.TargetJobType,
                    startDate,
                    endDate
                );

                break;
            case JobTypes.KILLMAIL_BUNDLE:
                break;
            case JobTypes.INDUSTRY_SYSTEM_BUNDLE:
                await IndustrySystemsProcessor.DownloadAndInsert(jobData.Data);
                break;
            case JobTypes.MARKET_HISTORY_BUNDLE:
                await MarketHistoryProcessor.DownloadAndInsert(jobData.Data);
                break;
            case JobTypes.FW_STATS_BUNDLE:
                await FWStatsProcessor.DownloadAndInsert(jobData.Data);
                break;
            default:
                throw new Error(`${job.name} NOT YET IMPLEMENTED`);
        }
    } catch (e: any) {
        return false;
    }
    return true;
};

const queue = new Queue(WORKER_QUEUE, {
    connection: {
        host: "10.69.3.5",
        port: 6379,
    },
});
const worker = new Worker(WORKER_QUEUE, workerFN, {
    connection: {
        host: "10.69.3.5",
        port: 6379,
    },
    autorun: true,
    concurrency: 2,
    removeOnComplete: {
        age: 0,
        count: 0,
    },
});

let b = Worker;
let f = Datasets.CCP;
//let startDate = new Date("2025-01-01Z");
let startDate = new Date();
startDate.setMonth(startDate.getMonth() - 1);
let endDate = new Date();

const COLLECTOR_QUEUE = "COLLECTOR";
const cQueue = new Queue(COLLECTOR_QUEUE, {
    connection: {
        host: "10.69.3.5",
        port: 6379,
    },
});

const cWorker = new Worker(COLLECTOR_QUEUE, workerFN, {
    connection: {
        host: "10.69.3.5",
        port: 6379,
    },
    autorun: true,
    removeOnComplete: {
        age: 0,
        count: 0,
    },
});

// cQueue.add("COLLECT", {
//     Data: JobTypes.FW_STATS_BUNDLE.toString(),
//     JobType: JobTypes.COLLECT,
//     Dataset: Datasets.FWStats,
//     TargetJobType: JobTypes.FW_STATS_BUNDLE,
//     StartDate: startDate,
//     EndDate: endDate,
// } as CollectJobData);
// cQueue.add("COLLECT", {
//     Data: JobTypes.INDUSTRY_SYSTEM_BUNDLE.toString(),
//     JobType: JobTypes.COLLECT,
//     Dataset: Datasets.IndustrySystems,
//     TargetJobType: JobTypes.INDUSTRY_SYSTEM_BUNDLE,
//     StartDate: startDate,
//     EndDate: endDate,
// } as CollectJobData);
// cQueue.add("COLLECT", {
//     Data: JobTypes.MARKET_HISTORY_BUNDLE.toString(),
//     JobType: JobTypes.COLLECT,
//     Dataset: Datasets.MarketHistory,
//     TargetJobType: JobTypes.MARKET_HISTORY_BUNDLE,
//     StartDate: startDate,
//     EndDate: endDate,
// } as CollectJobData);

process.on("message", function (msg) {
    if (msg == "shutdown") {
        console.log("SHUTDOWN");
        process.exit(0);
    }
});
