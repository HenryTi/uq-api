"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRunner = void 0;
const crypto_1 = require("crypto");
const tool_1 = require("../../tool");
const db_1 = require("../db");
const Runner_1 = require("./Runner");
const node_fetch_1 = require("node-fetch");
class ApiRunner extends Runner_1.Runner {
    constructor() {
        let dbs = (0, db_1.getDbs)();
        super(dbs.dbBiz);
    }
    async hello() {
        return 'yes, it is ApiRunner';
    }
    async getIOOut(batchNumber) {
        let result = await this.dbUq.call('ProcessIOOut', [0, 0, batchNumber]);
        return result;
    }
    async doneIOOut(id, result) {
        await this.dbUq.call('ProcessIOOutDone', [0, 0, id, result]);
    }
    async processIOIn(batchNumber) {
        let ret = await this.dbUq.call('ProcessIOIn', [0, 0, batchNumber]);
        const { length } = ret;
        if (length === 0)
            return 0;
        const date = new Date().toLocaleTimeString();
        const arr = ret.map(({ sql, queueId }) => `${sql}(${queueId}, json)`);
        console.log(`### IN ${date} biz ${length}: ${arr.join(', ')}`);
        return length;
    }
    async saveIOInQueue(inBody) {
        console.log(inBody);
        const { data, stamp, appKey, appkey, token, uiq, act } = inBody;
        try {
            let siteAtomApp = siteAtomAppFromAppKey(appKey !== null && appKey !== void 0 ? appKey : appkey);
            let retAppPassword = await this.dbUq.call('IOGetAppPassword', [
                0, 0, siteAtomApp, act
            ]);
            if (retAppPassword.length === 0) {
                throw new Error('unauthorized');
            }
            let [{ appPassword, endPoint }] = retAppPassword;
            let strData = JSON.stringify(data);
            let strMd5 = stamp + strData + appPassword;
            let hash = md5(strMd5);
            console.log(strMd5, hash, token);
            if (token.toLowerCase() !== hash) {
                throw new Error('MD5 token error');
            }
            let ret = await this.dbUq.call('SaveIOInQueue', [0, 0, endPoint, strData, uiq]);
            return {
                ok: true,
                res: {
                    act: 'saveIOInQueue',
                    ret,
                }
            };
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
    async processIOOut(batchNumber) {
        let result = await this.getIOOut(batchNumber);
        const { length } = result;
        if (length === 0)
            return 0;
        for (let row of result) {
            try {
                const { id: queueId, value, // -- JSON,
                outName, outUrl, // CHAR(200),
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
    async pushOut(outName, outUrl, outKey, outPassword, value, queueId) {
        let stamp = Math.floor(Date.now() / 1000);
        let strData = JSON.stringify(value);
        let token = md5(stamp + strData + outPassword);
        let uiq = 0; // queueId;
        let ret = await (0, node_fetch_1.default)(outUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: value,
                stamp: String(stamp),
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
exports.ApiRunner = ApiRunner;
function md5(content) {
    return (0, crypto_1.createHash)('md5').update(content).digest('hex');
}
function siteAtomAppFromAppKey(appKey) {
    let ak = (0, tool_1.from62)(appKey);
    let f = Number(BigInt(ak) & BigInt(0xffffffffff));
    return f;
}
//# sourceMappingURL=ApiRunner.js.map