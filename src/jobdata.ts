import Datasets from "./datasets";
import JobTypes from "./jobtypes";
import TimeSpan from "./Types/timespan.type";

export default interface JobData {
    Dataset: Datasets;
    JobType: JobTypes;
    Data: string;
}

export interface CollectJobData extends JobData {
    DateRange: TimeSpan;
    TargetJobType: JobTypes;
}
