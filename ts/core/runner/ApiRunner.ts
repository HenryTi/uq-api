import { createHash } from "crypto";
import { from62 } from "../../tool";
import { getDbs } from "../db";
import { Runner } from "./Runner";

export class ApiRunner extends Runner {
    constructor() {
        let dbs = getDbs();
        super(dbs.dbBiz);
    }

    async hello() {
        return 'yes, it is ApiRunner';
    }

    async getIOOut(batchNumber: number) {
        let ret = await this.dbUq.call('ProcessIOOut', [0, 0, batchNumber]);
        return ret;
    }

    async doneIOOut(id: number, result: any) {
        await this.dbUq.call('ProcessIOOutDone', [0, 0, id, result]);
    }

    async processIOIn(batchNumber: number): Promise<number> {
        let ret: { queueId: number; sql: string; }[] = await this.dbUq.call('ProcessIOIn', [0, 0, batchNumber]);
        const { length } = ret;
        if (length === 0) return 0;
        const date = new Date().toLocaleTimeString();
        const arr = ret.map(({ sql, queueId }) => `${sql}(${queueId}, json)`);
        console.log(`### IN ${date} biz ${length}: ${arr.join(', ')}`);
        return length;
    }

    async saveIOInQueue(inBody: any) {
        const { data, stamp, appKey, appkey, token, uiq, act } = inBody;
        try {
            let siteAtomApp = siteAtomAppFromAppKey(appKey ?? appkey);
            let retAppPassword: { appPassword: string; endPoint: number; }[] = await this.dbUq.call(
                'IOGetAppPassword',
                [
                    0, 0, siteAtomApp, act
                ]
            );
            if (retAppPassword.length === 0) {
                throw new Error('unauthorized');
            }
            let [{ appPassword, endPoint }] = retAppPassword;
            let strData = JSON.stringify(data);
            let strMd5 = stamp + strData + appPassword;
            console.log(strMd5);
            let hash = md5(strMd5);
            if (token !== hash) {
                throw new Error('MD5 token error');
            }

            let ret = await this.dbUq.call('SaveIOInQueue', [0, 0, endPoint, strData, uiq]);
            return {
                ok: true,
                res: {
                    act: 'saveIOInQueue',
                    ret,
                }
            }
        }
        catch (err) {
            console.error(err);
            return {
                ok: false,
                err: err.message,
            };
        }
    }
}

function md5(content: string) {
    return createHash('md5').update(content).digest('hex');
}

function siteAtomAppFromAppKey(appKey: string) {
    let ak = from62(appKey);
    let f = Number(BigInt(ak) & BigInt(0xffffffffff));
    return f;
}
