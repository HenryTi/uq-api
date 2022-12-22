import { logger } from '../tool';
import { EntityRunner, Buses, Net, BusFace } from "../core";
import { getErrorString } from "../tool";
import { constQueueSizeArr } from './consts';

const constQueueAgoPullCountArr = constQueueSizeArr.map(v => (v / 5));

interface QueueProps {
    unit?: number;
    defer?: number;
    start: number;
    cur: number;
    end?: number;
    pullCount?: number;
}
interface UnitRow {
    unit: number;
    maxId: number;
    maxId1: number;
    start: number;
    start1: number;
}
type TypePullQueue = new (pullBus: PullBus, queueProps: QueueProps) => PullQueue;

export class PullBus {
    readonly runner: EntityRunner;
    readonly net: Net;
    readonly buses: Buses;
    readonly faces: string;
    readonly coll: { [url: string]: BusFace };

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
    }

    /**
     * 
     * @returns 
     */
    async run(): Promise<number> {
        if (this.runner.isCompiling === true) return 0;
        let retCount: number = 0;
        let unitPulls: { [unit: number]: QueueProps[] } = {};
        try {
            let unitMaxIds: UnitRow[] = await this.runner.call('$sync_units', []);
            let rowsAgo: UnitRow[] = [];
            let curRows: UnitRow[] = [];
            for (let row of unitMaxIds) {
                let { unit } = row;
                if (unit < 0) rowsAgo.push(row);
                else curRows.push(row);
            }

            // pull当下的bus消息
            for (let row of curRows) {
                if (this.buses.hasError === true) break;
                let { unit, maxId, maxId1, start, start1 } = row;
                let queuePropsDefers: QueueProps[] = [
                    { start: start, cur: maxId, },
                    { start: start1, cur: maxId1, },
                ];
                await this.pullBus(PullQueue, unit, queuePropsDefers, constQueueSizeArr);
                unitPulls[unit] = queuePropsDefers;
            }

            for (let row of rowsAgo) {
                if (this.buses.hasError === true) break;
                let { unit, maxId, maxId1, start, start1 } = row;
                // 一个新uq开始工作，默认取两个月的bus信息。
                let queueProps = unitPulls[-unit];
                if (queueProps === undefined) continue;
                let end = queueProps[0].start;
                let end1 = queueProps[1].start;
                if (!end || !end1) continue;
                await this.pullBus(PullQueueAgo, unit, [
                    { start: start, cur: maxId, end, },
                    { start: start1, cur: maxId1, end: end1, },
                ], constQueueAgoPullCountArr);
            }
        }
        catch (err) {
            logger.error(err);
            await this.runner.logError(0, 'jobs pullBus loop error: ', getErrorString(err));
            return -1;
        }
        return retCount;
    }

    private async pullBus(PullQueueConstructor: TypePullQueue, unit: number, queuePropsArr: QueueProps[], queueSizes: number[]) {
        let retCount = 0;
        let len = queuePropsArr.length;
        for (let i = 0; i < len; i++) {
            let queueProps = queuePropsArr[i];
            queueProps.unit = unit;
            queueProps.defer = i;
            queueProps.pullCount = queueSizes[i];
            let pullQueue = new PullQueueConstructor(this, queueProps);
            retCount += await pullQueue.pullQueueFromUnitx();
        }
        return retCount;
    }
}

class PullQueue {
    protected readonly pullBus: PullBus;
    protected readonly defer: number;
    protected readonly end: number;
    protected readonly pullCount: number;
    protected positiveUnit: number;
    protected unit: number;

    start: number;
    cur: number;
    constructor(pullBus: PullBus, queueProps: QueueProps) {
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

    protected init() {
        this.positiveUnit = this.unit;
        if (this.cur === null) this.cur = 0;
    }
    protected async checkOverEnd(msgId: number): Promise<boolean> { return false; }

    /**
     * 使用http从unitx上获取指定faces的bus消息，并处理（） 
     * @param unit 
     * @param pullId 
     * @param defer 
     * @param count 
     * @returns 
     */
    async pullQueueFromUnitx(): Promise<number> {
        let retCount: number = 0;
        let { runner } = this.pullBus;
        for (let i = 0; i < this.pullCount;) {
            if (runner.isCompiling === true) break;
            let retPull = await this.onetimePull();
            if (retPull === undefined) break;
            let { maxMsgId, maxRows, messages } = retPull;
            let messagesLen = messages.length;
            let maxPullId: number = 0;
            if (messagesLen > 0) {
                // 新版：bus读来，直接写入queue_in。然后在队列里面处理
                logger.debug(`total ${messagesLen} arrived from unitx`);
                for (let row of messages) {
                    let { id: rowId, face: faceUrl } = row;
                    let { coll } = this.pullBus;
                    let face = coll[(faceUrl as string).toLowerCase()];
                    if (face !== undefined) {
                        let ok = await this.processMessage(face, row);
                        if (ok === false) return retCount;
                    }
                    maxPullId = rowId;
                    ++retCount;
                    ++i;
                }
                // if (this.pullBus.buses.hasError as any === true) break;
            }
            if (messagesLen < maxRows && maxPullId < maxMsgId) {
                // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                await runner.call('$queue_in_add', [
                    this.unit, undefined, this.defer, maxMsgId,
                    undefined, undefined, undefined, undefined, undefined
                ]);
                break;
            }
            if (messagesLen === 0) break;
            this.cur = maxMsgId;
        }
        return retCount;
    }

    private async onetimePull(): Promise<{
        maxMsgId: number;
        maxRows: number;
        messages: any[];
    }> {
        if (this.pullBus.buses.hasError === true) return;
        if (this.cur >= this.end) return;

        let { net, faces } = this.pullBus;
        let ret = await net.pullBus(this.positiveUnit, this.cur, faces, this.defer);
        if (!ret) return;

        let { maxMsgId, maxRows } = ret[0][0];
        if (maxMsgId === 0) return;
        let messages = ret[1];
        return { maxMsgId, maxRows, messages };
    }

    /**
     * 处理从unitx上获取的bus消息(写入$queue_in表)
     * @param unit 
     * @param defer 
     * @param message 
     * @returns 
     */
    private async processMessage(face: BusFace, message: any): Promise<boolean> {
        let { to, id: msgId, body, version, stamp } = message;
        let { runner } = this.pullBus;
        let { bus, faceName } = face;
        if (runner.isCompiling === true) return false;

        try {
            if (await this.checkOverEnd(msgId) === true) {
                // 结束处理消息
                return false;
            }
            await runner.call('$queue_in_add', [this.unit, to, this.defer, msgId, bus, faceName, body, version, stamp]);
            if (this.start === null) {
                // -100+defer 表示只修改 start
                await runner.call('$queue_in_add', [
                    this.unit, to, -100 + this.defer, msgId,
                    undefined, undefined, undefined, undefined, undefined
                ]);
                this.start = msgId;
            }
            return true;
        }
        catch (toQueueInErr) {
            this.pullBus.buses.hasError = true;
            logger.error(toQueueInErr);
            await runner.logError(
                this.unit
                , `jobs pullBus loop to QueueInErr msgId=${msgId}`
                , getErrorString(toQueueInErr)
            );
            return false;
        }
    }
}

const busHourSeed = 1000000000;
const hourMilliSeconds = 3600 * 1000;
class PullQueueAgo extends PullQueue {
    protected init() {
        this.positiveUnit = -this.unit;
        if (this.cur === null) {
            let startDate = new Date(this.end / busHourSeed * hourMilliSeconds);
            startDate.setMonth(startDate.getMonth() - 1);
            // startDate.setDate(startDate.getDate() - 1);
            this.cur = Math.floor(startDate.getTime() / hourMilliSeconds * busHourSeed);
        }
    }

    protected async checkOverEnd(msgId: number): Promise<boolean> {
        if (msgId < this.end) return false;

        // 所有往前取的消息都做完了。去掉往前取消息的-unit记录行
        await this.pullBus.runner.call('$queue_in_done_ago', [this.unit]);
        return true;
    }
}
