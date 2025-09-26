import * as csv from "@fast-csv/parse";
import axios from "axios";
import Stream from "node:stream";
import bz2 from "unbzip2-stream";

export default class Utilities {
    /**
     * Convert the supplied byte stream to a string with the specified encoding.
     * @param stream Byte stream of string data
     * @param encoding Encoding of string data
     * @returns string
     */
    public static async StreamToString(
        stream: Stream,
        encoding: BufferEncoding = "utf8"
    ): Promise<string> {
        const buffer: any[] = [];

        return new Promise((resolve, reject) => {
            stream.on("data", (chunk: any) => buffer.push(Buffer.from(chunk)));
            stream.on("end", () =>
                resolve(Buffer.concat(buffer).toString(encoding))
            );
            stream.on("error", (e: Error) => reject(e));
        });
    }

    /**
     * Download the specified file and return a stream of expanded(decompressed) bytes.
     * @param url URL to file
     * @returns Stream of BZ2 expanded bytes
     */
    public static async DownloadAndExpandBZ2(url: string): Promise<Stream> {
        return axios
            .get(url, {
                responseType: "stream",
            })
            .then((res) => res.data)
            .then((data) => data.pipe(bz2()));
    }

    /**
     * Attempts to parse a timestamp, or date from a file name and determine if it in the specified range.
     * @param text Filename
     * @param startDate Start date of range
     * @param endDate End date of range
     * @returns boolean
     */
    public static FileDateInRange(
        text: string,
        startDate: Date,
        endDate: Date
    ): [boolean, Date] {
        //timestamp YYYY-mm-dd_HH:MM:SS
        let matches = text.match(/\d{4}(?:\-\d{2}){2}\_\d{2}(?:\-\d{2}){2}/gi);
        let date,
            start,
            end,
            found = false;
        if (matches && matches.length > 0) {
            date = new Date(`${matches[0]}Z`);
            start = startDate;
            end = endDate;
        }

        //iso date YYYY-mm-dd
        matches = text.match(/\d{4}(?:\-\d{2}){2}/gi);
        if (!found && matches && matches.length > 0) {
            date = new Date(`${matches[0]}Z`);
            start = new Date(
                `${startDate.getUTCFullYear()}-${
                    startDate.getUTCMonth() + 1
                }-${startDate.getUTCDate()}Z`
            );
            end = new Date(
                `${endDate.getUTCFullYear()}-${
                    endDate.getUTCMonth() + 1
                }-${endDate.getUTCDate()}Z`
            );
            found = true;
        }

        //iso month YYYY-mm
        matches = text.match(/\d{4}\-\d{2}/gi);
        if (!found && matches && matches.length > 0) {
            date = new Date(`${matches[0]}Z`);
            start = new Date(
                `${startDate.getUTCFullYear()}-${startDate.getUTCMonth() + 1}Z`
            );
            end = new Date(
                `${endDate.getUTCFullYear()}-${endDate.getUTCMonth() + 1}Z`
            );
            found = true;
        }

        //year only
        matches = text.match(/\d{4}/gi);
        if (!found && matches && matches.length > 0) {
            date = new Date(`${matches[0]}Z`);
            start = new Date(`${startDate.getUTCFullYear()}Z`);
            end = new Date(`${endDate.getUTCFullYear()}Z`);
            found = true;
        }

        if (date && start && end) {
            return [
                (date >= start && date <= end) || start == date || end == date,
                date,
            ];
        } else {
            return [false, new Date(0)];
        }
    }

    /**
     * Parses a CSV string into an array of objects.
     * @param text CSV content
     * @param headers Does the content contain headers
     * @returns Array of objects
     */
    public static async ParseCSV(
        text: string,
        headers: boolean = true
    ): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const data: any[] = [];
            csv.parseString(text, { headers: headers })
                .on("error", reject)
                .on("data", (row) => {
                    data.push(row);
                })
                .on("end", () => {
                    resolve(data);
                });
        });
    }
}
