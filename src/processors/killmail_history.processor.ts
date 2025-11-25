// import axios from "axios";
// import tar from "tar-stream";
// import bz2 from "unbzip2-stream";

// export default class KillmailProcessor implements Processor<killmail> {
//     // async main() {
//     //     let res = await axios.get(
//     //         "https://data.everef.net/killmails/2024/killmails-2024-01-17.tar.bz2",
//     //         {
//     //             responseType: "stream",
//     //         }
//     //     );
//     //     const extract = tar.extract();
//     //     res.data.pipe(bz2()).pipe(extract);
//     // }
//     public async Process(url: string): Promise<killmail[]> {
//         const res = await axios.get(url, {
//             responseType: "stream",
//         });
//         const extract = tar.extract();
//         // extract.on("entry", (header, stream, next) => {
//         //     console.log(header);
//         //     let data: any[] = [];
//         //     stream.on("data", (chunk) => data.push(Buffer.from(chunk)));
//         //     stream.on("end", () => {
//         //         console.log(Buffer.concat(data).toString("utf8"));
//         //         //next();
//         //     });
//         //     stream.resume();
//         // });
//         res.data.pipe(bz2()).pipe(extract);

//         for await (const entry of extract) {
//         }
//         return [];
//     }
//     Insert(killmails: killmail[]): void {
//         return;
//     }
// }
