import * as _ from 'lodash';
import { logger } from '../tool';
import { Net, Db, prodNet, testNet, env, consts, EntityRunner } from '../core';
//import { pullEntities } from './pullEntities';
import { PullBus } from './pullBus';
import { QueueIn } from './queueIn';
import { QueueOut } from './queueOut';
import { execQueueAct } from './execQueueAct';

const firstRun: number = env.isDevelopment === true ? 3000 : 10 * 1000;
const runGap: number = env.isDevelopment === true ? 5 * 1000 : 5 * 1000;
const waitForOtherStopJobs = 1 * 1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';
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
    private readonly uqs: { [id: number]: Uq };
    private readonly $uqDb: Db;
    private loopWait: boolean = true;

    constructor() {
        this.$uqDb = Db.db(consts.$uq);
        this.uqs = {};
    }

    private sleep(ms: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    async run(): Promise<void> {
        this.$uqDb.uqLog(0, '$uid', '+++++++++++', '********** start ***********');
        if (env.isDevelopment === true) {
            // 只有在开发状态下，才可以屏蔽jobs        
            // logger.debug('jobs loop: developing, no loop!');
            // return;
            if (env.isDevdo === true) return;
            logger.debug(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
            await this.$uqDb.setDebugJobs();
            logger.debug('========= set debugging jobs =========');
            await this.sleep(waitForOtherStopJobs);
        }
        else {
            await this.sleep(firstRun);
        }

        logger.debug('\n');
        logger.debug('\n');
        logger.error('====== Jobs loop started! ======');
        for (; ;) {
            logger.debug('\n');
            logger.info(`====== ${process.env.NODE_ENV} one loop at ${new Date().toLocaleString()} ======`);
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
                await this.$uqDb.uqLogError(0, '$uid', '$jobs loop error', errText);
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
            logger.info(`###### one loop end at ${new Date().toLocaleString()} ######`);
        }
    }

    private async uqsJob() {
        let totalCount: number = 0;
        try {
            let uqs = await this.$uqDb.uqDbs();
            if (uqs.length === 0) {
                logger.error('debugging_jobs=yes, stop jobs loop');
                return;
            }

            for (let uqRow of uqs) {
                let now = Date.now();
                let { id, db: uqDbName, compile_tick } = uqRow;
                let uq = this.uqs[id];
                if (uq === undefined) {
                    this.uqs[id] = uq = { runTick: 0, errorTick: 0 };
                }
                let { runTick, errorTick } = uq;
                if (now - errorTick < 3 * 60 * 1000) {
                    debugger;
                    continue;
                }
                if (now < runTick) continue;

                let doneRows = await this.uqJob(uqDbName, compile_tick);
                now = Date.now();
                if (doneRows < 0) {
                    uq.errorTick = now;
                    continue;
                }
                await this.$uqDb.uqLog(0, '$uid', `Job ${uqDbName} `, `total ${doneRows} rows `);
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
            await this.$uqDb.uqLog(0, '$jobs', '$jobs loop error', errText);
        }
        finally {
            if (this.loopWait === true) {
                try {
                    // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                    // 执行这个sleep的时候，出现问题，从而跳出loop
                    if (totalCount === 0) {
                        await this.$uqDb.uqLog(0, '$uid', 'No jobs to do', `sleep for ${runGap}ms`);
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

    private async getRunnerFromDbName(uqDbName: string): Promise<EntityRunner> {
        let net: Net;
        let dbName: string;;
        if (uqDbName.endsWith($test) === true) {
            dbName = uqDbName.substring(0, uqDbName.length - $test.length);
            net = testNet;
        }
        else {
            dbName = uqDbName;
            net = prodNet;
        }
        let runner = await net.getRunner(dbName);
        return runner;
    }

    // uqDbName可能包含$test，以此区分测试库或者生产库
    private async uqJob(uqDbName: string, compile_tick: number): Promise<number> {
        let retCount: number = 0;
        let runner = await this.getRunnerFromDbName(uqDbName);
        if (runner === undefined) return retCount;
        /*
        let net: Net;
        let dbName: string;;
        if (uqDbName.endsWith($test) === true) {
            dbName = uqDbName.substring(0, uqDbName.length - $test.length);
            net = testNet;
        }
        else {
            dbName = uqDbName;
            net = prodNet;
        }
        */
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
        logger.info('====== loop for ' + uqDbName + '======');

        await runner.setCompileTick(compile_tick);
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
        logger.info(`==== in loop ${uqDbName}: pullEntities ====`);
        if (env.isDevelopment === false) {
            // uq 间的entity同步，暂时屏蔽
            // await pullEntities(runner);
        }
        else {
            logger.error('为了调试程序，pullEntities暂时屏蔽');
        }
        logger.info(`==== in loop ${uqDbName}: execQueueAct ====`);
        if (await execQueueAct(runner) < 0) return -1;
        logger.info(`###### end loop ${uqDbName} ######`);
        return retCount;
    }

    async debugUqJob(uqDbNames: string[]) {
        if (!uqDbNames) return;
        if (uqDbNames.length === 0) return;
        //let $uqDb = Db.db(consts.$uq);
        for (let uqDbName of uqDbNames) {
            let runner = await this.getRunnerFromDbName(uqDbName);
            if (!runner) continue;
            let pullBus = new PullBus(runner);
            await pullBus.run()
            // await pullBus.debugPull(24, 458700000005432, 0);
            // await this.uqJob(uqDbName, undefined);
        }
    }
}
