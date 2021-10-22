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
const pullBus_1 = require("./pullBus");
const queueIn_1 = require("./queueIn");
const queueOut_1 = require("./queueOut");
const execQueueAct_1 = require("./execQueueAct");
const firstRun = core_1.env.isDevelopment === true ? 3000 : 30 * 1000;
const runGap = core_1.env.isDevelopment === true ? 15 * 1000 : 30 * 1000;
const waitForOtherStopJobs = 1 * 1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';
const uqsInclude = [
    'coupon',
    /*
    'deliver',
    'collectpayment',
    'order',
    'warehouse',
    'me',
    'bridge',
    */
];
const uqsExclude = [
    'rms',
    'thirdpartyadapter',
];
class Jobs {
    constructor() {
        this.loopWait = true;
    }
    sleep(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let $uqDb = core_1.Db.db(core_1.consts.$uq);
            if (core_1.env.isDevelopment === true) {
                // 只有在开发状态下，才可以屏蔽jobs        
                //logger.debug('jobs loop: developing, no loop!');
                //return;
                if (core_1.env.isDevdo === true)
                    return;
                tool_1.logger.debug(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
                yield $uqDb.setDebugJobs();
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
                    yield this.uqsJob($uqDb);
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
                    yield $uqDb.log(0, '$jobs', '$jobs loop error', errText);
                }
                finally {
                    if (this.loopWait === true) {
                        try {
                            // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                            // 执行这个sleep的时候，出现问题，从而跳出loop
                            yield this.sleep(runGap);
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
    uqsJob($uqDb) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let uqs = yield $uqDb.uqDbs();
                if (uqs.length === 0) {
                    tool_1.logger.error('debugging_jobs=yes, stop jobs loop');
                    return;
                }
                for (let uqRow of uqs) {
                    let { db: uqDbName, compile_tick } = uqRow;
                    yield this.uqJob($uqDb, uqDbName, compile_tick);
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
                yield $uqDb.log(0, '$jobs', '$jobs loop error', errText);
            }
            finally {
                if (this.loopWait === true) {
                    try {
                        // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                        // 执行这个sleep的时候，出现问题，从而跳出loop
                        yield this.sleep(runGap);
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
    // uqDbName可能包含$test，以此区分测试库或者生产库
    uqJob($uqDb, uqDbName, compile_tick) {
        return __awaiter(this, void 0, void 0, function* () {
            let net;
            let dbName;
            ;
            if (uqDbName.endsWith($test) === true) {
                dbName = uqDbName.substr(0, uqDbName.length - $test.length);
                net = core_1.testNet;
            }
            else {
                dbName = uqDbName;
                net = core_1.prodNet;
            }
            // 2020-7-1：我太蠢了。居然带着这一句发布了 ？！！！
            // if (dbName !== 'bi') continue;
            if (core_1.env.isDevelopment === true) {
                // 只有develop状态下,才做uqsInclude排除操作
                if (uqsInclude && uqsInclude.length > 0) {
                    let index = uqsInclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
                    if (index < 0)
                        return;
                }
                // uqsExclude操作
                if (uqsExclude && uqsExclude.length > 0) {
                    let index = uqsExclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
                    if (index >= 0)
                        return;
                }
                yield $uqDb.setDebugJobs();
                tool_1.logger.info('========= set debugging jobs =========');
            }
            tool_1.logger.info('====== loop for ' + uqDbName + '======');
            let runner = yield net.getRunner(dbName);
            if (runner === undefined)
                return;
            yield runner.setCompileTick(compile_tick);
            let { buses } = runner;
            if (buses !== undefined) {
                let { outCount, faces } = buses;
                if (outCount > 0 || runner.hasSheet === true) {
                    tool_1.logger.info(`==== in loop ${uqDbName}: queueOut out bus number=${outCount} ====`);
                    yield new queueOut_1.QueueOut(runner).run();
                    //await queueOut(runner);
                }
                if (faces !== undefined) {
                    tool_1.logger.info(`==== in loop ${uqDbName}: pullBus faces: ${faces} ====`);
                    yield new pullBus_1.PullBus(runner).run();
                    tool_1.logger.info(`==== in loop ${uqDbName}: queueIn faces: ${faces} ====`);
                    yield new queueIn_1.QueueIn(runner).run();
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
            yield execQueueAct_1.execQueueAct(runner);
            tool_1.logger.info(`###### end loop ${uqDbName} ######`);
        });
    }
    debugUqJob(uqDbNames) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!uqDbNames)
                return;
            if (uqDbNames.length === 0)
                return;
            let $uqDb = core_1.Db.db(core_1.consts.$uq);
            for (let uqDbName of uqDbNames) {
                yield this.uqJob($uqDb, uqDbName, undefined);
            }
        });
    }
}
exports.Jobs = Jobs;
//# sourceMappingURL=jobs.js.map