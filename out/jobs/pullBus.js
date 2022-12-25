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
const busHourSeed = 1000000000;
const hourMilliSeconds = 3600 * 1000;
function messageId(daysFromNow, startId) {
    let startDate = startId ? new Date(startId / busHourSeed * hourMilliSeconds) : new Date();
    startDate.setDate(startDate.getDate() - daysFromNow);
    return Math.floor(startDate.getTime() / hourMilliSeconds * busHourSeed);
}
const defaultStartDays = 6; // 从当下开始，前推天数，开始拉bus数据
let defaultAgoDays = 6; // 从开始拉数据日子，再前推天数，开始拉更久远的数据
// const defaultStartPullMessageId = messageId(startDays);
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
                    if (maxId !== null && maxId < 10000)
                        maxId1 = maxId;
                    let queuePropsDefers = [
                        { start: start, cur: maxId, },
                        { start: start1, cur: maxId1, },
                    ];
                    retCount += yield this.pullBus(PullQueue, unit, queuePropsDefers, consts_1.constQueueSizeArr);
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
                    // 直接在-unit的表行上，设置前取天数
                    if (maxId !== null && maxId < 10000) {
                        // maxId应该是负值。
                        // 有时候，脑子会转不过来，设成正值。会引发问题。所以也处理一下政治
                        maxId1 = maxId;
                        // agoDays = maxId > 0 ? maxId : -maxId;
                        // maxId = maxId1 = null;
                        // start = start1 = -1;
                    }
                    retCount += yield this.pullBus(PullQueueAgo, unit, [
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
        this.initCur(defaultStartDays, undefined);
    }
    initCur(agoDays, startId) {
        if (this.cur === null) {
        }
        else if (this.cur < 10000) {
            agoDays = this.cur > 0 ? this.cur : -this.cur;
        }
        else {
            return;
        }
        this.cur = messageId(agoDays, startId);
        this.start = -1;
    }
    checkOverEnd(msgId) { return false; }
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
            let breakLoop = false;
            for (let i = 0; i < this.pullCount && breakLoop === false;) {
                if (runner.isCompiling === true)
                    break;
                let retPull = yield this.onetimePull();
                if (retPull !== undefined) {
                    let { maxMsgId, maxRows, messages } = retPull;
                    let messagesLen = messages.length;
                    if (this.unit >= 0) {
                        if (this.end === undefined)
                            this.end = maxMsgId;
                    }
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
                            this.cur = rowId;
                            ++retCount;
                            ++i;
                        }
                        // if (this.pullBus.buses.hasError as any === true) break;
                    }
                    if (messagesLen < maxRows && this.cur < maxMsgId) {
                        // this.cur < maxMsgId 如果上次已经是max了，就不用调用这次了
                        // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                        /*
                        await runner.call('$queue_in_add', [
                            this.unit, undefined, this.defer, maxMsgId,
                            undefined, undefined, undefined, undefined, undefined
                        ]);
                        */
                        let pointer;
                        if (this.start < 0) {
                            pointer = this.cur;
                            this.start = this.cur;
                        }
                        else {
                            pointer = maxMsgId;
                        }
                        yield this.setQueuePointer(pointer);
                        this.cur = maxMsgId;
                        breakLoop = true;
                    }
                    if (messagesLen === 0) {
                        breakLoop = true;
                    }
                }
                else {
                    breakLoop = true;
                }
                if (this.unit < 0 && this.checkOverEnd(this.cur) === true && this.end > 0) {
                    // ago 队列处理完成
                    /*
                    await runner.call('$queue_in_add', [
                        this.unit, undefined, this.defer, this.cur,
                        undefined, undefined, undefined, undefined, undefined
                    ]);
                    */
                    yield this.setQueuePointer(this.cur);
                    // 所有往前取的消息都做完了。去掉往前取消息的-unit记录行
                    yield runner.call('$queue_in_done_ago', [this.unit]);
                    this.end = -1;
                }
            }
            return retCount;
        });
    }
    setQueuePointer(pointer) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pullBus.runner.call('$queue_in_add', [
                this.unit, undefined, this.defer, pointer,
                undefined, undefined, undefined, undefined, undefined
            ]);
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
                if (this.checkOverEnd(msgId) === true) {
                    // 结束处理消息
                    return true;
                }
                yield runner.call('$queue_in_add', [this.unit, to, this.defer, msgId, bus, faceName, body, version, stamp]);
                if (this.start === null)
                    this.start = msgId;
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
class PullQueueAgo extends PullQueue {
    init() {
        this.positiveUnit = -this.unit;
        this.initCur(defaultAgoDays, this.end);
    }
    checkOverEnd(msgId) {
        return msgId >= this.end;
    }
}
//# sourceMappingURL=pullBus.js.map