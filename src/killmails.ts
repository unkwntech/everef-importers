import axios from "axios";
import { MongoClient } from "mongodb";

require("dotenv").config();

const QUEUEID = encodeURI(process.env.ZKILL_QUEUE_ID);
const TTW = 10;
const ZKILLURL = `https://zkillredisq.stream/listen.php?queueID=${QUEUEID}&ttw=${TTW}`;
const ERRORPERIOD = 60;
const ERRORCOUNTMAX = 5;

enum states {
    READY,
    BUSY,
}

const cooldowns: { id: number; timer: number }[] = [];
const errors: { error: Error; timestamp: Date }[] = [];
const queue: ZKillPackage[] = [];
let STATE: states = states.READY;

const mongo = new MongoClient(process.env.MONGO_CONN_STRIG);
mongo.connect();
const database = mongo.db("killmails");
const collection = database.collection("killmails");

async function processKill() {
    console.log("processKill");
    let message = queue.pop();
    if (!message) return;
    console.log(message.killID);
    try {
        collection.insertOne({
            ...message.zkb,
            ...message.killmail,
        });
        // push killmail to database
    } catch (e) {
        console.error(e);
    }
}
async function getNextKill() {
    if (STATE != states.READY) return;
    console.log("getNextKill");
    if (getErrorCount() > ERRORCOUNTMAX) {
        STATE = states.BUSY;
        //sendMessage({ content: "ERROR COUNT TOO HIGH, PAUSING" });
        console.error("ERROR COUNT TOO HIGH, PAUSING");
        setTimeout(() => {
            STATE = states.READY;
            console.error("RESUMING");
        }, 300000);
        return;
    }

    STATE = states.BUSY;

    /**
        Squizz Caphinator[EVE] — 13:43
        there is a delay on the redisq side from 500ms to 2500ms, even after your timeout, to ensure that packages are cached and increasing your chances of hitting the cache up to about 99.5%
        https://discord.com/channels/849992399639281694/850216522266050570/1408884427395829942
    **/

    axios
        .get<ZKillMessage>(ZKILLURL, {
            timeout: TTW * 1000 + 2750,
        })
        .then((res) => {
            queue.push(res.data.package);
            STATE = states.READY;
        })
        .catch((err) => {
            //conn timeout, this doesn't count as an error.
            if (err.code === "ECONNABORTED") {
                STATE = states.READY;
                return;
            }
            console.error(err);
            errors.push({ error: err, timestamp: new Date() });
            STATE = states.READY;
        });
}
function getErrorCount(): number {
    return errors.filter((e) => {
        return e.timestamp.getTime() >= Date.now() - ERRORPERIOD * 1000;
    }).length;
}
async function init() {
    console.log("init");
    //set timer to manage cooldowns
    setInterval(() => {
        for (let i = 0; i < cooldowns.length; i++) {
            cooldowns[i].timer -= 30;
            if (cooldowns[i].timer <= 0) {
                cooldowns.splice(i, 1);
            }
        }
    }, 30000);
    //set timer to attempt to fetch new kills
    setInterval(getNextKill, 1000);
    //set timer to process kills from queue
    setInterval(processKill, 1000);
}

init();

interface CharInfo {
    id: number;
    name: string;

    corpID: number;
    corpName: string;
    corpTicker: string;

    allianceID: number;
    allianceName: string;
    allianceTicker: string;
}
interface ZKillMessage {
    package: ZKillPackage;
}
interface ZKillPackage {
    killID: Number;
    killmail: ZKillKillmail;
    zkb: ZKillZKB;
}
interface ZKillKillmail {
    attackers: ZKillAttacker[]; //?
    killmail_id: number;
    killmail_time: Date;
    solar_system_id: number;
    victim: ZKillVictim;
}
interface ZKillCharacter {
    alliance_id?: number;
    character_id: number;
    corporation_id: number;
}
interface ZKillVictim extends ZKillCharacter {
    damage_taken: number;
    items: ZKillItem[];
    position: ZKillPosition;
    ship_type_id: number;
}
interface ZKillAttacker extends ZKillCharacter {
    damage_done: number;
    final_blow: boolean;
    security_status: number;
    ship_type_id: number;
    weapon_type_id: number;
}
interface ZKillZKB {
    locationID: number;
    hash: string;
    fittedValue: number;
    droppedValue: number;
    destroyedValue: number;
    totalValue: number;
    points: number;
    npc: boolean;
    solo: boolean;
    awox: boolean;
    labels: string[];
    href: string;
}
interface ZKillPosition {
    x: number;
    y: number;
    z: number;
}
interface ZKillItem {
    flag: number;
    item_type_id: number;
    quantity_dropped: number;
    singleton: number;
}
interface DiscordMessage {
    content?: string;
    tts?: boolean;
    embeds?: DiscordEmbed[];
    username?: string;
}
interface DiscordEmbed {
    id?: number;
    fields: DiscordField[];
    title: string;
}
interface DiscordField {
    id?: number;
    name: string;
    value: string;
    inline: boolean;
}
