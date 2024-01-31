"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRunner = void 0;
const crypto_1 = require("crypto");
const tool_1 = require("../../tool");
const db_1 = require("../db");
const Runner_1 = require("./Runner");
class ApiRunner extends Runner_1.Runner {
    constructor() {
        let dbs = (0, db_1.getDbs)();
        super(dbs.dbBiz);
    }
    async hello() {
        return 'yes, it is ApiRunner';
    }
    async getIOOut(batchNumber) {
        let ret = await this.dbUq.call('ProcessIOOut', [0, 0, batchNumber]);
        return ret;
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