"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueIn = void 0;
const tool_1 = require("../tool");
const consts_1 = require("./consts");
const tool_2 = require("../tool");
class QueueIn {
    /**
     * QueueIn: 执行接收bus的逻辑。是从本地$queue_in中获取接收到的bus消息，并进一步处理
     * @param runner
     */
    constructor(runner) {
        this.runner = runner;
    }
    async runOneForTest(id) {
    }
    /**
     * 调用$queue_in_get从$queue_in中获取接收的bus消息，并进一步处理。
     * @returns
     */
    async run() {
        let retCount = 0;
        for (let defer = 0; defer < consts_1.constDeferMax; defer++) {
            if (this.runner.isCompiling === true)
                break;
            let { buses } = this.runner;
            let { error } = buses;
            if (error !== undefined)
                break;
            this.queuePointer = 0;
            let count = consts_1.constQueueSizeArr[defer];
            for (let i = 0; i < count;) {
                try {
                    let queueInArr = await this.runner.call('$queue_in_get', [this.queuePointer, defer, 10]);
                    if (queueInArr.length === 0)
                        break;
                    for (let queueIn of queueInArr) {
                        if (this.runner.isCompiling === true)
                            break;
                        await this.processOneRow(queueIn, defer);
                        ++retCount;
                        ++i;
                    }
                }
                catch (err) {
                    buses.error = err;
                    tool_1.logger.error(err);
                    await this.runner.logError(0, 'jobs queueIn loop at ' + this.queuePointer, (0, tool_2.getErrorString)(err));
                    return -1;
                }
            }
        }
        return retCount;
    }
    /**
     * 处理bus消息
     * @param row 从$queue_in中获取的bus消息
     * @param defer
     * @returns
     */
    async processOneRow(row, defer) {
        let { bus, faceName, id, unit, to, data, version, tries, update_time, now, stamp } = row;
        if (!unit)
            unit = this.runner.uniqueUnit;
        /*
        不满足条件的，不会get出来
        if (tries > 0) {
            // 上次尝试之后十分钟内不尝试
            if (now - update_time < tries * 10 * 60) return;
        }
        */
        this.queuePointer = id;
        let finish;
        try {
            if (!bus) {
                await this.runner.call('$queue_in_set', [id, defer, consts_1.Finish.done, version]);
            }
            else {
                let face = this.runner.buses.faceColl[`${bus.toLowerCase()}/${faceName.toLowerCase()}`];
                if (face === undefined)
                    return;
                if (version > 0 && face.version !== version) {
                    // 也就是说，bus消息的version，跟runner本身的bus version有可能不同
                    // 不同需要做数据转换
                    // 但是，现在先不处理
                    // 2019-07-23
                    // 2021-11-14：实现bus间的版本转换
                    // 针对不同version的bus做转换
                    try {
                        let busData = await face.convert(data, version);
                        await this.runner.bus(bus, faceName, unit, to, id, busData, version, stamp);
                    }
                    catch (err) {
                        let errText = `bus:${bus}, faceName:${faceName}, faceVersion: ${face.version}, version:${version}, err: ${err === null || err === void 0 ? void 0 : err.message}\nstack:${err.stack}`;
                        await this.runner.logError(unit, 'face convert error', errText);
                        throw err;
                    }
                }
                else {
                    await this.runner.bus(bus, faceName, unit, to, id, data, version, stamp);
                }
            }
            finish = consts_1.Finish.done;
        }
        catch (err) {
            if (tries < 5) {
                finish = consts_1.Finish.retry; // retry
            }
            else {
                finish = consts_1.Finish.bad; // fail
            }
            let errSubject = `error queue_in on ${bus}/${faceName}:${id}`;
            let error = this.errorText(err);
            await this.runner.logError(unit, errSubject, error);
        }
        if (finish !== consts_1.Finish.done) {
            // 操作错误，retry++ or bad
            await this.runner.call('$queue_in_set', [id, defer, finish, version]);
        }
    }
    errorText(err) {
        var _a;
        let errType = typeof err;
        switch (errType) {
            default: return errType + ': ' + err;
            case 'undefined': return 'undefined';
            case 'string': return err;
            case 'object': break;
        }
        if (err === null)
            return 'null';
        let ret = (_a = err.message) !== null && _a !== void 0 ? _a : '';
        ret += ' ';
        for (let i in err) {
            ret += i + ':' + err[i];
        }
        return ret;
    }
}
exports.QueueIn = QueueIn;
//# sourceMappingURL=queueIn.js.map