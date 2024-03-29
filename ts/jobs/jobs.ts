import { env, logger } from '../tool';
import { EntityRunner, Db$Uq, Net, getNet } from '../core';
//import { pullEntities } from './pullEntities';
// import { PullBus } from './pullBus';
import { QueueIn } from './queueIn';
// import { QueueOut } from './queueOut';
// import { execQueueAct } from './execQueueAct';
import { UqJob } from './uqJob';
import { getDbs } from '../core';

const firstRun: number = env.isDevelopment === true ? 3000 : 10 * 1000;
const runGap: number = env.isDevelopment === true ? 5 * 1000 : 5 * 1000;
const waitForOtherStopJobs = 1 * 1000; // 等1分钟，等其它服务器uq-api停止jobs
const uqsInclude: string[] =
    [
        //'order', 'coupon', 'deliver'
        /*
        'deliver',
        'collectpayment',
        'order',
        'warehouse',
        'me',
        'bridge',
        */
    ];

const uqsExclude: string[] = undefined;
[
    'rms',
    'thirdpartyadapter',
];

interface Uq {
    runTick: number;
    errorTick: number;
}

export class Jobs {
    private readonly net: Net;
    private readonly uqs: { [id: number]: Uq };
    private readonly db$Uq: Db$Uq; // $UqDbContainer;
    private loopWait: boolean = true;

    /**
     * 所有Job的容器类，用于从db中获取job定义，运行job
     */
    constructor() {
        this.net = getNet();
        this.db$Uq = getDbs().db$Uq; //.$uqDbContainer;
        this.uqs = {};
    }

    private sleep(ms: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    private async beforeRun() {
        if (env.isDevelopment === true) {
            // 只有在开发状态下，才可以屏蔽jobs
            // logger.debug('jobs loop: developing, no loop!');
            // return;
            if (env.isDevdo === true) return;
            // logger.debug(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
            // await this.db$Uq.setDebugJobs();
            // logger.debug('========= set debugging jobs =========');
            await this.db$Uq.setDebugJobs();
            await this.sleep(waitForOtherStopJobs);
            let uqDbNames = env.configDebugging.uqs;
            await this.debugUqJobs(uqDbNames);
        }
        else {
            await this.sleep(firstRun);
        }
    }

    private async debugUqJobs(uqDbNames: string[]) {
        if (!uqDbNames) return;
        if (uqDbNames.length === 0) return;
        for (let uqDbName of uqDbNames) {
            let runner = await this.getRunnerFromDbName(uqDbName);
            if (!runner) continue;
            // let queueOut = new QueueOut(runner);
            // await queueOut.run();
            /*
            let row = {
                $unit: 24,
                id: -39,
                to: -1,
                action: 'bus',
                subject: 'partnermappedbus/partnerordercreated',
                content: `#	2
$		13	20220906091418173873	2022-09-06 09:14:18
`,
                tries: 0,
                update_time: '2021-1-1',
                now: '2021-1-2',
                stamp: null,
            }
            await queueOut.processOneRow(row, 0);
            */
            // let pullBus = new PullBus(runner);
            // await pullBus.run()

            let queueIn = new QueueIn(runner);
            await queueIn.run();
        }
    }

    /**
     * 在for死循环中运行所有job 
     * @returns 
     */
    async run(): Promise<void> {
        const totalTimeGaps = 100;
        let showGap = totalTimeGaps;
        this.db$Uq.uqLog(0, '$uid', '+++++++++++', '********** start ***********');
        await this.beforeRun();
        logger.debug('\n');
        logger.debug('\n');
        logger.debug('====== Jobs loop started! ======');
        for (; ; --showGap) {
            if (showGap <= 0) {
                logger.debug('\n');
                logger.info(`====== ${process.env.NODE_ENV} one loop at ${new Date().toLocaleString()} ======`);
            }
            try {
                await this.uqsJob();
            }
            catch (err) {
                logger.error('jobs loop error!!!!');
                logger.error(err);
                let errText: string = '';
                if (err === null) {
                    errText = 'null';
                }
                else {
                    switch (typeof err) {
                        default: errText = err; break;
                        case 'string': errText = err; break;
                        case 'undefined': errText = 'undefined'; break;
                        case 'object': errText = 'object: ' + err.messsage; break;
                    }
                }
                try {
                    await this.db$Uq.uqLogError(0, '$uid', '$jobs loop error', errText);
                }
                catch {
                }
            }
            finally {
                if (this.loopWait === true) {
                    try {
                        // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                        // 执行这个sleep的时候，出现问题，从而跳出loop
                        //await this.sleep(runGap);
                    }
                    catch (errSleep) {
                        logger.error('=========================');
                        logger.error('===== sleep error =======');
                        logger.error(errSleep);
                        logger.error('=========================');
                    }
                }
                else {
                    this.loopWait = true;
                }
            }
            if (showGap <= 0) {
                logger.info(`###### one loop end at ${new Date().toLocaleString()} ######`);
                showGap = totalTimeGaps;
            }
        }
    }

    /**
     * 循环执行所有uq中的job 
     * @returns 
     */
    private async uqsJob() {
        let totalCount: number = 0;
        try {
            let uqs = await this.db$Uq.uqDbs();
            if (uqs.length === 0) {
                logger.debug('debugging_jobs=yes, stop jobs loop');
                return;
            }

            for (let uqRow of uqs) {
                let now = Date.now();
                let { id, db: uqDbName, compile_tick } = uqRow;
                if (uqDbName.startsWith('$unitx') === true) continue;
                let uq = this.uqs[id];
                if (uq === undefined) {
                    this.uqs[id] = uq = { runTick: 0, errorTick: 0 };
                }
                let { runTick, errorTick } = uq;
                if (now - errorTick < 3 * 60 * 1000) {
                    // debugger;
                    continue;
                }
                if (now < runTick) continue;

                let isExists = await this.db$Uq.isExists(uqDbName);
                if (isExists !== true) continue;
                let uqJob = await this.createUqJob(uqDbName, compile_tick);
                if (uqJob === undefined) continue;
                await this.db$Uq.setDebugJobs();
                now = Date.now();
                logger.info(`====== ${uqDbName} job start: ${new Date(now).toLocaleTimeString()}`);
                let doneRows = await uqJob.run();
                logger.info(`====== ${uqDbName} job end: ${(Date.now() - now)}`);
                // let doneRows = await this.uqJob(uqDbName, compile_tick);
                now = Date.now();
                if (doneRows < 0) {
                    uq.errorTick = now;
                    continue;
                }
                await this.db$Uq.uqLog(0, '$uid', `Job ${uqDbName} `, `total ${doneRows} rows `);
                totalCount += doneRows;
                uq.runTick = now + ((doneRows > 0) ? 0 : 60000);
            }
        }
        catch (err) {
            logger.error('jobs loop error!!!!');
            logger.error(err);
            let errText: string = '';
            if (err === null) {
                errText = 'null';
            }
            else {
                switch (typeof err) {
                    default: errText = err; break;
                    case 'string': errText = err; break;
                    case 'undefined': errText = 'undefined'; break;
                    case 'object': errText = 'object: ' + err.messsage; break;
                }
            }
            await this.db$Uq.uqLog(0, '$jobs', '$jobs loop error', errText);
        }
        finally {
            if (this.loopWait === true) {
                try {
                    // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                    // 执行这个sleep的时候，出现问题，从而跳出loop
                    if (totalCount === 0) {
                        await this.db$Uq.uqLog(0, '$uid', 'No jobs to do', `sleep for ${runGap}ms`);
                        await this.sleep(runGap);
                    }
                }
                catch (errSleep) {
                    logger.error('=========================');
                    logger.error('===== sleep error =======');
                    logger.error(errSleep);
                    logger.error('=========================');
                }
            }
            else {
                this.loopWait = true;
            }
        }
    }

    /**
     * 生成指定 uq 的job 
     * @param uqDbName 所指定的uq名称
     * @param compile_tick 
     * @returns {UqJob} 
     */
    private async createUqJob(uqDbName: string, compile_tick: number): Promise<UqJob> {
        let runner = await this.getRunnerFromDbName(uqDbName);
        if (runner === undefined) return undefined;
        let dbName = runner.dbName;
        if (this.shouldUqJob(dbName) === false) return undefined;
        await runner.setCompileTick(compile_tick);
        let uqJob = new UqJob(runner);
        return uqJob;
    }

    /**
     * 
     * @param uqDbName uq(即数据库)的名称
     * @returns 返回该uq的runner(可以执行该uq的存储过程等)
     */
    private async getRunnerFromDbName(uqDbName: string): Promise<EntityRunner> {
        let runner = await this.net.getRunner(uqDbName);
        return runner;
    }

    /**
     * 运行指定uq中的job，包括：1.uq中定义了bus， 
     * uqDbName可能包含$test，以此区分测试库或者生产库
     * @param uqDbName uq（即数据库上DB）的名称 
     * @param compile_tick 
     * @returns 
     */
    private async uqJob(uqDbName: string, compile_tick: number): Promise<number> {
        let retCount: number = 0;
        let runner = await this.getRunnerFromDbName(uqDbName);
        if (runner === undefined) return retCount;
        if (runner.isCompiling === true) return retCount;

        // if (await this.devCheckJob(runner) === false) return retCount;
        /*
        if (env.isDevelopment === true) {
            let dbName = runner.getDb();
            // 只有develop状态下,才做uqsInclude排除操作
            if (uqsInclude && uqsInclude.length > 0) {
                let index = uqsInclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
                if (index < 0) return retCount;
            }
            // uqsExclude操作
            if (uqsExclude && uqsExclude.length > 0) {
                let index = uqsExclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
                if (index >= 0) return retCount;
            }

            await this.$uqDb.setDebugJobs();
            logger.info('========= set debugging jobs =========');
        }
        */
        logger.info('====== loop for ' + uqDbName + '======');

        await runner.setCompileTick(compile_tick);
        /*
        let { buses } = runner;
        if (buses !== undefined) {
            let { outCount, faces } = buses;
            if (outCount > 0 || runner.hasSheet === true) {
                logger.info(`==== in loop ${uqDbName}: queueOut out bus number=${outCount} ====`);
                let ret = await new QueueOut(runner).run();
                if (ret < 0) return -1;
                retCount += ret;
            }
            if (faces !== undefined) {
                logger.info(`==== in loop ${uqDbName}: pullBus faces: ${faces} ====`);
                let ret = await new PullBus(runner).run();
                if (ret < 0) return -1;
                retCount += ret;
                logger.info(`==== in loop ${uqDbName}: queueIn faces: ${faces} ====`);
                ret = await new QueueIn(runner).run();
                if (ret < 0) return -1;
                retCount += ret;
            }
        }
        if (env.isDevelopment === false) {
            // logger.info(`==== in loop ${uqDbName}: pullEntities ====`);
            // uq 间的entity同步，暂时屏蔽
            // await pullEntities(runner);
        }
        else {
            // logger.error('为了调试程序，pullEntities暂时屏蔽');
        }
        logger.info(`==== in loop ${uqDbName}: execQueueAct ====`);
        if (await execQueueAct(runner) < 0) return -1;
        logger.info(`###### end loop ${uqDbName} ######`);
        */
        return retCount;
    }

    private shouldUqJob(dbName: string): boolean {
        if (uqsInclude && uqsInclude.length > 0) {
            let index = uqsInclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
            if (index < 0) return false;
        }
        // uqsExclude操作
        if (uqsExclude && uqsExclude.length > 0) {
            let index = uqsExclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
            if (index >= 0) return false;
        }
        return true;
    }
    /*
        private async devCheckJob(runner: EntityRunner): Promise<boolean> {
            if (env.isDevelopment === false) return true;
            let dbName = runner.getDb();
            // 只有develop状态下,才做uqsInclude排除操作
            if (this.shouldUqJob(dbName) === false) return false;
    
            await this.$uqDb.setDebugJobs();
            logger.info('========= set debugging jobs =========');
            return true;
        }
    */
}
