import { createHash } from "crypto";
import { from62 } from "../../tool";
import { getDbs } from "../db";
import { Runner } from "./Runner";
import { push } from "./PushOut";

enum EnumQueueDoneType {
    pending = 0,
    done = 1,
    error = 2,
    errorDeliver = 21,
    errorID = 31,
};

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

    async doneIOOut(id: number, doneType: EnumQueueDoneType, doneResult: any) {
        await this.dbUq.call('ProcessIOOutDone', [0, 0, id, doneType, JSON.stringify(doneResult)]);
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
            let retAppPassword: { inPassword: string; endPoint: number; }[] = await this.dbUq.call(
                'IOGetAppIn',
                [
                    0, 0, siteAtomApp, act
                ]
            );
            if (retAppPassword.length === 0) {
                throw new Error(`unauthorized siteAtomApp=${siteAtomApp} act=${act}`);
            }
            let [{ inPassword, endPoint }] = retAppPassword;
            let strData = JSON.stringify(data);
            let strMd5 = stamp + strData + inPassword;
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
            let doneType: EnumQueueDoneType, doneResult: any;
            const { id: queueId, value, // -- JSON,
                outName,
                outUrl, // CHAR(200),
                outKey, // CHAR(400),
                outPassword, // CHAR(30),
                outConnect: { type, outs }
            } = row;
            try {
                let p = (outName as string).lastIndexOf('.');
                let outN = (outName as string).substring(p + 1);
                let outNm = outs[outN];
                let retPushOut = await push(type, outNm, outUrl, outKey, outPassword, value);

                if (retPushOut === undefined) {
                    doneType = EnumQueueDoneType.done;
                }
                else {
                    doneType = EnumQueueDoneType.errorDeliver;
                    doneResult = retPushOut;
                }
                /*
                retPushOut = await this.pushOut(outNm, outUrl, outKey, outPassword, value, queueId);
                doneType = EnumQueueDoneType.done;
                if (retPushOut !== undefined) {
                    if (retPushOut.success !== true) {
                        doneResult = retPushOut;
                        doneType = EnumQueueDoneType.errorDeliver;
                    }
                }
                */
            }
            catch (err) {
                // debugger;
                console.error('push out error', err);
                doneType = EnumQueueDoneType.error;
                doneResult = { error: err.message };
            }
            finally {
                await this.doneIOOut(queueId, doneType, doneResult);
                console.log('Done out ', new Date().toLocaleTimeString(), '\n', row, '\n', doneResult);
            }
        }
        return length;
    }
    /*
    private async pushOut(outName: string, outUrl: string, outKey: string, outPassword: string, value: any, queueId: number) {
        try {
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
        catch (err) {
            debugger;
            throw err;
        }
    }
    */
}

function md5(content: string) {
    return createHash('md5').update(content).digest('hex');
}

function siteAtomAppFromAppKey(appKey: string) {
    let ak = from62(appKey);
    let f = Number(BigInt(ak) & BigInt(0xffffffffff));
    return f;
}