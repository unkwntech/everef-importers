import axios from "axios";
import { Queue } from "bullmq";
import { parse } from "node-html-parser";
import { Pool } from "pg";
import Datasets from "../datasets";
import JobData from "../jobdata";
import JobTypes from "../jobtypes";
import Utilities from "../utilities/utilities";

export default class CollectorProcessor {
    private static _pool: Pool = new Pool({
        connectionString:
            "postgresql://eve_market:vAEtUHM8ZlkhMn9q@10.69.3.5/eve_market",
    });
    private static _isConnected: boolean = false;
    public static async Collect(
        dataset: Datasets,
        targetJobType: JobTypes,
        startDate: Date = new Date("2003-02-01Z"),
        endDate: Date = new Date()
    ): Promise<void> {
        console.log(`Collecting ${dataset}`);
        let files = await this.ListFiles(
            `https://data.everef.net/${dataset}`,
            startDate,
            endDate
        );
        console.log(`${files.length} files collected.`);
        let queueCount = 0;

        let res = await this._pool.query(
            `SELECT import_timestamp, url FROM import_meta WHERE dataset = '${dataset}'`
        );
        let metadata = res.rows;
        for await (let file of files) {
            let job: JobData = {
                Dataset: dataset,
                JobType: targetJobType,
                Data: file.URL,
            };

            //lookup metadata before insert

            if (!this._isConnected) {
                this._isConnected = true;
                this._pool.connect();
            }

            let meta = metadata.find(
                (m) =>
                    m.url === file.URL && file.LastModified < m.import_timestamp
            );

            if (meta) {
                //file metadata exists
                continue;
            }

            const queue = new Queue("EVEREF_IMPORT_WORK", {
                connection: {
                    host: "10.69.3.5",
                    port: 6379,
                },
            });
            queue.add("BUNDLE", job);
            queueCount++;
            await this._pool.query(
                `INSERT INTO import_meta VALUES ('${dataset}', '${file.LastModified.toISOString()}', '${new Date().toISOString()}', '${
                    file.URL
                }')`
            );
        }

        console.log(`${queueCount} Jobs Queued`);
        if (queueCount > 0)
            await axios.post(
                `https://discord.com/api/webhooks/1417574479118205162/bpClI_udJs2Xpsf47KH45bgMVjoJpY8ntDIN2Z1EECw9ynPUfa4YHVEWsQgHmdR-k7iJ`,
                {
                    content: `Queued ${queueCount} of ${
                        files.length
                    } possible files for ${dataset.substring(
                        0,
                        dataset.length - 1
                    )} job.`,
                }
            );
        return;
    }

    public static async ListFiles(
        url: string,
        startDate: Date = new Date("2003-03-01Z"),
        endDate: Date = new Date()
    ): Promise<EveRefFile[]> {
        let files: EveRefFile[] = [];
        //console.log(`Listing ${url}`);

        let [inRange, date] = Utilities.FileDateInRange(
            url,
            startDate,
            endDate
        );
        //skip if folder is not in suitable range
        if (!inRange && date > new Date(0)) {
            return [];
        }

        let data = await axios.get(url).then((res) => res.data);

        let html = parse(
            data.replaceAll("<pre>", "").replaceAll("</pre>", "").trim()
        );

        for (let e of html.querySelectorAll(".data-file")) {
            let file = {
                URL: `https://data.everef.net${e
                    .querySelector(".data-file-url")
                    ?.getAttribute("href")}`,
                Filename: e.querySelectorAll(".data-file-url")[0].textContent,
                Size: parseInt(
                    e
                        .querySelectorAll(".data-file-size-bytes")[0]
                        .textContent.replaceAll(",", "")
                ),
                LastModified: new Date(
                    e.querySelectorAll(
                        ".data-file-last-modified "
                    )[0].textContent
                ),
            } as EveRefFile;

            [inRange, date] = Utilities.FileDateInRange(
                file.URL,
                startDate,
                endDate
            );

            if (!inRange) continue;

            files.push(file);
        }
        for (let e of html.querySelectorAll(".data-dir")) {
            let URL = e.querySelector(".url")?.getAttribute("href");
            if (!URL) continue;
            let nf = await this.ListFiles(
                `https://data.everef.net${URL}`,
                startDate,
                endDate
            );
            files.push(...nf);
        }
        return files;
    }
}

export interface EveRefFile {
    URL: string;
    Filename: string;
    Size: number;
    LastModified: Date;
}

export type CollectorFilter = (filename: string, dataset: Datasets) => boolean;
