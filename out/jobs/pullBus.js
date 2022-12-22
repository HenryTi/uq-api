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
const constQueueAgoPullCountArr = consts_1.constQueueSizeArr.map(v => (v / 5));
class PullBus {
    /**
     * PullBus: 从unitx上获取指定runner（即指定uq）中定义的bus消息，并写入本uq的$queue_in表中（等待进一步处理）
     * @param runner
     */
    constructor(runner) {
        this.runner = runner;
        this.net = runner.net;
        this.buses = runner.buses;
        this.faces = this.buses.faces;
        this.coll = this.buses.urlColl;
    }
    /**
     *
     * @returns
     */
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.runner.isCompiling === true)
                return 0;
            let retCount = 0;
            let unitPulls = {};
            try {
                let unitMaxIds = yield this.runner.call('$sync_units', []);
                let rowsAgo = [];
                let curRows = [];
                for (let row of unitMaxIds) {
                    let { unit } = row;
                    if (unit < 0)
                        rowsAgo.push(row);
                    else
                        curRows.push(row);
                }
                // pull当下的bus消息
                for (let row of curRows) {
                    if (this.buses.hasError === true)
                        break;
                    let { unit, maxId, maxId1, start, start1 } = row;
                    let queuePropsDefers = [
                        { start: start, cur: maxId, },
                        { start: start1, cur: maxId1, },
                    ];
                    yield this.pullBus(PullQueue, unit, queuePropsDefers, consts_1.constQueueSizeArr);
                    unitPulls[unit] = queuePropsDefers;
                }
                for (let row of rowsAgo) {
                    if (this.buses.hasError === true)
                        break;
                    let { unit, maxId, maxId1, start, start1 } = row;
                    // 一个新uq开始工作，默认取两个月的bus信息。
                    let queueProps = unitPulls[-unit];
                    if (queueProps === undefined)
                        continue;
                    let end = queueProps[0].start;
                    let end1 = queueProps[1].start;
                    if (!end || !end1)
                        continue;
                    yield this.pullBus(PullQueueAgo, unit, [
                        { start: start, cur: maxId, end, },
                        { start: start1, cur: maxId1, end: end1, },
                    ], constQueueAgoPullCountArr);
                }
            }
            catch (err) {
                tool_1.logger.error(err);
                yield this.runner.logError(0, 'jobs pullBus loop error: ', (0, tool_2.getErrorString)(err));
                return -1;
            }
            return retCount;
        });
    }
    pullBus(PullQueueConstructor, unit, queuePropsArr, queueSizes) {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            let len = queuePropsArr.length;
            for (let i = 0; i < len; i++) {
                let queueProps = queuePropsArr[i];
                queueProps.unit = unit;
                queueProps.defer = i;
                queueProps.pullCount = queueSizes[i];
                let pullQueue = new PullQueueConstructor(this, queueProps);
                retCount += yield pullQueue.pullQueueFromUnitx();
            }
            return retCount;
        });
    }
}
exports.PullBus = PullBus;
class PullQueue {
    constructor(pullBus, queueProps) {
        this.pullBus = pullBus;
        let { unit, defer, start, cur, pullCount, end } = queueProps;
        this.unit = unit;
        this.pullCount = pullCount;
        this.defer = defer;
        this.start = start;
        this.cur = cur;
        this.end = end;
        this.init();
    }
    init() {
        this.positiveUnit = this.unit;
        if (this.cur === null)
            this.cur = 0;
    }
    checkOverEnd(msgId) {
        return __awaiter(this, void 0, void 0, function* () { return false; });
    }
    /**
     * 使用http从unitx上获取指定faces的bus消息，并处理（）
     * @param unit
     * @param pullId
     * @param defer
     * @param count
     * @returns
     */
    pullQueueFromUnitx() {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            let { runner } = this.pullBus;
            for (let i = 0; i < this.pullCount;) {
                if (runner.isCompiling === true)
                    break;
                let retPull = yield this.onetimePull();
                if (retPull === undefined)
                    break;
                let { maxMsgId, maxRows, messages } = retPull;
                let messagesLen = messages.length;
                let maxPullId = 0;
                if (messagesLen > 0) {
                    // 新版：bus读来，直接写入queue_in。然后在队列里面处理
                    tool_1.logger.debug(`total ${messagesLen} arrived from unitx`);
                    for (let row of messages) {
                        let { id: rowId, face: faceUrl } = row;
                        let { coll } = this.pullBus;
                        let face = coll[faceUrl.toLowerCase()];
                        if (face !== undefined) {
                            let ok = yield this.processMessage(face, row);
                            if (ok === false)
                                return retCount;
                        }
                        maxPullId = rowId;
                        ++retCount;
                        ++i;
                    }
                    // if (this.pullBus.buses.hasError as any === true) break;
                }
                if (messagesLen < maxRows && maxPullId < maxMsgId) {
                    // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                    yield runner.call('$queue_in_add', [
                        this.unit, undefined, this.defer, maxMsgId,
                        undefined, undefined, undefined, undefined, undefined
                    ]);
                    break;
                }
                if (messagesLen === 0)
                    break;
                this.cur = maxMsgId;
            }
            return retCount;
        });
    }
    onetimePull() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pullBus.buses.hasError === true)
                return;
            if (this.cur >= this.end)
                return;
            let { net, faces } = this.pullBus;
            let ret = yield net.pullBus(this.positiveUnit, this.cur, faces, this.defer);
            if (!ret)
                return;
            let { maxMsgId, maxRows } = ret[0][0];
            if (maxMsgId === 0)
                return;
            let messages = ret[1];
            return { maxMsgId, maxRows, messages };
        });
    }
    /**
     * 处理从unitx上获取的bus消息(写入$queue_in表)
     * @param unit
     * @param defer
     * @param message
     * @returns
     */
    processMessage(face, message) {
        return __awaiter(this, void 0, void 0, function* () {
            let { to, id: msgId, body, version, stamp } = message;
            let { runner } = this.pullBus;
            let { bus, faceName } = face;
            if (runner.isCompiling === true)
                return false;
            try {
                if ((yield this.checkOverEnd(msgId)) === true) {
                    // 结束处理消息
                    return false;
                }
                yield runner.call('$queue_in_add', [this.unit, to, this.defer, msgId, bus, faceName, body, version, stamp]);
                if (this.start === null) {
                    // -100+defer 表示只修改 start
                    yield runner.call('$queue_in_add', [
                        this.unit, to, -100 + this.defer, msgId,
                        undefined, undefined, undefined, undefined, undefined
                    ]);
                    this.start = msgId;
                }
                return true;
            }
            catch (toQueueInErr) {
                this.pullBus.buses.hasError = true;
                tool_1.logger.error(toQueueInErr);
                yield runner.logError(this.unit, `jobs pullBus loop to QueueInErr msgId=${msgId}`, (0, tool_2.getErrorString)(toQueueInErr));
                return false;
            }
        });
    }
}
const busHourSeed = 1000000000;
const hourMilliSeconds = 3600 * 1000;
class PullQueueAgo extends PullQueue {
    init() {
        this.positiveUnit = -this.unit;
        if (this.cur === null) {
            let startDate = new Date(this.end / busHourSeed * hourMilliSeconds);
            startDate.setMonth(startDate.getMonth() - 1);
            // startDate.setDate(startDate.getDate() - 1);
            this.cur = Math.floor(startDate.getTime() / hourMilliSeconds * busHourSeed);
        }
    }
    checkOverEnd(msgId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (msgId < this.end)
                return false;
            // 所有往前取的消息都做完了。去掉往前取消息的-unit记录行
            yield this.pullBus.runner.call('$queue_in_done_ago', [this.unit]);
            return true;
        });
    }
}
//# sourceMappingURL=pullBus.js.map