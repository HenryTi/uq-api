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
exports.Jobs = void 0;
const tool_1 = require("../tool");
const core_1 = require("../core");
//import { pullEntities } from './pullEntities';
const pullBus_1 = require("./pullBus");
const queueIn_1 = require("./queueIn");
const queueOut_1 = require("./queueOut");
const execQueueAct_1 = require("./execQueueAct");
const firstRun = core_1.env.isDevelopment === true ? 3000 : 10 * 1000;
const runGap = core_1.env.isDevelopment === true ? 5 * 1000 : 5 * 1000;
const waitForOtherStopJobs = 1 * 1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';
const uqsInclude = [
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
const uqsExclude = undefined;
[
    'rms',
    'thirdpartyadapter',
];
class Jobs {
    constructor() {
        this.loopWait = true;
        this.$uqDb = core_1.Db.db(core_1.consts.$uq);
        this.uqs = {};
    }
    sleep(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.$uqDb.uqLog(0, '$uid', '+++++++++++', '********** start ***********');
            if (core_1.env.isDevelopment === true) {
                // 只有在开发状态下，才可以屏蔽jobs        
                // logger.debug('jobs loop: developing, no loop!');
                // return;
                if (core_1.env.isDevdo === true)
                    return;
                tool_1.logger.debug(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
                yield this.$uqDb.setDebugJobs();
                tool_1.logger.debug('========= set debugging jobs =========');
                yield this.sleep(waitForOtherStopJobs);
            }
            else {
                yield this.sleep(firstRun);
            }
            tool_1.logger.debug('\n');
            tool_1.logger.debug('\n');
            tool_1.logger.error('====== Jobs loop started! ======');
            for (;;) {
                tool_1.logger.debug('\n');
                tool_1.logger.info(`====== ${process.env.NODE_ENV} one loop at ${new Date().toLocaleString()} ======`);
                try {
                    yield this.uqsJob();
                }
                catch (err) {
                    tool_1.logger.error('jobs loop error!!!!');
                    tool_1.logger.error(err);
                    let errText = '';
                    if (err === null) {
                        errText = 'null';
                    }
                    else {
                        switch (typeof err) {
                            default:
                                errText = err;
                                break;
                            case 'string':
                                errText = err;
                                break;
                            case 'undefined':
                                errText = 'undefined';
                                break;
                            case 'object':
                                errText = 'object: ' + err.messsage;
                                break;
                        }
                    }
                    yield this.$uqDb.uqLogError(0, '$uid', '$jobs loop error', errText);
                }
                finally {
                    if (this.loopWait === true) {
                        try {
                            // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                            // 执行这个sleep的时候，出现问题，从而跳出loop
                            //await this.sleep(runGap);
                        }
                        catch (errSleep) {
                            tool_1.logger.error('=========================');
                            tool_1.logger.error('===== sleep error =======');
                            tool_1.logger.error(errSleep);
                            tool_1.logger.error('=========================');
                        }
                    }
                    else {
                        this.loopWait = true;
                    }
                }
                tool_1.logger.info(`###### one loop end at ${new Date().toLocaleString()} ######`);
            }
        });
    }
    uqsJob() {
        return __awaiter(this, void 0, void 0, function* () {
            let totalCount = 0;
            try {
                let uqs = yield this.$uqDb.uqDbs();
                if (uqs.length === 0) {
                    tool_1.logger.error('debugging_jobs=yes, stop jobs loop');
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
                        // debugger;
                        continue;
                    }
                    if (now < runTick)
                        continue;
                    let doneRows = yield this.uqJob(uqDbName, compile_tick);
                    now = Date.now();
                    if (doneRows < 0) {
                        uq.errorTick = now;
                        continue;
                    }
                    yield this.$uqDb.uqLog(0, '$uid', `Job ${uqDbName} `, `total ${doneRows} rows `);
                    totalCount += doneRows;
                    uq.runTick = now + ((doneRows > 0) ? 0 : 60000);
                }
            }
            catch (err) {
                tool_1.logger.error('jobs loop error!!!!');
                tool_1.logger.error(err);
                let errText = '';
                if (err === null) {
                    errText = 'null';
                }
                else {
                    switch (typeof err) {
                        default:
                            errText = err;
                            break;
                        case 'string':
                            errText = err;
                            break;
                        case 'undefined':
                            errText = 'undefined';
                            break;
                        case 'object':
                            errText = 'object: ' + err.messsage;
                            break;
                    }
                }
                yield this.$uqDb.uqLog(0, '$jobs', '$jobs loop error', errText);
            }
            finally {
                if (this.loopWait === true) {
                    try {
                        // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                        // 执行这个sleep的时候，出现问题，从而跳出loop
                        if (totalCount === 0) {
                            yield this.$uqDb.uqLog(0, '$uid', 'No jobs to do', `sleep for ${runGap}ms`);
                            yield this.sleep(runGap);
                        }
                    }
                    catch (errSleep) {
                        tool_1.logger.error('=========================');
                        tool_1.logger.error('===== sleep error =======');
                        tool_1.logger.error(errSleep);
                        tool_1.logger.error('=========================');
                    }
                }
                else {
                    this.loopWait = true;
                }
            }
        });
    }
    getRunnerFromDbName(uqDbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let net;
            let dbName;
            ;
            if (uqDbName.endsWith($test) === true) {
                dbName = uqDbName.substring(0, uqDbName.length - $test.length);
                net = core_1.testNet;
            }
            else {
                dbName = uqDbName;
                net = core_1.prodNet;
            }
            let runner = yield net.getRunner(dbName);
            return runner;
        });
    }
    // uqDbName可能包含$test，以此区分测试库或者生产库
    uqJob(uqDbName, compile_tick) {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            let runner = yield this.getRunnerFromDbName(uqDbName);
            if (runner === undefined)
                return retCount;
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
            if (core_1.env.isDevelopment === true) {
                let dbName = runner.getDb();
                // 只有develop状态下,才做uqsInclude排除操作
                if (uqsInclude && uqsInclude.length > 0) {
                    let index = uqsInclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
                    if (index < 0)
                        return retCount;
                }
                // uqsExclude操作
                if (uqsExclude && uqsExclude.length > 0) {
                    let index = uqsExclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
                    if (index >= 0)
                        return retCount;
                }
                yield this.$uqDb.setDebugJobs();
                tool_1.logger.info('========= set debugging jobs =========');
            }
            tool_1.logger.info('====== loop for ' + uqDbName + '======');
            yield runner.setCompileTick(compile_tick);
            let { buses } = runner;
            if (buses !== undefined) {
                let { outCount, faces } = buses;
                if (outCount > 0 || runner.hasSheet === true) {
                    tool_1.logger.info(`==== in loop ${uqDbName}: queueOut out bus number=${outCount} ====`);
                    let ret = yield new queueOut_1.QueueOut(runner).run();
                    if (ret < 0)
                        return -1;
                    retCount += ret;
                }
                if (faces !== undefined) {
                    tool_1.logger.info(`==== in loop ${uqDbName}: pullBus faces: ${faces} ====`);
                    let ret = yield new pullBus_1.PullBus(runner).run();
                    if (ret < 0)
                        return -1;
                    retCount += ret;
                    tool_1.logger.info(`==== in loop ${uqDbName}: queueIn faces: ${faces} ====`);
                    ret = yield new queueIn_1.QueueIn(runner).run();
                    if (ret < 0)
                        return -1;
                    retCount += ret;
                }
            }
            tool_1.logger.info(`==== in loop ${uqDbName}: pullEntities ====`);
            if (core_1.env.isDevelopment === false) {
                // uq 间的entity同步，暂时屏蔽
                // await pullEntities(runner);
            }
            else {
                tool_1.logger.error('为了调试程序，pullEntities暂时屏蔽');
            }
            tool_1.logger.info(`==== in loop ${uqDbName}: execQueueAct ====`);
            if ((yield (0, execQueueAct_1.execQueueAct)(runner)) < 0)
                return -1;
            tool_1.logger.info(`###### end loop ${uqDbName} ######`);
            return retCount;
        });
    }
    debugUqJob(uqDbNames) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!uqDbNames)
                return;
            if (uqDbNames.length === 0)
                return;
            //let $uqDb = Db.db(consts.$uq);
            for (let uqDbName of uqDbNames) {
                let runner = yield this.getRunnerFromDbName(uqDbName);
                if (!runner)
                    continue;
                let pullBus = new pullBus_1.PullBus(runner);
                yield pullBus.run();
                // await pullBus.debugPull(24, 458700000005432, 0);
                // await this.uqJob(uqDbName, undefined);
            }
        });
    }
}
exports.Jobs = Jobs;
//# sourceMappingURL=jobs.js.map