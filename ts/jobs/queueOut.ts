import { logger } from '../tool';
import { EntityRunner, centerApi, SheetQueueData, BusMessage, unitxTest, unitxProd } from "../core";
import { constDeferMax, constQueueSizeArr, Finish } from "./consts";
import { getErrorString, env } from "../tool";
import { getUserX, Unitx } from "../core";

const procMessageQueueSet = '$message_queue_set';

export class QueueOut {
    private runner: EntityRunner;
    private messagePointer: number;
    private readonly unitx: Unitx;

    /**
     * QueueOut: 指的是处理message_queue中的数据，其中最重要的数据应该是bus消息
     * 处理bus消息就是发送bus，因为发送bus是发出去，所有名称中带有Out
     * @param runner 
     */
    constructor(runner: EntityRunner) {
        this.runner = runner;
        this.unitx = runner.dbUq.isTesting === true ? unitxTest : unitxProd;
    }

    /**
     * 调用$message_queue_out从$message_queue中获取数据，依次执行其对应的存储过程
     * 其中经常使用的是bus消息，然后发送bus 
     * @returns 
     */
    async run(): Promise<number> {
        let retCount: number = 0;
        try {
            retCount += await this.internalRun();
        }
        catch (err) {
            await this.runner.logError(0, 'jobs queueOut loop', getErrorString(err));
            if (env.isDevelopment === true) logger.error(err);
            return -1;
        }
        return retCount;
    }

    private async internalRun(): Promise<number> {
        let retCount: number = 0;
        for (let defer = 0; defer < constDeferMax; defer++) {
            if (this.runner.isCompiling === true as any) break;
            this.messagePointer = 0;
            let count = constQueueSizeArr[defer];
            for (let i = 0; i < count;) {
                if (this.runner.isCompiling === true as any) break;
                let ret = await this.runner.call('$message_queue_get', [this.messagePointer, defer, 10]);
                if (ret.length === 0) break;
                for (let row of ret) {
                    if (this.runner.isCompiling === true as any) break;
                    await this.processOneRow(row, defer);
                    ret++;
                    i++;
                }
            }
        }
        return retCount;
    }

    /**
     * 
     * @param row message_queue中的一行
     * @param defer 
     * @returns 
     */
    async processOneRow(row: any, defer: number) {
        // 以后修正，表中没有$unit，这时候应该runner里面包含$unit的值。在$unit表中，应该有唯一的unit值
        let { $unit, id, to, action, subject, content, tries, update_time, now, stamp } = row;
        logger.debug('queueOut 1: ', action, subject, content, update_time);
        this.messagePointer = id;
        if (!$unit) $unit = this.runner.uniqueUnit;
        if (tries > 0) {
            // 上次尝试之后十分钟内不尝试，按次数，时间递增
            if (now - update_time < tries * 10 * 60) return;
        }
        let finish: Finish;
        if (!content) {
            // 如果没有内容，直接进入failed
            finish = Finish.bad;
        }
        else {
            try {
                switch (action) {
                    default:
                        this.processItem($unit, id, action, subject, content, update_time);
                        break;
                    case 'app':
                        await this.app($unit, id, content);
                        finish = Finish.done;
                        break;
                    case 'email':
                        await this.email($unit, id, content);
                        finish = Finish.done;
                        break;
                    case 'bus':
                        await this.bus($unit, id, defer, to, subject, content, stamp);
                        finish = Finish.done;
                        break;
                    case 'bus-query':
                        await this.busQuery($unit, subject, content);
                        finish = Finish.done;
                        break;
                    case 'sheet':
                        await this.sheet(content);
                        await this.runner.log($unit, 'sheet-action', content);
                        finish = Finish.done;
                        break;
                }
            }
            catch (err) {
                if (tries < 5) {
                    finish = Finish.retry; // retry
                }
                else {
                    finish = Finish.bad;  // fail
                }
                let errSubject = `error on ${action}:  ${subject}`;
                let error = getErrorString(err);
                await this.runner.logError($unit, errSubject, error);
            }
        }
        if (finish !== undefined) await this.runner.unitCall(procMessageQueueSet, $unit, id, defer, finish);
    }

    private processItem(unit: number, id: number, action: string, subject: string, content: string, update_time: Date): void {
        let json: any = {};
        let items = content.split('\n\t\n');
        for (let item of items) {
            let parts = item.split('\n');
            json[parts[0]] = parts[1];
        }
        logger.debug('queue item: ', unit, id, action, subject, json);
    }

    private jsonValues(content: string): any {
        let json: any = {};
        let items = content.split('\n\t\n');
        for (let item of items) {
            let parts = item.split('\n');
            json[parts[0]] = parts[1];
        }
        return json;
    }

    async app(unit: number, id: number, content: string): Promise<void> {
        await centerApi.send({
            type: 'app',
            unit: unit,
            body: content,
        });
    }

    async email(unit: number, id: number, content: string): Promise<void> {
        let values = this.jsonValues(content);
        let { $isUser, $to, $cc, $bcc, $templet } = values;
        if (!$to) return;
        let schema = this.runner.getSchema($templet);
        if (schema === undefined) {
            debugger;
            throw 'something wrong';
        }
        let { subjectSections, sections } = schema.call;
        let mailSubject = this.stringFromSections(subjectSections, values);
        let mailBody = this.stringFromSections(sections, values);

        await centerApi.send({
            isUser: $isUser === '1',
            type: 'email',
            subject: mailSubject,
            body: mailBody,
            to: $to,
            cc: $cc,
            bcc: $bcc
        });
    }

    // bus参数，调用的时候，就是project
    async bus(unit: number, id: number, defer: number, to: number, bus: string, content: string, stamp: number): Promise<void> {
        if (!unit && !to) return;

        let parts = bus.split('/');
        let busEntityName = parts[0];
        let face = parts[1];

        let schema = this.runner.getSchema(busEntityName);
        if (schema === undefined) {
            let err = `schema ${busEntityName} not exists`;
            logger.error(err);
            debugger;
            throw err;
        }
        let { schema: busSchema, busOwner, busName } = schema.call;

        let { uqOwner, uq } = this.runner;

        let { body, version, local } = this.toBusMessage(busSchema, face, content);

        // send Local bus-face，自己发送，自己处理。
        // 也可以对外发送，然后自己接收回来处理。
        async function sendToUnitxAndLocal(runner: EntityRunner, unitx: Unitx, unitOrPerson: number) {
            if (local === true) {
                defer = -1;
                await runner.call('$queue_in_add', [
                    unitOrPerson, to, defer, id
                    , busEntityName
                    , face
                    , body
                    , 0
                    , stamp ?? Date.now() / 1000]);
            }
            else {
                let message: BusMessage = {
                    unit: unitOrPerson,
                    type: 'bus',
                    queueId: id,
                    defer,
                    to,
                    from: uqOwner + '/' + uq,           // from uq
                    busOwner,
                    bus: busName,
                    face,
                    version,
                    body,
                    stamp,
                };
                await unitx.sendToUnitx(unitOrPerson, message);
            }
        }

        if (to > 0) {
            let unitXArr: number[] = await getUserX(this.runner, to, bus, busOwner, busName, face);
            if (!unitXArr || unitXArr.length === 0) return;
            let promises = unitXArr.map(async (v) => {
                await sendToUnitxAndLocal(this.runner, this.unitx, v);
            });
            await Promise.all(promises);
        }
        else {
            await sendToUnitxAndLocal(this.runner, this.unitx, unit);
        }
    }

    // bus参数，调用的时候，就是project
    async busQuery(unit: number, bus: string, content: string): Promise<void> {
        if (!unit) return;

        let parts = bus.split('/');
        let busEntityName = parts[0];
        let face = parts[1];

        let schema = this.runner.getSchema(busEntityName);
        if (schema === undefined) {
            let err = `schema ${busEntityName} not exists`;
            logger.error(err);
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
        let openApi = await this.runner.net.openApiUnitFace(this.runner, unit, busOwner, busName, face);
        if (openApi === undefined) {
            throw 'error await this.runner.net.openApiUnitFace nothing returned';
        }

        let params = content; // content in message queue is params;
        let ret = await openApi.busQuery(unit, busOwner, busName, face, [params]);
        let data = this.buildDataFromBusQueryReturn(returns.fields, ret[0]);
        await this.runner.busAcceptFromQuery(busEntityName, face, unit, data);
    }

    private buildDataFromBusQueryReturn(fields: { name: string; type: string }[], results: any[]): string {
        let ret = '';
        let len = fields.length;
        for (let result of results) {
            ret += result[fields[0].name];
            for (let i = 1; i < len; i++) {
                let field = fields[i];
                ret += '\t' + (result[field.name] ?? '');
            }
            ret += '\n';
        }
        return ret + '\n';
    }

    async sheet(content: string): Promise<void> {
        let sheetQueueData: SheetQueueData = JSON.parse(content);
        let { id, sheet, state, action, unit, user, flow } = sheetQueueData;
        let result = await this.runner.sheetAct(sheet, state, action, unit, user, id, flow);
    }

    stringFromSections(sections: string[], values: any): string {
        if (sections === undefined) return;
        let ret: string[] = [];
        let isValue: boolean = false;
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

    toBusMessage(busSchema: any, face: string, content: string): {
        body: string; version: number; local: boolean;
    } {
        if (!content) return undefined;
        let faceSchema = busSchema[face];
        if (faceSchema === undefined) {
            debugger;
            throw 'toBusMessage something wrong';
        }
        let busHeadCommand: string = undefined;
        let data: { [key: string]: string[] }[] = [];
        let p = 0;
        let part: { [key: string]: string[] };
        let busVersion: number;
        let local = false;
        let n: number;
        function getBusHeadCommand(): string {
            if (content[n] !== '\r') return;
            let pREnd = content.indexOf('\r', n + 1);
            if (pREnd < 0) throw new Error('bus head command error. no end \\r found');
            ++pREnd;
            let ret = content.substring(n, pREnd);
            n = pREnd;
            return ret;
        }
        for (; ;) {
            let t = content.indexOf('\t', p);
            if (t < 0) break;
            let key = content.substring(p, t);
            ++t;
            n = content.indexOf('\n', t);
            let exitLoop: boolean;
            let sec: string;
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
                    if (part !== undefined) data.push(part);
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
            if (exitLoop === true) break;
            p = n;
        }
        if (part !== undefined) data.push(part);

        let { fields, arrs } = faceSchema;
        let ret: string = busHeadCommand ?? '';
        for (let item of data) {
            ret += item['$'] + '\n';
            if (arrs === undefined) continue;
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
