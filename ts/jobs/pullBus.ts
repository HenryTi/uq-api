import { logger } from '../tool';
import { EntityRunner, Buses, Net, BusFace } from "../core";
import { getErrorString } from "../tool";
import { deferMax, deferQueueCounts } from './consts';

export class PullBus {
    private readonly runner: EntityRunner;
    private readonly net: Net;
    private readonly buses: Buses;
    private readonly faces: string;
    private readonly coll: { [url: string]: BusFace };
    private hasError: boolean;


    constructor(runner: EntityRunner) {
        this.runner = runner;
        this.net = runner.net;
        this.buses = runner.buses;
        this.faces = this.buses.faces;
        this.coll = this.buses.urlColl;
        this.hasError = this.buses.hasError;
    }

    async run(): Promise<number> {
        let retCount: number = 0;
        try {
            let unitMaxIds: { unit: number; maxId: number; maxId1: number; }[] = await this.getSyncUnits();
            for (let row of unitMaxIds) {
                if (this.hasError === true) break;
                let { unit, maxId, maxId1 } = row;
                retCount += await this.pullRun(unit, maxId, maxId1);
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
            logger.error(err);
            await this.runner.log(0, 'jobs pullBus loop error: ', getErrorString(err));
        }
        return retCount;
    }

    async pullRun(unit: number, maxId: number, maxId1: number): Promise<number> {
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
            await this.runner.log(unit, 'jobs pullBus loop to QueueInErr msgId=' + msgId, getErrorString(toQueueInErr));
            return false;
        }
    }

}
