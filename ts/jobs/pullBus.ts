import { logger } from '../tool';
import { EntityRunner, Buses, Net, BusFace } from "../core";
import { getErrorString } from "../tool";
import { deferMax, deferQueueCounts } from './consts';

export class PullBus {
    readonly runner: EntityRunner;
    readonly net: Net;
    readonly buses: Buses;
    readonly faces: string;
    readonly coll: { [url: string]: BusFace };
    readonly pulls: { [unit: number]: PullUnitBus } = {};
    hasError: boolean;

    /**
     * PullBus: 从unitx上获取指定runner（即指定uq）中定义的bus消息，并写入本uq的$queue_in表中（等待进一步处理） 
     * @param runner 
     */
    constructor(runner: EntityRunner) {
        this.runner = runner;
        this.net = runner.net;
        this.buses = runner.buses;
        this.faces = this.buses.faces;
        this.coll = this.buses.urlColl;
        this.hasError = this.buses.hasError;
    }

    /**
     * 
     * @returns 
     */
    async run(): Promise<number> {
        let retCount: number = 0;
        try {
            let unitMaxIds: { unit: number; maxId: number; maxId1: number; start: number; start1: number }[]
                = await this.runner.call('$sync_units', []);
            for (let row of unitMaxIds) {
                if (this.hasError === true) break;
                let { unit, maxId, maxId1, start, start1 } = row;
                if (unit < 0) debugger;
                let pullUnitBus: PullUnitBus;
                let pullMaxIds = [maxId, maxId1];
                let pullStartIds = [start, start1];
                if (unit > 0) {
                    pullUnitBus = new PullUnitBus(this, unit, pullMaxIds, pullStartIds);
                    this.pulls[unit] = pullUnitBus;
                }
                else {
                    // 一个新uq开始工作，默认取两个月的bus信息。
                    // 通过直接在服务器端运行命令，可以再取之前的信息。
                    pullUnitBus = new PullUnitBusBefore(this, -unit, pullMaxIds, pullStartIds);
                }
                //retCount += await this.pullRun(unit, maxId, maxId1);
                retCount += await pullUnitBus.pullRun();
            }
        }
        catch (err) {
            logger.error(err);
            await this.runner.logError(0, 'jobs pullBus loop error: ', getErrorString(err));
            return -1;
        }
        return retCount;
    }
}

class PullUnitBusDefer {
    private readonly pullUnitBus: PullUnitBus;
    private readonly defer: number;
    constructor(pullUnitBus: PullUnitBus, defer: number) {
        this.pullUnitBus = pullUnitBus;
        this.defer = defer;
    }


}

class PullUnitBus {
    protected readonly pullBus: PullBus;
    protected readonly unit: number;
    protected readonly pullMaxIds: number[];
    readonly pullStartIds: number[];
    protected deferQueueCounts: number[];

    constructor(pullBus: PullBus, unit: number, pullMaxIds: number[], pullStartIds: number[]) {
        this.pullBus = pullBus;
        this.unit = unit;
        this.pullMaxIds = pullMaxIds;
        this.pullStartIds = pullStartIds;
        this.setDeferQueueCounts();
    }
    protected setDeferQueueCounts() { this.deferQueueCounts = deferQueueCounts; }

    /**
     * 
     * @param unit 
     * @param maxId 
     * @param maxId1 
     * @returns 
     */
    async pullRun(): Promise<number> {
        let retCount: number = 0;
        // let pullIds: number[] = [maxId, maxId1];
        for (let defer = 0; defer < deferMax; defer++) {
            if (this.pullBus.hasError as any === true) break;
            // let count = deferQueueCounts[defer];
            // let pullId = this.pullMaxIds[defer];
            // retCount += await this.pullFromUnitx(unit, pullId ?? 0, defer, count);
            retCount += await this.pullFromUnitx(defer);
        }
        return retCount;
    }

    /**
     * 使用http从unitx上获取指定faces的bus消息，并处理（） 
     * @param unit 
     * @param pullId 
     * @param defer 
     * @param count 
     * @returns 
     */
    private async pullFromUnitx(defer: number): Promise<number> {
        let count = this.deferQueueCounts[defer];
        let retCount: number = 0;
        let { runner, net, faces } = this.pullBus;
        let pullId = this.getPullId(defer);
        if (pullId <= -100000) {
            // 所有往前取的消息都做完了。去掉往前取消息的-unit记录行
            await runner.call('$queue_in_before_done', [this.unit]);
            return 0;
        }
        for (let i = 0; i < count;) {
            if (this.pullBus.hasError === true) break;
            let ret = await net.pullBus(this.unit, pullId, faces, defer);
            if (!ret) break;

            let { maxMsgId, maxRows } = ret[0][0];
            if (maxMsgId === 0) break;
            let messages = ret[1];
            let { length: messagesLen } = messages;
            let maxPullId: number = 0;
            if (messagesLen > 0) {
                // 新版：bus读来，直接写入queue_in。然后在队列里面处理
                logger.debug(`total ${messagesLen} arrived from unitx`);
                for (let row of messages) {
                    let ok = await this.processMessage(defer, row);
                    if (ok === false) return retCount;
                    maxPullId = row.id;
                    ++retCount;
                    ++i;
                }
                if (this.pullBus.hasError as any === true) break;
            }
            if (messagesLen < maxRows && maxPullId < maxMsgId) {
                // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                await runner.call('$queue_in_add', [this.unit, undefined, defer, maxMsgId, undefined, undefined, undefined, undefined, undefined]);
                break;
            }
            if (messagesLen === 0) break;
            this.pullMaxIds[defer] = pullId = maxMsgId;
        }
        return retCount;
    }

    protected getPullId(defer: number): number {
        return this.pullMaxIds[defer] ?? 0;
    }

    /**
     * 处理从unitx上获取的bus消息(写入$queue_in表)
     * @param unit 
     * @param defer 
     * @param message 
     * @returns 
     */
    private async processMessage(defer: number, message: any): Promise<boolean> {
        let { to, face: faceUrl, id: msgId, body, version, stamp } = message;
        let { coll, runner } = this.pullBus;
        let face = coll[(faceUrl as string).toLowerCase()];
        if (face === undefined) return;
        let { bus, faceName } = face;
        try {
            await runner.call('$queue_in_add', [this.unit, to, defer, msgId, bus, faceName, body, version, stamp]);
            let start = this.pullStartIds[defer];
            if (start === null) {
                // -100+defer 表示修改 start
                await runner.call('$queue_in_add', [this.unit, to, -100 + defer, msgId, undefined, undefined, undefined, undefined, undefined]);
                this.pullStartIds[defer] = msgId;
            }
            return true;
        }
        catch (toQueueInErr) {
            this.pullBus.hasError = this.pullBus.buses.hasError = true;
            logger.error(toQueueInErr);
            await runner.logError(this.unit, 'jobs pullBus loop to QueueInErr msgId=' + msgId, getErrorString(toQueueInErr));
            return false;
        }
    }
    /*
        private async getSyncUnits(): Promise<any[]> {
            let syncUnits = await this.pullBus.runner.call('$sync_units', []);
            return syncUnits;
        }
    */
    async debugPull(defer: 0 | 1) {
        let { net, faces } = this.pullBus;
        let pullId = this.pullMaxIds[defer] ?? 0;
        let ret = await net.pullBus(this.unit, pullId, faces, defer);
        console.log(ret);
        if (!ret) return;

        let { maxMsgId, maxRows } = ret[0][0];
        if (maxMsgId === 0) return;
        let messages = ret[1];
        let { length: messagesLen } = messages;
        let maxPullId: number = 0;
        if (messagesLen > 0) {
            // 新版：bus读来，直接写入queue_in。然后在队列里面处理
            logger.debug(`total ${messagesLen} arrived from unitx`);
            for (let row of messages) {
                let ok = await this.debugProcessMessage(defer, row);
                if (ok === false) return 0;
                maxPullId = row.id;
            }
            if (this.pullBus.hasError as any === true) return;
        }
    }

    private async debugProcessMessage(defer: number, message: any): Promise<boolean> {
        let { to, face: faceUrl, id: msgId, body, version, stamp } = message;
        let { coll, runner } = this.pullBus;
        let face = coll[(faceUrl as string).toLowerCase()];
        if (face === undefined) return;
        let { bus, faceName } = face;
        try {
            // await this.runner.call('$queue_in_add', [unit, to, defer, msgId, bus, faceName, body, version, stamp]);
            return true;
        }
        catch (toQueueInErr) {
            this.pullBus.hasError = this.pullBus.buses.hasError = true;
            logger.error(toQueueInErr);
            await runner.logError(this.unit, 'jobs pullBus loop to QueueInErr msgId=' + msgId, getErrorString(toQueueInErr));
            return false;
        }
    }
}

class PullUnitBusBefore extends PullUnitBus {
    protected setDeferQueueCounts() { this.deferQueueCounts = deferQueueCounts.map(v => (v / 5)); }

    protected getPullId(defer: number): number {
        let ret = this.pullMaxIds[defer] ?? 0;
        if (ret > 0) {
            let pullBusUnit = this.pullBus.pulls[this.unit];
            let startId = pullBusUnit.pullStartIds[defer];
            if (ret >= startId) return -100000;
        }
        return ret;
    }
}


/**
 * 
 * @param unit 
 * @param maxId 
 * @param maxId1 
 * @returns 
 */
/*
    private async pullRun(unit: number, maxId: number, maxId1: number): Promise<number> {
        let retCount: number = 0;
        let pullIds: number[] = [maxId, maxId1];
        for (let defer = 0; defer < deferMax; defer++) {
            if (this.hasError as any === true) break;
            let count = deferQueueCounts[defer];
            let pullId = pullIds[defer];
            retCount += await this.pullFromUnitx(unit, pullId ?? 0, defer, count);
        }
        return retCount;
    }
*/
/**
 * 使用http从unitx上获取指定faces的bus消息，并处理（） 
 * @param unit 
 * @param pullId 
 * @param defer 
 * @param count 
 * @returns 
 */
/*
    private async pullFromUnitx(unit: number, pullId: number, defer: number, count: number): Promise<number> {
        let retCount: number = 0;
        for (let i = 0; i < count;) {
            if (this.hasError === true) break;
            let ret = await this.net.pullBus(unit, pullId, this.faces, defer);
            if (!ret) break;

            let { maxMsgId, maxRows } = ret[0][0];
            if (maxMsgId === 0) break;
            let messages = ret[1];
            let { length: messagesLen } = messages;
            let maxPullId: number = 0;
            if (messagesLen > 0) {
                // 新版：bus读来，直接写入queue_in。然后在队列里面处理
                logger.debug(`total ${messagesLen} arrived from unitx`);
                for (let row of messages) {
                    let ok = await this.processMessage(unit, defer, row);
                    if (ok === false) return retCount;
                    maxPullId = row.id;
                    ++retCount;
                    ++i;
                }
                if (this.hasError as any === true) break;
            }
            if (messagesLen < maxRows && maxPullId < maxMsgId) {
                // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                await this.runner.call('$queue_in_add', [unit, undefined, defer, maxMsgId, undefined, undefined, undefined, undefined, undefined]);
                break;
            }
            if (messagesLen === 0) break;
            pullId = maxMsgId;
        }
        return retCount;
    }
*/
/**
 * 处理从unitx上获取的bus消息(写入$queue_in表)
 * @param unit 
 * @param defer 
 * @param message 
 * @returns 
 */
/*
    private async processMessage(unit: number, defer: number, message: any): Promise<boolean> {
        let { to, face: faceUrl, id: msgId, body, version, stamp } = message;
        let face = this.coll[(faceUrl as string).toLowerCase()];
        if (face === undefined) return;
        let { bus, faceName } = face;
        try {
            await this.runner.call('$queue_in_add', [unit, to, defer, msgId, bus, faceName, body, version, stamp]);
            return true;
        }
        catch (toQueueInErr) {
            this.hasError = this.buses.hasError = true;
            logger.error(toQueueInErr);
            await this.runner.logError(unit, 'jobs pullBus loop to QueueInErr msgId=' + msgId, getErrorString(toQueueInErr));
            return false;
        }
    }

    private async getSyncUnits(): Promise<any[]> {
        let syncUnits = await this.runner.call('$sync_units', []);
        return syncUnits;
    }

    async debugPull(unit: number, pullId: number, defer: 0 | 1) {
        let ret = await this.net.pullBus(unit, pullId, this.faces, defer);
        console.log(ret);
        if (!ret) return;

        let { maxMsgId, maxRows } = ret[0][0];
        if (maxMsgId === 0) return;
        let messages = ret[1];
        let { length: messagesLen } = messages;
        let maxPullId: number = 0;
        if (messagesLen > 0) {
            // 新版：bus读来，直接写入queue_in。然后在队列里面处理
            logger.debug(`total ${messagesLen} arrived from unitx`);
            for (let row of messages) {
                let ok = await this.debugProcessMessage(unit, defer, row);
                if (ok === false) return 0;
                maxPullId = row.id;
            }
            if (this.hasError as any === true) return;
        }
    }

    private async debugProcessMessage(unit: number, defer: number, message: any): Promise<boolean> {
        let { to, face: faceUrl, id: msgId, body, version, stamp } = message;
        let face = this.coll[(faceUrl as string).toLowerCase()];
        if (face === undefined) return;
        let { bus, faceName } = face;
        try {
            // await this.runner.call('$queue_in_add', [unit, to, defer, msgId, bus, faceName, body, version, stamp]);
            return true;
        }
        catch (toQueueInErr) {
            this.hasError = this.buses.hasError = true;
            logger.error(toQueueInErr);
            await this.runner.logError(unit, 'jobs pullBus loop to QueueInErr msgId=' + msgId, getErrorString(toQueueInErr));
            return false;
        }
    }
*/