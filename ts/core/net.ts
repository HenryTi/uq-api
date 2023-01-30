import { env, logger } from '../tool';
import { EntityRunner } from "./runner";
import { Db, getDbs, DbUq } from "./db";
import { OpenApi } from "./openApi";
import { centerApi } from "./centerApi";
import { getUrlDebug } from "./getUrlDebug";
// import { Unitx } from "./unitx";
import { consts } from './consts';
import { Dbs } from './db/Dbs';
import { Request } from 'express';

export class Net {
    // private readonly id: string;
    private readonly runners: { [name: string]: EntityRunner } = {};
    private readonly executingNet: Net;  // 编译Net指向对应的执行Net，编译完成后，reset runner
    private readonly dbs: Dbs;
    private readonly unitxTestName: string;
    //protected readonly unitx: Unitx;

    constructor(executingNet: Net) {
        this.executingNet = executingNet;
        this.dbs = getDbs();
        let { $unitx } = consts;
        this.unitxTestName = `/${$unitx}-test/`;
        // this.id = id;
        //        this.unitx = this.createUnitx();
    }
    /*
        protected abstract createUnitx(): Unitx;
        protected abstract getUrl(db: string, url: string): string;
        protected abstract chooseUrl(urls: { url: string; urlTest: string }): string;
        abstract get isTesting(): boolean;
        abstract getUqFullName(uq: string): string;
        abstract getDbName(name: string): string;
    */
    /**
     * 
     * @param name uq(即数据库)的名称
     * @returns 
     */
    protected async innerRunner(name: string): Promise<EntityRunner> {
        name = name.toLowerCase();
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {
            // let db = getDbContainer(dbName);
            // db.isTesting = this.isTesting;
            runner = await this.createRunnerFromDbName(name);
            if (runner === undefined) {
                this.runners[name] = null;
                return;
            }
            this.runners[name] = runner;
        }
        return runner;
    }

    /**
     * 
     * @param name  uq(即数据库)的名称
     * @returns 返回该uq的runner(可以执行该uq的存储过程等)
     */
    async getRunner(name: string): Promise<EntityRunner> {
        let runner = await this.innerRunner(name);
        if (runner === undefined) return;
        // 执行版的net，this.execeutingNet undefined，所以需要init
        if (this.executingNet === undefined) {
            await runner.init();
        }
        return runner;
    }

    async runnerSetCompiling(db: Db) {
        for (let i in this.runners) {
            let runner: EntityRunner = this.runners[i];
            if (!runner) continue;
            if (runner.equDb(db) === true) runner.isCompiling = true;
        }
    }

    async resetRunnerAfterCompile(db: Db) {
        let runners: EntityRunner[] = [];
        for (let i in this.runners) {
            let runner: EntityRunner = this.runners[i];
            if (!runner) continue;
            if (runner.equDb(db) === true) runners.push(runner);
        }

        for (let runner of runners) {
            await runner.buildTuidAutoId();
            await this.resetRunner(runner);
            logger.error('=== resetRunnerAfterCompile: ' + runner.dbName);
        }

        if (this.executingNet !== undefined) {
            this.executingNet.resetRunnerAfterCompile(db);
            logger.error('=== executingNet resetRunnerAfterCompile: ' + db.name);
        }
    }

    private async resetRunner(runner: EntityRunner) {
        let runnerName = runner.dbName;
        for (let i in this.runners) {
            if (i !== runnerName) continue;
            let runner = this.runners[i];
            if (runner) {
                await runner.reset();
                logger.error('--- === --- === ' + runnerName + ' resetRunner ' + ' net');
                this.runners[i] = undefined;
            }
        }
    }

    async getUnitxRunner(req: Request): Promise<EntityRunner> {
        let name = consts.$unitx;
        let $name = '$' + name;
        if (req.baseUrl.indexOf(this.unitxTestName) >= 0) {
            $name += consts.$test;
        }
        let runner = this.runners[$name];
        if (runner === null) return;
        if (runner === undefined) {
            runner = await this.createRunnerFromDbName(name);
            if (runner === undefined) {
                this.runners[$name] = null;
                return;
            }
            else {
                this.runners[$name] = runner;
            }
        }
        // 执行版的net，this.execeutingNet undefined，所以需要init
        if (this.executingNet === undefined) {
            await runner.init();
        }
        return runner;
    }

    private createRunnerFromDbPromises: { [name: string]: { resolve: (value?: any) => void, reject: (reason?: any) => void }[] } = {};

    /**
     * 
     * @param dbName uq(即数据库)的名称
     * @param db 
     * @returns 返回该db的EntityRunner(可以执行有关该db的存储过程等) 
     */
    protected async createRunnerFromDbName(dbName: string): Promise<EntityRunner> {
        // let dbName = this.getDbName(name);
        let db = await this.dbs.getDbUq(dbName);
        return await this.createRunnerFromDb(db);
    }

    protected async createRunnerFromDb(db: DbUq): Promise<EntityRunner> {
        return await new Promise<EntityRunner>(async (resolve, reject) => {
            const dbName = db.name;
            let promiseArr = this.createRunnerFromDbPromises[dbName];
            if (promiseArr !== undefined) {
                promiseArr.push({ resolve, reject });
                return undefined;
            }
            this.createRunnerFromDbPromises[dbName] = promiseArr = [{ resolve, reject }];
            let runner: EntityRunner;
            try {
                let isExists = await db.existsDatabase();
                if (isExists === false) {
                    runner = undefined;
                }
                else {
                    runner = new EntityRunner(db, this);
                }
                for (let promiseItem of this.createRunnerFromDbPromises[dbName]) {
                    promiseItem.resolve(runner);
                }
                this.createRunnerFromDbPromises[dbName] = undefined;
            }
            catch (reason) {
                for (let promiseItem of this.createRunnerFromDbPromises[dbName]) {
                    promiseItem.reject(reason);
                }
                this.createRunnerFromDbPromises[dbName] = undefined;
            }
            return runner;
        });
    }

    private uqOpenApis: { [uqFullName: string]: { [unit: number]: OpenApi } } = {};
    private getOpenApiFromCache(uqFullName: string, unit: number): OpenApi {
        let openApis = this.uqOpenApis[uqFullName];
        if (openApis === null) return null;
        if (openApis !== undefined) {
            let ret = openApis[unit];
            if (ret === null) return null;
            if (ret !== undefined) return ret;
        }
        else {
            this.uqOpenApis[uqFullName] = openApis = {};
        }
        return undefined;
    }
    private async buildOpenApiFrom(runner: EntityRunner, uqFullName: string, unit: number, uqUrl: { db: string, url: string, urlTest: string }): Promise<OpenApi> {
        let openApis = this.uqOpenApis[uqFullName];
        let url = await this.getUqUrlOrDebug(runner, uqUrl);
        url = url.toLowerCase();
        let openApi = new OpenApi(url);
        openApis[unit] = openApi;
        return openApi;
    }
    async openApiUnitUq(runner: EntityRunner, unit: number, uqFullName: string): Promise<OpenApi> {
        let openApi = this.getOpenApiFromCache(uqFullName, unit);
        if (openApi === null) {
            logger.error('openApiUnitUq null ', uqFullName, unit);
            return null;
        }
        if (openApi !== undefined) return openApi;
        let uqUrl = await centerApi.urlFromUq(unit, uqFullName);
        if (!uqUrl) {
            logger.error('openApiUnitUq centerApi.urlFromUq not exists', uqFullName, unit);
            let openApis = this.uqOpenApis[uqFullName];
            if (openApis) {
                openApis[unit] = null;
            }
            return null;
        }
        return await this.buildOpenApiFrom(runner, uqFullName, unit, uqUrl);
    }

    async openApiUnitFace(runner: EntityRunner, unit: number, busOwner: string, busName: string, face: string): Promise<OpenApi> {
        let ret = await centerApi.unitFaceUrl(unit, busOwner, busName, face);
        if (ret === undefined) {
            throw `openApi unit face not exists: unit=${unit}, face=${busOwner}/${busName}/${face}`;
        }
        let row: any;
        let len = ret.length;
        for (let i = 0; i < len; i++) {
            let r = ret[i];
            let { method } = r;
            // 2 is query bus
            if ((method & 2) === 2) {
                if (row !== undefined) {
                    throw `multiple bus-query for unit=${unit} bus=${busOwner}/${busName}/${face}`;
                }
                row = r;
            }
        }
        if (row === undefined) {
            throw `no bus-query for unit=${unit} bus=${busOwner}/${busName}/${face}`;
        }
        /*
        switch (ret.length) {
            case 0:
                throw `no bus-query for unit=${unit} bus=${busOwner}/${busName}/${face}`;
            case 1: break;
            default:
                throw `multiple bus-query for unit=${unit} bus=${busOwner}/${busName}/${face}`;
        }
        */
        let uqUrl = row;
        let { uq } = uqUrl;
        let openApi = this.getOpenApiFromCache(uq, unit);
        if (openApi !== undefined) return openApi;
        openApi = await this.buildOpenApiFrom(runner, uq, unit, uqUrl);
        return openApi;
    }
    /*
        async sendToUnitx(unit: number, msg: Message): Promise<number[] | string> {
            return await this.unitx.sendToUnitx(unit, msg);
        }
    
        async pullBus(unit: number, maxId: number, faces: string, defer: number): Promise<any[][]> {
            return await this.unitx.pullBus(unit, maxId, faces, defer);
        }

    async uqUrl(unit: number, uq: number): Promise<string> {
        let uqUrl = await centerApi.uqUrl(unit, uq);
        return await this.getUqUrlOrDebug(uqUrl);
    }
    */
    private async getUqUrlOrDebug(runner: EntityRunner, urls: { db: string; url: string; urlTest: string }): Promise<string> {
        let { isTesting } = runner.dbUq;
        let { db, urlTest, url: urlProd } = urls;
        let testOrProd: string;
        let url: string;
        if (isTesting === true) {
            testOrProd = 'test';
            url = urlTest;
        }
        else {
            testOrProd = 'prod';
            url = urlProd;
        }

        if (env.isDevelopment === true) {
            let urlDebug = await getUrlDebug();
            if (urlDebug !== undefined) url = urlDebug;
        }
        // return this.getUrl(db, url);
        return `${url}uq/${testOrProd}/${db}/`;
    }
}

let net: Net;
let compileNet: Net;
export function getNet(): Net {
    if (net === undefined) {
        net = new Net(undefined);
        compileNet = new Net(net);
    }
    return net;
}
export function getCompileNet(): Net {
    getNet();
    return compileNet;
}
