"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRunner = void 0;
const crypto_1 = require("crypto");
const tool_1 = require("../../tool");
const db_1 = require("../db");
const Runner_1 = require("./Runner");
const PushOut_1 = require("./PushOut");
var EnumQueueDoneType;
(function (EnumQueueDoneType) {
    EnumQueueDoneType[EnumQueueDoneType["pending"] = 0] = "pending";
    EnumQueueDoneType[EnumQueueDoneType["done"] = 1] = "done";
    EnumQueueDoneType[EnumQueueDoneType["error"] = 2] = "error";
    EnumQueueDoneType[EnumQueueDoneType["errorDeliver"] = 21] = "errorDeliver";
    EnumQueueDoneType[EnumQueueDoneType["errorID"] = 31] = "errorID";
})(EnumQueueDoneType || (EnumQueueDoneType = {}));
;
class ApiRunner extends Runner_1.Runner {
    constructor() {
        let dbs = (0, db_1.getDbs)();
        super(dbs.dbBiz);
    }
    hello() {
        return __awaiter(this, void 0, void 0, function* () {
            return 'yes, it is ApiRunner';
        });
    }
    getIOOut(batchNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield this.dbUq.call('ProcessIOOut', [0, 0, batchNumber]);
                return result;
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    doneIOOut(id, doneType, doneResult) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbUq.call('ProcessIOOutDone', [0, 0, id, doneType, JSON.stringify(doneResult)]);
        });
    }
    processIOIn(batchNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.dbUq.call('ProcessIOIn', [0, 0, batchNumber]);
            const { length } = ret;
            if (length === 0)
                return 0;
            const date = new Date().toLocaleTimeString();
            const arr = ret.map(({ sql, queueId }) => `${sql}(${queueId}, json)`);
            console.log(`### IN ${date} biz ${length}: ${arr.join(', ')}`);
            return length;
        });
    }
    saveIOInQueue(inBody) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(inBody);
            const { data, stamp, appKey, appkey, token, uiq, act } = inBody;
            try {
                let siteAtomApp = siteAtomAppFromAppKey(appKey !== null && appKey !== void 0 ? appKey : appkey);
                let retAppPassword = yield this.dbUq.call('IOGetAppIn', [
                    0, 0, siteAtomApp, act
                ]);
                if (retAppPassword.length === 0) {
                    throw new Error(`unauthorized siteAtomApp=${siteAtomApp} act=${act}`);
                }
                let [{ inPassword, endPoint }] = retAppPassword;
                let strData = JSON.stringify(data);
                let strMd5 = stamp + strData + inPassword;
                let hash = md5(strMd5);
                if (token.toLowerCase() !== hash) {
                    throw new Error('MD5 token error');
                }
                let strDataLowercase = JSON.stringify((0, tool_1.jsonNamesLowercase)(data));
                let ret = yield this.dbUq.call('SaveIOInQueue', [0, 0, endPoint, strDataLowercase, uiq]);
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
        });
    }
    // if return true, then everything done
    processIOOut(batchNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.getIOOut(batchNumber);
            const { length } = result;
            if (length === 0)
                return 0;
            for (let row of result) {
                let doneType, doneResult;
                const { id: queueId, value, // -- JSON,
                outName, outUrl, // CHAR(200),
                outKey, // CHAR(400),
                outPassword, // CHAR(30),
                outConnect: { type, outs } } = row;
                try {
                    let p = outName.lastIndexOf('.');
                    let outN = outName.substring(p + 1);
                    let outNm = outs[outN];
                    let retPushOut = yield (0, PushOut_1.push)(type, outNm, outUrl, outKey, outPassword, value);
                    if (retPushOut === undefined) {
                        doneType = EnumQueueDoneType.done;
                    }
                    else {
                        doneType = EnumQueueDoneType.errorDeliver;
                        doneResult = retPushOut;
                    }
                }
                catch (err) {
                    console.error('push out error', err);
                    doneType = EnumQueueDoneType.error;
                    doneResult = { error: err.message };
                }
                finally {
                    yield this.doneIOOut(queueId, doneType, doneResult);
                    console.log('Done out ', new Date().toLocaleTimeString(), '\n', row, '\n', doneResult);
                }
            }
            return length;
        });
    }
    // 每次要更新Atom Unique，就会Atom Phrase id写入IOInOut队列。逐个处理。
    processAtomUnique(batchNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return 0;
        });
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