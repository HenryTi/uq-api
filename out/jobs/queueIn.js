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
exports.QueueIn = void 0;
const tool_1 = require("../tool");
const consts_1 = require("./consts");
const tool_2 = require("../tool");
class QueueIn {
    constructor(runner) {
        this.runner = runner;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            for (let defer = 0; defer < consts_1.deferMax; defer++) {
                let { buses } = this.runner;
                let { hasError } = buses;
                if (hasError === true)
                    break;
                this.queuePointer = 0;
                let count = consts_1.deferQueueCounts[defer];
                for (let i = 0; i < count;) {
                    try {
                        let queueInArr = yield this.runner.call('$queue_in_get', [this.queuePointer, defer, 10]);
                        if (queueInArr.length === 0)
                            break;
                        for (let queueIn of queueInArr) {
                            yield this.processOneRow(queueIn, defer);
                            ++retCount;
                            ++i;
                        }
                    }
                    catch (err) {
                        buses.hasError = true;
                        tool_1.logger.error(err);
                        yield this.runner.log(0, 'jobs queueIn loop at ' + this.queuePointer, (0, tool_2.getErrorString)(err));
                        break;
                    }
                }
            }
            return retCount;
        });
    }
    processOneRow(row, defer) {
        return __awaiter(this, void 0, void 0, function* () {
            let { bus, faceName, id, unit, to, data, version, tries, update_time, now, stamp } = row;
            this.queuePointer = id;
            if (!unit)
                unit = this.runner.uniqueUnit;
            if (tries > 0) {
                // 上次尝试之后十分钟内不尝试
                if (now - update_time < tries * 10 * 60)
                    return;
            }
            let finish;
            try {
                if (!bus) {
                    yield this.runner.call('$queue_in_set', [id, defer, consts_1.Finish.done, version]);
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
                            let busData = yield face.convert(data, version);
                            yield this.runner.bus(bus, faceName, unit, to, id, busData, version, stamp);
                        }
                        catch (err) {
                            let errText = `bus:${bus}, faceName:${faceName}, faceVersion: ${face.version}, version:${version}, err: ${err === null || err === void 0 ? void 0 : err.message}\nstack:${err.stack}`;
                            yield this.runner.log(unit, 'face convert error', errText);
                            throw err;
                        }
                    }
                    else {
                        yield this.runner.bus(bus, faceName, unit, to, id, data, version, stamp);
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
                yield this.runner.log(unit, errSubject, error);
            }
            //if (finish !== Finish.done) {
            // 操作错误，retry++ or bad
            yield this.runner.call('$queue_in_set', [id, defer, finish, version]);
            //}
        });
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