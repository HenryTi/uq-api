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
exports.UqJob = void 0;
const core_1 = require("../core");
const tool_1 = require("../tool");
const execQueueAct_1 = require("./execQueueAct");
const pullBus_1 = require("./pullBus");
const queueIn_1 = require("./queueIn");
const queueOut_1 = require("./queueOut");
class UqJob {
    constructor(runner) {
        this.runner = runner;
        this.uqDbName = runner.getDb();
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            // let runner = await this.getRunnerFromDbName(uqDbName);
            // await this.buildRunnerFromDbName();
            // if (this.runner === undefined) return retCount;
            if (this.runner.isCompiling === true)
                return retCount;
            // if (await this.devCheckJob() === false) return retCount;
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
            // await this.runner.setCompileTick(this.compile_tick);
            let { buses } = this.runner;
            if (buses !== undefined) {
                let ret = yield this.runBusesJob(buses);
                if (ret < 0)
                    return -1;
                retCount += ret;
            }
            if (core_1.env.isDevelopment === false) {
                // logger.info(`==== in loop ${uqDbName}: pullEntities ====`);
                // uq 间的entity同步，暂时屏蔽
                // await pullEntities(runner);
            }
            else {
                // logger.error('为了调试程序，pullEntities暂时屏蔽');
            }
            tool_1.logger.info(`==== in loop ${this.uqDbName}: execQueueAct ====`);
            if ((yield (0, execQueueAct_1.execQueueAct)(this.runner)) < 0)
                return -1;
            tool_1.logger.info(`###### end loop ${this.uqDbName} ######`);
            return retCount;
        });
    }
    runBusesJob(buses) {
        return __awaiter(this, void 0, void 0, function* () {
            let retCount = 0;
            let { outCount, faces } = buses;
            if (outCount > 0 || this.runner.hasSheet === true) {
                tool_1.logger.info(`==== in loop ${this.uqDbName}: queueOut out bus number=${outCount} ====`);
                let ret = yield new queueOut_1.QueueOut(this.runner).run();
                if (ret < 0)
                    return -1;
                retCount += ret;
            }
            if (faces !== undefined) {
                // logger.info(`==== in loop ${this.uqDbName}: pullBus faces: ${faces} ====`);
                let ret = yield new pullBus_1.PullBus(this.runner).run();
                if (ret < 0)
                    return -1;
                retCount += ret;
                // logger.info(`==== in loop ${this.uqDbName}: queueIn faces: ${faces} ====`);
                ret = yield new queueIn_1.QueueIn(this.runner).run();
                if (ret < 0)
                    return -1;
                retCount += ret;
            }
            return retCount;
        });
    }
}
exports.UqJob = UqJob;
//# sourceMappingURL=uqJob.js.map