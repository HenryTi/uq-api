import { Buses, EntityRunner, env } from "../core";
import { logger } from "../tool";
// import { execQueueAct } from "./execQueueAct";
import { PullBus } from "./pullBus";
import { QueueIn } from "./queueIn";
import { QueueOut } from "./queueOut";

export class UqJob {
    private readonly uqDbName: string;
    private readonly runner: EntityRunner;

    constructor(runner: EntityRunner) {
        this.runner = runner;
        this.uqDbName = runner.name;
    }

    async run(): Promise<number> {
        let retCount: number = 0;
        // let runner = await this.getRunnerFromDbName(uqDbName);
        // await this.buildRunnerFromDbName();
        // if (this.runner === undefined) return retCount;
        if (this.runner.isCompiling === true) return retCount;

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
            let ret = await this.runBusesJob(buses);
            if (ret < 0) return -1;
            retCount += ret;
        }
        if (env.isDevelopment === false) {
            // logger.info(`==== in loop ${uqDbName}: pullEntities ====`);
            // uq 间的entity同步，暂时屏蔽
            // await pullEntities(runner);
        }
        else {
            // logger.error('为了调试程序，pullEntities暂时屏蔽');
        }
        logger.info(`==== in loop ${this.uqDbName}: execQueueAct ====`);
        if (await this.runner.execQueueAct() < 0) return -1;
        // if (await execQueueAct(this.runner) < 0) return -1;
        logger.info(`###### end loop ${this.uqDbName} ######`);
        return retCount;
    }

    private async runBusesJob(buses: Buses): Promise<number> {
        let retCount = 0;
        let { outCount, faces } = buses;
        if (outCount > 0 || this.runner.hasSheet === true) {
            logger.info(`==== in loop ${this.uqDbName}: queueOut out bus number=${outCount} ====`);
            let ret = await new QueueOut(this.runner).run();
            if (ret < 0) return -1;
            retCount += ret;
        }
        if (faces !== undefined) {
            // logger.info(`==== in loop ${this.uqDbName}: pullBus faces: ${faces} ====`);
            let ret = await new PullBus(this.runner).run();
            if (ret < 0) return -1;
            retCount += ret;
            // logger.info(`==== in loop ${this.uqDbName}: queueIn faces: ${faces} ====`);
            ret = await new QueueIn(this.runner).run();
            if (ret < 0) return -1;
            retCount += ret;
        }
        return retCount;
    }

    /*
    private async devCheckJob(): Promise<boolean> {
        if (env.isDevelopment === false) return true;
        let dbName = this.runner.getDb();
        // 只有develop状态下,才做uqsInclude排除操作
        if (uqsInclude && uqsInclude.length > 0) {
            let index = uqsInclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
            if (index < 0) return false;
        }
        // uqsExclude操作
        if (uqsExclude && uqsExclude.length > 0) {
            let index = uqsExclude.findIndex(v => v.toLocaleLowerCase() === dbName.toLocaleLowerCase());
            if (index >= 0) return false;
        }

        await this.$uqDb.setDebugJobs();
        logger.info('========= set debugging jobs =========');
        return true;
    }
    */

    /**
     * 
     * @param uqDbName uq(即数据库)的名称
     * @returns 返回该uq的runner(可以执行该uq的存储过程等)
     */
    /*    
        private async buildRunnerFromDbName(): Promise<void> {
            let net: Net;
            let dbName: string;;
            if (this.uqDbName.endsWith($test) === true) {
                dbName = this.uqDbName.substring(0, this.uqDbName.length - $test.length);
                net = testNet;
            }
            else {
                dbName = this.uqDbName;
                net = prodNet;
            }
            this.runner = await net.getRunner(dbName);
        }
    */
}
