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
        this.unitxTestName = '/unitx-test';
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
    innerRunner(name) {
        return __awaiter(this, void 0, void 0, function* () {
            name = name.toLowerCase();
            let runner = this.runners[name];
            if (runner === null)
                return;
            if (runner === undefined) {
                // let db = getDbContainer(dbName);
                // db.isTesting = this.isTesting;
                runner = yield this.createRunnerFromDbName(name);
                if (runner === undefined) {
                    this.runners[name] = null;
                    return;
                }
                this.runners[name] = runner;
            }
            return runner;
        });
    }
    /**
     *
     * @param name  uq(即数据库)的名称
     * @returns 返回该uq的runner(可以执行该uq的存储过程等)
     */
    getRunner(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let runner = yield this.innerRunner(name);
            if (runner === undefined)
                return;
            // 执行版的net，this.execeutingNet undefined，所以需要init
            if (this.executingNet === undefined) {
                yield runner.init();
            }
            return runner;
        });
    }
    runnerSetCompiling(db) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i in this.runners) {
                let runner = this.runners[i];
                if (!runner)
                    continue;
                if (runner.equDb(db) === true)
                    runner.isCompiling = true;
            }
        });
    }
    resetRunnerAfterCompile(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let runners = [];
            for (let i in this.runners) {
                let runner = this.runners[i];
                if (!runner)
                    continue;
                if (runner.equDb(db) === true)
                    runners.push(runner);
            }
            for (let runner of runners) {
                yield runner.buildTuidAutoId();
                yield this.resetRunner(runner);
                tool_1.logger.debug('=== resetRunnerAfterCompile: ' + runner.dbName);
            }
            if (this.executingNet !== undefined) {
                this.executingNet.resetRunnerAfterCompile(db);
                tool_1.logger.debug('=== executingNet resetRunnerAfterCompile: ' + db.name);
            }
        });
    }
    resetRunner(runner) {
        return __awaiter(this, void 0, void 0, function* () {
            let runnerName = runner.dbName;
            for (let i in this.runners) {
                if (i !== runnerName)
                    continue;
                let runner = this.runners[i];
                if (runner) {
                    yield runner.reset();
                    tool_1.logger.debug('--- === --- === ' + runnerName + ' resetRunner ' + ' net');
                    this.runners[i] = undefined;
                }
            }
        });
    }
    getUnitxRunner(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let name = consts_1.consts.$unitx;
            if (req.baseUrl.indexOf(this.unitxTestName) >= 0) {
                name += consts_1.consts.$test;
            }
            let runner = this.runners[name];
            if (runner === null)
                return;
            if (runner === undefined) {
                runner = yield this.createRunnerFromDbName(name);
                if (runner === undefined) {
                    this.runners[name] = null;
                    return;
                }
                else {
                    this.runners[name] = runner;
                }
            }
            // 执行版的net，this.execeutingNet undefined，所以需要init
            if (this.executingNet === undefined) {
                yield runner.init();
            }
            return runner;
        });
    }
    /**
     *
     * @param dbName uq(即数据库)的名称
     * @param db
     * @returns 返回该db的EntityRunner(可以执行有关该db的存储过程等)
     */
    createRunnerFromDbName(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            // let dbName = this.getDbName(name);
            let db = yield this.dbs.getDbUq(dbName);
            return yield this.createRunnerFromDb(db);
        });
    }
    createRunnerFromDb(db) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const dbName = db.name;
                let promiseArr = this.createRunnerFromDbPromises[dbName];
                if (promiseArr !== undefined) {
                    promiseArr.push({ resolve, reject });
                    return undefined;
                }
                this.createRunnerFromDbPromises[dbName] = promiseArr = [{ resolve, reject }];
                let runner;
                try {
                    let isExists = yield db.existsDatabase();
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
            }));
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
    buildOpenApiFrom(runner, uqFullName, unit, uqUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            let openApis = this.uqOpenApis[uqFullName];
            let url = yield this.getUqUrlOrDebug(runner, uqUrl);
            url = url.toLowerCase();
            let openApi = new openApi_1.OpenApi(url);
            openApis[unit] = openApi;
            return openApi;
        });
    }
    openApiUnitUq(runner, unit, uqFullName) {
        return __awaiter(this, void 0, void 0, function* () {
            let openApi = this.getOpenApiFromCache(uqFullName, unit);
            if (openApi === null) {
                tool_1.logger.error('openApiUnitUq null ', uqFullName, unit);
                return null;
            }
            if (openApi !== undefined)
                return openApi;
            let uqUrl = yield centerApi_1.centerApi.urlFromUq(unit, uqFullName);
            if (!uqUrl) {
                tool_1.logger.error('openApiUnitUq centerApi.urlFromUq not exists', uqFullName, unit);
                let openApis = this.uqOpenApis[uqFullName];
                if (openApis) {
                    openApis[unit] = null;
                }
                return null;
            }
            return yield this.buildOpenApiFrom(runner, uqFullName, unit, uqUrl);
        });
    }
    openApiUnitFace(runner, unit, busOwner, busName, face) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield centerApi_1.centerApi.unitFaceUrl(unit, busOwner, busName, face);
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
            let uqUrl = row;
            let { uq } = uqUrl;
            let openApi = this.getOpenApiFromCache(uq, unit);
            if (openApi !== undefined)
                return openApi;
            openApi = yield this.buildOpenApiFrom(runner, uq, unit, uqUrl);
            return openApi;
        });
    }
    getUqUrlOrDebug(runner, urls) {
        return __awaiter(this, void 0, void 0, function* () {
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
                let urlDebug = yield (0, getUrlDebug_1.getUrlDebug)();
                if (urlDebug !== undefined)
                    url = urlDebug;
            }
            // return this.getUrl(db, url);
            return `${url}uq/${testOrProd}/${db}/`;
        });
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