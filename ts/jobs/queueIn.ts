import { logger } from '../tool';
import { EntityRunner } from "../core";
import { deferMax, deferQueueCounts, Finish } from "./consts";
import { getErrorString } from "../tool";

export class QueueIn {
    private runner: EntityRunner;
    private queuePointer: number;
    constructor(runner: EntityRunner) {
        this.runner = runner;
    }

    async run(): Promise<number> {
        let retCount: number = 0;
        for (let defer = 0; defer < deferMax; defer++) {
            let { buses } = this.runner;
            let { hasError } = buses;
            if (hasError === true) break;
            this.queuePointer = 0;
            let count = deferQueueCounts[defer];
            for (let i = 0; i < count;) {
                try {
                    let queueInArr: any[] = await this.runner.call('$queue_in_get', [this.queuePointer, defer, 10]);
                    if (queueInArr.length === 0) break;
                    for (let queueIn of queueInArr) {
                        await this.processOneRow(queueIn, defer);
                        ++retCount;
                        ++i;
                    }
                }
                catch (err) {
                    buses.hasError = true;
                    logger.error(err);
                    await this.runner.log(0, 'jobs queueIn loop at ' + this.queuePointer, getErrorString(err));
                    break;
                }
            }
        }
        return retCount;
    }

    private async processOneRow(row: any, defer: number): Promise<void> {
        let { bus, faceName, id, unit, to, data, version, tries, update_time, now, stamp } = row;
        if (!unit) unit = this.runner.uniqueUnit;
        /*
        不满足条件的，不会get出来
        if (tries > 0) {
            // 上次尝试之后十分钟内不尝试
            if (now - update_time < tries * 10 * 60) return;
        }
        */
        this.queuePointer = id;
        let finish: Finish;
        try {
            if (!bus) {
                await this.runner.call('$queue_in_set', [id, defer, Finish.done, version]);
            }
            else {
                let face = this.runner.buses.faceColl[`${bus.toLowerCase()}/${faceName.toLowerCase()}`];
                if (face === undefined) return;
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
                        let errText = `bus:${bus}, faceName:${faceName}, faceVersion: ${face.version}, version:${version}, err: ${err?.message}\nstack:${err.stack}`;
                        await this.runner.log(unit, 'face convert error', errText);
                        throw err;
                    }
                }
                else {
                    await this.runner.bus(bus, faceName, unit, to, id, data, version, stamp);
                }
            }
            finish = Finish.done;
        }
        catch (err) {
            if (tries < 5) {
                finish = Finish.retry; // retry
            }
            else {
                finish = Finish.bad;  // fail
            }
            let errSubject = `error queue_in on ${bus}/${faceName}:${id}`;
            let error = this.errorText(err);
            await this.runner.log(unit, errSubject, error);
        }
        if (finish !== Finish.done) {
            // 操作错误，retry++ or bad
            await this.runner.call('$queue_in_set', [id, defer, finish, version]);
        }
    }

    private errorText(err: any): string {
        let errType = typeof err;
        switch (errType) {
            default: return errType + ': ' + err;
            case 'undefined': return 'undefined';
            case 'string': return err;
            case 'object': break;
        }
        if (err === null) return 'null';
        let ret: string = err.message ?? '';
        ret += ' ';
        for (let i in err) {
            ret += i + ':' + err[i];
        }
        return ret;
    }
}
