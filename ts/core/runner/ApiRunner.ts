import { createHash } from "crypto";
import { from62 } from "../../tool";
import { getDbs } from "../db";
import { Runner } from "./Runner";
import fetch from "node-fetch";

export class ApiRunner extends Runner {
    constructor() {
        let dbs = getDbs();
        super(dbs.dbBiz);
    }

    async hello() {
        return 'yes, it is ApiRunner';
    }

    async getIOOut(batchNumber: number) {
        let result = await this.dbUq.call('ProcessIOOut', [0, 0, batchNumber]);
        return result;
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
        console.log(inBody);
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
            let hash = md5(strMd5);
            console.log(strMd5, hash, token);
            if ((token as string).toLowerCase() !== hash) {
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

    // if return true, then everything done
    async processIOOut(batchNumber: number): Promise<number> {
        let result = await this.getIOOut(batchNumber);
        const { length } = result;
        if (length === 0) return 0;
        for (let row of result) {
            try {
                const { id: queueId, value, // -- JSON,
                    outName,
                    outUrl, // CHAR(200),
                    outKey, // CHAR(400),
                    outPassword, // CHAR(30),
                } = row;
                let ret = await this.pushOut(outName, outUrl, outKey, outPassword, value, queueId);
                // await this.doneIOOut(queueId, undefined);
                console.log('Done out ', new Date().toLocaleTimeString(), '\n', row, '\n', ret);
            }
            catch (err) {
                // debugger;
                console.error('push out error', err);
                break;
            }
        }
        return length;
    }

    private async pushOut(outName: string, outUrl: string, outKey: string, outPassword: string, value: any, queueId: number) {
        let stamp = Date.now();
        let strData = JSON.stringify(value);
        let token: string = md5(stamp + strData + outPassword);
        let uiq: number = 0; // queueId;
        let ret = await fetch(outUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: value,
                stamp,
                appKey: outKey,
                appkey: outKey,
                token,
                act: outName,
                uiq,
            }),
        });
        let retJson = await ret.json();
        return retJson;
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
