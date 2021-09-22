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

    async run() {
        for (let defer=0; defer<deferMax; defer++) {
            let {buses} = this.runner;
            let {hasError} = buses;
            if (hasError === true) break;
            this.queuePointer = 0;
            let count = deferQueueCounts[defer];
            for (let i=0; i<count;) {
                try {
                    let queueInArr:any[] = await this.runner.call('$queue_in_get',[this.queuePointer, defer, 10]);
                    if (queueInArr.length === 0) break;
                    for (let queueIn of queueInArr) {
                        await this.processOneRow(queueIn);
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
    }
    
    private async processOneRow(row: any) {
        let {bus, faceName, id, unit, to, data, tries, update_time, now} = row;
        this.queuePointer = id;
        if (!unit) unit = this.runner.uniqueUnit;
        if (tries > 0) {
            // 上次尝试之后十分钟内不尝试
            if (now - update_time < tries * 10 * 60) return;
        }
        let finish:Finish;
        try {
            if (!bus) {
                await this.runner.call('$queue_in_set', [id, Finish.done]); 
            }
            else {
                await this.runner.bus(bus, faceName, unit, to, id, data);
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
            await this.runner.call('$queue_in_set', [id, finish]); 
        }
    }

    private errorText(err:any):string {
        let errType = typeof err;
        switch (errType) {
            default: return errType + ': ' + err;
            case 'undefined': return 'undefined';
            case 'string': return err;
            case 'object': break;
        }
        if (err === null) return 'null';
        let ret:string = '';
        for (let i in err) {
            ret += i + ':' + err[i];
        }
        return ret;
    }
}
