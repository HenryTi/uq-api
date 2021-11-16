import * as _ from 'lodash';
import { logger } from '../tool';
import { Net, Db, prodNet, testNet, env, consts } from '../core';
import { pullEntities } from './pullEntities';
import { PullBus } from './pullBus';
import { QueueIn } from './queueIn';
import { QueueOut } from './queueOut';
import { execQueueAct } from './execQueueAct';

const firstRun: number = env.isDevelopment === true? 3000 : 30*1000;
const runGap: number = env.isDevelopment === true? 15*1000 : 30*1000;
const waitForOtherStopJobs = 1*1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';
const uqsInclude:string[] = undefined;
[
    'me', 'order', 'coupon', 'deliver'
    /*
    'deliver',
    'collectpayment',
    'order',
    'warehouse',
    'me',
    'bridge',
    */
];

const uqsExclude:string[] = //undefined;
[
    'rms',
    'thirdpartyadapter',
];

export class Jobs {
    sleep(ms: number):Promise<void> {
        return new Promise<void>((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    private loopWait: boolean = true;

    async run(): Promise<void> {
        let $uqDb = Db.db(consts.$uq);
        if (env.isDevelopment === true) {
            // 只有在开发状态下，才可以屏蔽jobs        
            // logger.debug('jobs loop: developing, no loop!');
            // return;
            if (env.isDevdo === true) return;
            logger.debug(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
            await $uqDb.setDebugJobs();
            logger.debug('========= set debugging jobs =========');
            await this.sleep(waitForOtherStopJobs);
        }
        else {
            await this.sleep(firstRun);
        }

        logger.debug('\n');
        logger.debug('\n');
        logger.error('====== Jobs loop started! ======');
        for (;;) {
            logger.debug('\n');
            logger.info(`====== ${process.env.NODE_ENV} one loop at ${new Date().toLocaleString()} ======`);
            try {
                await this.uqsJob($uqDb);
            }
            catch (err) {
                logger.error('jobs loop error!!!!');
                logger.error(err);
                let errText:string = '';
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
                await $uqDb.log(0, '$jobs', '$jobs loop error', errText);
            }
            finally {
                if (this.loopWait === true) {
                    try {
                        // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                        // 执行这个sleep的时候，出现问题，从而跳出loop
                        await this.sleep(runGap);
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

    private async uqsJob($uqDb: Db) {
        try {
            let uqs = await $uqDb.uqDbs();
            if (uqs.length === 0) {
                logger.error('debugging_jobs=yes, stop jobs loop');
                return;
            }
            
            for (let uqRow of uqs) {
                let {db:uqDbName, compile_tick} = uqRow;
                await this.uqJob($uqDb, uqDbName, compile_tick);
            }
        }
        catch (err) {
            logger.error('jobs loop error!!!!');
            logger.error(err);
            let errText:string = '';
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
            await $uqDb.log(0, '$jobs', '$jobs loop error', errText);
        }
        finally {
            if (this.loopWait === true) {
                try {
                    // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                    // 执行这个sleep的时候，出现问题，从而跳出loop
                    await this.sleep(runGap);
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

    // uqDbName可能包含$test，以此区分测试库或者生产库
    private async uqJob($uqDb: Db, uqDbName: string, compile_tick: number) {
        let net:Net;
        let dbName:string;;
        if (uqDbName.endsWith($test) === true) {
            dbName = uqDbName.substr(0, uqDbName.length - $test.length);
            net = testNet;
        }
        else {
            dbName = uqDbName;
            net = prodNet;
        }
        // 2020-7-1：我太蠢了。居然带着这一句发布了 ？！！！
        // if (dbName !== 'bi') continue;

        if (env.isDevelopment === true) {
            // 只有develop状态下,才做uqsInclude排除操作
            if (uqsInclude && uqsInclude.length > 0) {
                let index = uqsInclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
                if (index < 0) return;
            }
            // uqsExclude操作
            if (uqsExclude && uqsExclude.length > 0) {
                let index = uqsExclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
                if (index >= 0) return;
            }

            await $uqDb.setDebugJobs();
            logger.info('========= set debugging jobs =========');
        }
        logger.info('====== loop for ' + uqDbName + '======');

        let runner = await net.getRunner(dbName);
        if (runner === undefined) return;
        await runner.setCompileTick(compile_tick);
        let {buses} = runner;
        if (buses !== undefined) {
            let {outCount, faces} = buses;
            if (outCount > 0 || runner.hasSheet === true) {
                logger.info(`==== in loop ${uqDbName}: queueOut out bus number=${outCount} ====`);
                await new QueueOut(runner).run();
                //await queueOut(runner);
            }
            if (faces !== undefined) {
                logger.info(`==== in loop ${uqDbName}: pullBus faces: ${faces} ====`);
                await new PullBus(runner).run();
                logger.info(`==== in loop ${uqDbName}: queueIn faces: ${faces} ====`);
                await new QueueIn(runner).run();
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
        await execQueueAct(runner);
        logger.info(`###### end loop ${uqDbName} ######`);
    }

    async debugUqJob(uqDbNames: string[]) {
        if (!uqDbNames) return;
        if (uqDbNames.length === 0) return;
        let $uqDb = Db.db(consts.$uq);
        for (let uqDbName of uqDbNames) {
            await this.uqJob($uqDb, uqDbName, undefined);
        }
    }
}
