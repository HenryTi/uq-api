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
exports.QueueOut = void 0;
const tool_1 = require("../tool");
const core_1 = require("../core");
const consts_1 = require("./consts");
const tool_2 = require("../tool");
const core_2 = require("../core");
const procMessageQueueSet = '$message_queue_set';
class QueueOut {
    /**
     * QueueOut: 发送bus，指的是处理message_queue中的数据，其中最重要的数据应该是bus消息
     * 处理bus消息就是发送bus，因为发送bus是发出去，所有名称中带有Out
     * @param runner
     */
    constructor(runner) {
        this.runner = runner;
        this.unitx = runner.dbUq.isTesting === true ? core_1.unitxTest : core_1.unitxProd;
    }
    /**
     * 调用$message_queue_out从$message_queue中获取数据，依次执行其对应的存储过程
     * 其中经常使用的是bus消息，然后发送bus
     * @returns
     */
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            try {
                retCount += yield this.internalRun();
            }
            catch (err) {
                yield this.runner.logError(0, 'jobs queueOut loop', (0, tool_2.getErrorString)(err));
                if (tool_2.env.isDevelopment === true)
                    tool_1.logger.error(err);
                return -1;
            }
            return retCount;
        });
    }
    internalRun() {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            for (let defer = 0; defer < consts_1.constDeferMax; defer++) {
                if (this.runner.isCompiling === true)
                    break;
                this.messagePointer = 0;
                let count = consts_1.constQueueSizeArr[defer];
                for (let i = 0; i < count;) {
                    if (this.runner.isCompiling === true)
                        break;
                    let ret = yield this.runner.call('$message_queue_get', [this.messagePointer, defer, 10]);
                    if (ret.length === 0)
                        break;
                    for (let row of ret) {
                        if (this.runner.isCompiling === true)
                            break;
                        yield this.processOneRow(row, defer);
                        ret++;
                        i++;
                    }
                }
            }
            return retCount;
        });
    }
    /**
     *
     * @param row message_queue中的一行
     * @param defer
     * @returns
     */
    processOneRow(row, defer) {
        return __awaiter(this, void 0, void 0, function* () {
            // 以后修正，表中没有$unit，这时候应该runner里面包含$unit的值。在$unit表中，应该有唯一的unit值
            let { $unit, id, to, action, subject, content, tries, update_time, now, stamp } = row;
            tool_1.logger.debug('queueOut 1: ', action, subject, content, update_time);
            this.messagePointer = id;
            if (!$unit)
                $unit = this.runner.uniqueUnit;
            if (tries > 0) {
                // 上次尝试之后十分钟内不尝试，按次数，时间递增
                if (now - update_time < tries * 10 * 60)
                    return;
            }
            let finish;
            if (!content) {
                // 如果没有内容，直接进入failed
                finish = consts_1.Finish.bad;
            }
            else {
                try {
                    switch (action) {
                        default:
                            this.processItem($unit, id, action, subject, content, update_time);
                            break;
                        case 'app':
                            yield this.app($unit, id, content);
                            finish = consts_1.Finish.done;
                            break;
                        case 'email':
                            yield this.email($unit, id, content);
                            finish = consts_1.Finish.done;
                            break;
                        case 'bus':
                            yield this.bus($unit, id, defer, to, subject, content, stamp);
                            finish = consts_1.Finish.done;
                            break;
                        case 'bus-query':
                            yield this.busQuery($unit, subject, content);
                            finish = consts_1.Finish.done;
                            break;
                        case 'sheet':
                            yield this.sheet(content);
                            yield this.runner.log($unit, 'sheet-action', content);
                            finish = consts_1.Finish.done;
                            break;
                    }
                }
                catch (err) {
                    if (tries < 5) {
                        finish = consts_1.Finish.retry; // retry
                    }
                    else {
                        finish = consts_1.Finish.bad; // fail
                    }
                    let errSubject = `error on ${action}:  ${subject}`;
                    let error = (0, tool_2.getErrorString)(err);
                    yield this.runner.logError($unit, errSubject, error);
                }
            }
            if (finish !== undefined)
                yield this.runner.unitCall(procMessageQueueSet, $unit, id, defer, finish);
        });
    }
    processItem(unit, id, action, subject, content, update_time) {
        let json = {};
        let items = content.split('\n\t\n');
        for (let item of items) {
            let parts = item.split('\n');
            json[parts[0]] = parts[1];
        }
        tool_1.logger.debug('queue item: ', unit, id, action, subject, json);
    }
    jsonValues(content) {
        let json = {};
        let items = content.split('\n\t\n');
        for (let item of items) {
            let parts = item.split('\n');
            json[parts[0]] = parts[1];
        }
        return json;
    }
    app(unit, id, content) {
        return __awaiter(this, void 0, void 0, function* () {
            yield core_1.centerApi.send({
                type: 'app',
                unit: unit,
                body: content,
            });
        });
    }
    email(unit, id, content) {
        return __awaiter(this, void 0, void 0, function* () {
            let values = this.jsonValues(content);
            let { $isUser, $to, $cc, $bcc, $templet } = values;
            if (!$to)
                return;
            let schema = this.runner.getSchema($templet);
            if (schema === undefined) {
                debugger;
                throw 'something wrong';
            }
            let { subjectSections, sections } = schema.call;
            let mailSubject = this.stringFromSections(subjectSections, values);
            let mailBody = this.stringFromSections(sections, values);
            yield core_1.centerApi.send({
                isUser: $isUser === '1',
                type: 'email',
                subject: mailSubject,
                body: mailBody,
                to: $to,
                cc: $cc,
                bcc: $bcc
            });
        });
    }
    // bus参数，调用的时候，就是project
    bus(unit, id, defer, to, bus, content, stamp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!unit && !to)
                return;
            let parts = bus.split('/');
            let busEntityName = parts[0];
            let face = parts[1];
            let schema = this.runner.getSchema(busEntityName);
            if (schema === undefined) {
                let err = `schema ${busEntityName} not exists`;
                tool_1.logger.error(err);
                debugger;
                throw err;
            }
            let { schema: busSchema, busOwner, busName } = schema.call;
            let { uqOwner, uq } = this.runner;
            let { body, version, local } = this.toBusMessage(busSchema, face, content);
            // send Local bus-face，自己发送，自己处理。
            // 也可以对外发送，然后自己接收回来处理。
            function sendToUnitxAndLocal(runner, unitx, unitOrPerson) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (local === true) {
                        defer = -1;
                        yield runner.call('$queue_in_add', [
                            unitOrPerson, to, defer, id,
                            busEntityName,
                            face,
                            body,
                            0,
                            stamp !== null && stamp !== void 0 ? stamp : Date.now() / 1000
                        ]);
                    }
                    else {
                        let message = {
                            unit: unitOrPerson,
                            type: 'bus',
                            queueId: id,
                            defer,
                            to,
                            from: uqOwner + '/' + uq, // from uq
                            busOwner,
                            bus: busName,
                            face,
                            version,
                            body,
                            stamp,
                        };
                        yield unitx.sendToUnitx(unitOrPerson, message);
                    }
                });
            }
            if (to > 0) {
                let unitXArr = yield (0, core_2.getUserX)(this.runner, to, bus, busOwner, busName, face);
                if (!unitXArr || unitXArr.length === 0)
                    return;
                let promises = unitXArr.map((v) => __awaiter(this, void 0, void 0, function* () {
                    yield sendToUnitxAndLocal(this.runner, this.unitx, v);
                }));
                yield Promise.all(promises);
            }
            else {
                yield sendToUnitxAndLocal(this.runner, this.unitx, unit);
            }
        });
    }
    // bus参数，调用的时候，就是project
    busQuery(unit, bus, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!unit)
                return;
            let parts = bus.split('/');
            let busEntityName = parts[0];
            let face = parts[1];
            let schema = this.runner.getSchema(busEntityName);
            if (schema === undefined) {
                let err = `schema ${busEntityName} not exists`;
                tool_1.logger.error(err);
                debugger;
                throw err;
            }
            let { schema: busSchema, busOwner, busName } = schema.call;
            let faceSchema = busSchema[face];
            let { returns } = faceSchema;
            //let {uqOwner, uq} = this.runner;
            //let {body, version, local} = this.toBusMessage(busSchema, face, content);
            //let {bus, face, busOwner, busName, param, returns} = inBus;
            //let {busOwner, busName} = bus;
            let openApi = yield this.runner.net.openApiUnitFace(this.runner, unit, busOwner, busName, face);
            if (openApi === undefined) {
                throw 'error await this.runner.net.openApiUnitFace nothing returned';
            }
            let params = content; // content in message queue is params;
            let ret = yield openApi.busQuery(unit, busOwner, busName, face, [params]);
            let data = this.buildDataFromBusQueryReturn(returns.fields, ret[0]);
            yield this.runner.busAcceptFromQuery(busEntityName, face, unit, data);
        });
    }
    buildDataFromBusQueryReturn(fields, results) {
        var _a;
        let ret = '';
        let len = fields.length;
        for (let result of results) {
            ret += result[fields[0].name];
            for (let i = 1; i < len; i++) {
                let field = fields[i];
                ret += '\t' + ((_a = result[field.name]) !== null && _a !== void 0 ? _a : '');
            }
            ret += '\n';
        }
        return ret + '\n';
    }
    sheet(content) {
        return __awaiter(this, void 0, void 0, function* () {
            let sheetQueueData = JSON.parse(content);
            let { id, sheet, state, action, unit, user, flow } = sheetQueueData;
            let result = yield this.runner.sheetAct(sheet, state, action, unit, user, id, flow);
        });
    }
    stringFromSections(sections, values) {
        if (sections === undefined)
            return;
        let ret = [];
        let isValue = false;
        for (let section of sections) {
            if (isValue === true) {
                ret.push(values[section] || '');
                isValue = false;
            }
            else {
                ret.push(section);
                isValue = true;
            }
        }
        return ret.join('');
    }
    toBusMessage(busSchema, face, content) {
        if (!content)
            return undefined;
        let faceSchema = busSchema[face];
        if (faceSchema === undefined) {
            debugger;
            throw 'toBusMessage something wrong';
        }
        let busHeadCommand = undefined;
        let data = [];
        let p = 0;
        let part;
        let busVersion;
        let local = false;
        let n;
        function getBusHeadCommand() {
            if (content[n] !== '\r')
                return;
            let pREnd = content.indexOf('\r', n + 1);
            if (pREnd < 0)
                throw new Error('bus head command error. no end \\r found');
            ++pREnd;
            let ret = content.substring(n, pREnd);
            n = pREnd;
            return ret;
        }
        for (;;) {
            let t = content.indexOf('\t', p);
            if (t < 0)
                break;
            let key = content.substring(p, t);
            ++t;
            n = content.indexOf('\n', t);
            let exitLoop;
            let sec;
            if (n < 0) {
                sec = content.substring(t);
                exitLoop = true;
            }
            else {
                sec = content.substring(t, n);
                exitLoop = false;
            }
            ++n;
            switch (key) {
                case '#':
                    busVersion = Number(sec);
                    busHeadCommand = getBusHeadCommand();
                    break;
                case '+#':
                    busVersion = Number(sec);
                    local = true;
                    busHeadCommand = getBusHeadCommand();
                    break;
                case '$':
                    if (part !== undefined)
                        data.push(part);
                    part = { $: [sec] };
                    break;
                default:
                    if (part !== undefined) {
                        let arr = part[key];
                        if (arr === undefined) {
                            part[key] = arr = [];
                        }
                        arr.push(sec);
                    }
                    break;
            }
            if (exitLoop === true)
                break;
            p = n;
        }
        if (part !== undefined)
            data.push(part);
        let { fields, arrs } = faceSchema;
        let ret = busHeadCommand !== null && busHeadCommand !== void 0 ? busHeadCommand : '';
        for (let item of data) {
            ret += item['$'] + '\n';
            if (arrs === undefined)
                continue;
            for (let arr of arrs) {
                let arrRows = item[arr.name];
                if (arrRows !== undefined) {
                    for (let ar of arrRows) {
                        ret += ar + '\n';
                    }
                }
                ret += '\n';
            }
            // ret += '\n'; 
            // 多个bus array，不需要三个回车结束。自动取完，超过长度，自动结束。这样便于之后附加busQuery
        }
        return { body: ret, version: busVersion, local };
    }
}
exports.QueueOut = QueueOut;
//# sourceMappingURL=queueOut.js.map