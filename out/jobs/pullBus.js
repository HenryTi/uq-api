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
exports.PullBus = void 0;
const tool_1 = require("../tool");
const tool_2 = require("../tool");
const consts_1 = require("./consts");
class PullBus {
    constructor(runner) {
        this.runner = runner;
        this.net = runner.net;
        this.buses = runner.buses;
        this.faces = this.buses.faces;
        this.coll = this.buses.urlColl;
        this.hasError = this.buses.hasError;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            try {
                let unitMaxIds = yield this.getSyncUnits();
                for (let row of unitMaxIds) {
                    if (this.hasError === true)
                        break;
                    let { unit, maxId, maxId1 } = row;
                    retCount += yield this.pullRun(unit, maxId, maxId1);
                    /*
                    let pullIds:number[] = [maxId, maxId1];
                    for (let defer=0; defer<deferMax; defer++) {
                        if (this.hasError as any === true) break;
                        let count = deferQueueCounts[defer];
                        let pullId = pullIds[defer];
                        await this.pullFromUnitx(unit, pullId??0, defer, count);
                    }
                    */
                }
            }
            catch (err) {
                tool_1.logger.error(err);
                yield this.runner.log(0, 'jobs pullBus loop error: ', (0, tool_2.getErrorString)(err));
            }
            return retCount;
        });
    }
    pullRun(unit, maxId, maxId1) {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            let pullIds = [maxId, maxId1];
            for (let defer = 0; defer < consts_1.deferMax; defer++) {
                if (this.hasError === true)
                    break;
                let count = consts_1.deferQueueCounts[defer];
                let pullId = pullIds[defer];
                retCount += yield this.pullFromUnitx(unit, pullId !== null && pullId !== void 0 ? pullId : 0, defer, count);
            }
            return retCount;
        });
    }
    pullFromUnitx(unit, pullId, defer, count) {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            for (let i = 0; i < count;) {
                if (this.hasError === true)
                    break;
                let ret = yield this.net.pullBus(unit, pullId, this.faces, defer);
                if (!ret)
                    break;
                let { maxMsgId, maxRows } = ret[0][0];
                if (maxMsgId === 0)
                    break;
                let messages = ret[1];
                let { length: messagesLen } = messages;
                let maxPullId = 0;
                if (messagesLen > 0) {
                    // 新版：bus读来，直接写入queue_in。然后在队列里面处理
                    tool_1.logger.debug(`total ${messagesLen} arrived from unitx`);
                    for (let row of messages) {
                        let ok = yield this.processMessage(unit, defer, row);
                        if (ok === false)
                            return retCount;
                        maxPullId = row.id;
                        ++retCount;
                        ++i;
                    }
                    if (this.hasError === true)
                        break;
                }
                if (messagesLen < maxRows && maxPullId < maxMsgId) {
                    // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                    yield this.runner.call('$queue_in_add', [unit, undefined, defer, maxMsgId, undefined, undefined, undefined, undefined, undefined]);
                    break;
                }
                if (messagesLen === 0)
                    break;
                pullId = maxMsgId;
            }
            return retCount;
        });
    }
    processMessage(unit, defer, message) {
        return __awaiter(this, void 0, void 0, function* () {
            let { to, face: faceUrl, id: msgId, body, version, stamp } = message;
            let face = this.coll[faceUrl.toLowerCase()];
            if (face === undefined)
                return;
            let { bus, faceName } = face;
            try {
                yield this.runner.call('$queue_in_add', [unit, to, defer, msgId, bus, faceName, body, version, stamp]);
                return true;
            }
            catch (toQueueInErr) {
                this.hasError = this.buses.hasError = true;
                tool_1.logger.error(toQueueInErr);
                yield this.runner.log(unit, 'jobs pullBus loop to QueueInErr msgId=' + msgId, (0, tool_2.getErrorString)(toQueueInErr));
                return false;
            }
        });
    }
    getSyncUnits() {
        return __awaiter(this, void 0, void 0, function* () {
            let syncUnits = yield this.runner.call('$sync_units', []);
            return syncUnits;
        });
    }
}
exports.PullBus = PullBus;
//# sourceMappingURL=pullBus.js.map