"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompileNet = exports.getNet = exports.Net = void 0;
const tool_1 = require("../tool");
const runner_1 = require("./runner");
const db_1 = require("./db");
const openApi_1 = require("./openApi");
const centerApi_1 = require("./centerApi");
const getUrlDebug_1 = require("./getUrlDebug");
// import { Unitx } from "./unitx";
const consts_1 = require("./consts");
class Net {
    //protected readonly unitx: Unitx;
    constructor(executingNet) {
        // private readonly id: string;
        this.runners = {};
        this.createRunnerFromDbPromises = {};
        this.uqOpenApis = {};
        this.executingNet = executingNet;
        this.dbs = (0, db_1.getDbs)();
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
    async innerRunner(name) {
        name = name.toLowerCase();
        let runner = this.runners[name];
        if (runner === null)
            return;
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
    async getRunner(name) {
        let runner = await this.innerRunner(name);
        if (runner === undefined)
            return;
        // 执行版的net，this.execeutingNet undefined，所以需要init
        if (this.executingNet === undefined) {
            await runner.init();
        }
        return runner;
    }
    async runnerSetCompiling(db) {
        for (let i in this.runners) {
            let runner = this.runners[i];
            if (!runner)
                continue;
            if (runner.equDb(db) === true)
                runner.isCompiling = true;
        }
    }
    async resetRunnerAfterCompile(db) {
        let runners = [];
        for (let i in this.runners) {
            let runner = this.runners[i];
            if (!runner)
                continue;
            if (runner.equDb(db) === true)
                runners.push(runner);
        }
        for (let runner of runners) {
            await runner.buildTuidAutoId();
            await this.resetRunner(runner);
            tool_1.logger.error('=== resetRunnerAfterCompile: ' + runner.dbName);
        }
        if (this.executingNet !== undefined) {
            this.executingNet.resetRunnerAfterCompile(db);
            tool_1.logger.error('=== executingNet resetRunnerAfterCompile: ' + db.name);
        }
    }
    async resetRunner(runner) {
        let runnerName = runner.dbName;
        for (let i in this.runners) {
            if (i !== runnerName)
                continue;
            let runner = this.runners[i];
            if (runner) {
                await runner.reset();
                tool_1.logger.error('--- === --- === ' + runnerName + ' resetRunner ' + ' net');
                this.runners[i] = undefined;
            }
        }
    }
    async getUnitxRunner() {
        let name = consts_1.consts.$unitx;
        let $name = '$' + name;
        let runner = this.runners[$name];
        if (runner === null)
            return;
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
    /**
     *
     * @param dbName uq(即数据库)的名称
     * @param db
     * @returns 返回该db的EntityRunner(可以执行有关该db的存储过程等)
     */
    async createRunnerFromDbName(dbName) {
        // let dbName = this.getDbName(name);
        let db = await this.dbs.getDbUq(dbName);
        return await this.createRunnerFromDb(db);
    }
    async createRunnerFromDb(db) {
        return await new Promise(async (resolve, reject) => {
            const dbName = db.name;
            let promiseArr = this.createRunnerFromDbPromises[dbName];
            if (promiseArr !== undefined) {
                promiseArr.push({ resolve, reject });
                return undefined;
            }
            this.createRunnerFromDbPromises[dbName] = promiseArr = [{ resolve, reject }];
            let runner;
            try {
                let isExists = await db.existsDatabase();
                if (isExists === false) {
                    runner = undefined;
                }
                else {
                    runner = new runner_1.EntityRunner(db, this);
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
    getOpenApiFromCache(uqFullName, unit) {
        let openApis = this.uqOpenApis[uqFullName];
        if (openApis === null)
            return null;
        if (openApis !== undefined) {
            let ret = openApis[unit];
            if (ret === null)
                return null;
            if (ret !== undefined)
                return ret;
        }
        else {
            this.uqOpenApis[uqFullName] = openApis = {};
        }
        return undefined;
    }
    async buildOpenApiFrom(runner, uqFullName, unit, uqUrl) {
        let openApis = this.uqOpenApis[uqFullName];
        let url = await this.getUqUrlOrDebug(runner, uqUrl);
        url = url.toLowerCase();
        let openApi = new openApi_1.OpenApi(url);
        openApis[unit] = openApi;
        return openApi;
    }
    async openApiUnitUq(runner, unit, uqFullName) {
        let openApi = this.getOpenApiFromCache(uqFullName, unit);
        if (openApi === null) {
            tool_1.logger.error('openApiUnitUq null ', uqFullName, unit);
            return null;
        }
        if (openApi !== undefined)
            return openApi;
        let uqUrl = await centerApi_1.centerApi.urlFromUq(unit, uqFullName);
        if (!uqUrl) {
            tool_1.logger.error('openApiUnitUq centerApi.urlFromUq not exists', uqFullName, unit);
            let openApis = this.uqOpenApis[uqFullName];
            if (openApis) {
                openApis[unit] = null;
            }
            return null;
        }
        return await this.buildOpenApiFrom(runner, uqFullName, unit, uqUrl);
    }
    async openApiUnitFace(runner, unit, busOwner, busName, face) {
        let ret = await centerApi_1.centerApi.unitFaceUrl(unit, busOwner, busName, face);
        if (ret === undefined) {
            throw `openApi unit face not exists: unit=${unit}, face=${busOwner}/${busName}/${face}`;
        }
        let row;
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
        if (openApi !== undefined)
            return openApi;
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
    async getUqUrlOrDebug(runner, urls) {
        let { isTesting } = runner.dbUq;
        let { db, urlTest, url: urlProd } = urls;
        let testOrProd;
        let url;
        if (isTesting === true) {
            testOrProd = 'test';
            url = urlTest;
        }
        else {
            testOrProd = 'prod';
            url = urlProd;
        }
        if (tool_1.env.isDevelopment === true) {
            let urlDebug = await (0, getUrlDebug_1.getUrlDebug)();
            if (urlDebug !== undefined)
                url = urlDebug;
        }
        // return this.getUrl(db, url);
        return `${url}uq/${testOrProd}/${db}/`;
    }
}
exports.Net = Net;
let net;
let compileNet;
function getNet() {
    if (net === undefined) {
        net = new Net(undefined);
        compileNet = new Net(net);
    }
    return net;
}
exports.getNet = getNet;
function getCompileNet() {
    getNet();
    return compileNet;
}
exports.getCompileNet = getCompileNet;
//# sourceMappingURL=net.js.map