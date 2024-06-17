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
exports.ApiRouterBuilder = exports.UnitxRouterBuilder = exports.CompileRouterBuilder = exports.RouterLocalBuilder = exports.RouterWebBuilder = exports.RouterBuilder = void 0;
const tool_1 = require("../tool");
const buildDbNameFromReq_1 = require("./buildDbNameFromReq");
;
class RouterBuilder {
    constructor(net) {
        this.process = (req, res, processer, queryOrBody, params) => __awaiter(this, void 0, void 0, function* () {
            try {
                let runner = yield this.routerRunner(req);
                if (!runner) {
                    res.json({
                        err: {
                            error: 'runner not found for ' + req.originalUrl,
                        }
                    });
                    return;
                }
                let userToken = req.user;
                let result = yield processer(runner, queryOrBody, params, userToken);
                res.json({
                    ok: true,
                    res: result
                });
            }
            catch (err) {
                console.error('process in routerBuilder error', err);
                res.json({ error: err });
            }
        });
        this.net = net;
    }
    post(router, path, processer) {
        router.post(path, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                let { body, params } = req;
                yield this.process(req, res, processer, body, params);
            }
            catch (err) {
                console.error('/post error', err);
                next(err);
            }
        }));
    }
    ;
    get(router, path, processer) {
        router.get(path, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                let { query, params } = req;
                yield this.process(req, res, processer, query, params);
            }
            catch (err) {
                next(err);
            }
        }));
    }
    ;
    put(router, path, processer) {
        router.put(path, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                let { body, params } = req;
                yield this.process(req, res, processer, body, params);
            }
            catch (err) {
                next(err);
            }
        }));
    }
    ;
    // getDbName(name: string): string { return this.net.getDbName(name); }
    routerRunner(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let runner = yield this.checkRunner(req);
            let uqVersion = req.header('tonwa-uq-version');
            if (uqVersion === undefined) {
                uqVersion = req.header('tonva-uq-version');
            }
            if (uqVersion !== undefined) {
                let n = Number(uqVersion);
                if (n !== Number.NaN) {
                    runner.checkUqVersion(n);
                }
            }
            return runner;
        });
    }
    entityPost(router, entityType, path, processer) {
        router.post(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityHttpProcess(req, res, entityType, processer, false);
        }));
    }
    ;
    entityGet(router, entityType, path, processer) {
        router.get(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityHttpProcess(req, res, entityType, processer, true);
        }));
    }
    ;
    entityDownload(router, entityType, path, processer) {
        router.get(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityHttpDownload(req, res, entityType, processer, true);
        }));
    }
    ;
    entityPut(router, entityType, path, processer) {
        router.put(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityHttpProcess(req, res, entityType, processer, false);
        }));
    }
    ;
    checkRunner(req) {
        return __awaiter(this, void 0, void 0, function* () {
            /*
            let { params, path } = req;
            let { db } = params;
            const test = '/test/';
            let p = path.indexOf('/test/');
            if (p >= 0) {
                p += test.length;
                if (path.substring(p, p + db.length) === db) {
                    db += consts.$test;
                }
            }
            */
            let db = (0, buildDbNameFromReq_1.buildDbNameFromReq)(req);
            let runner = yield this.net.getRunner(db);
            if (runner !== undefined)
                return runner;
            throw `Database ${db} 不存在`;
        });
    }
    getRunner(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.net.getRunner(name);
        });
    }
    getUnitxRunner(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.net.getUnitxRunner(req);
        });
    }
    unknownEntity(res, name, runner) {
        res.json({ error: `uq:${runner.dbName} unknown entity ${name}` });
    }
    validEntity(res, schema, type) {
        if (schema.type === type)
            return true;
        if (type === 'schema')
            return true;
        res.json({ error: schema.name + ' is not ' + type });
        return false;
    }
}
exports.RouterBuilder = RouterBuilder;
class RouterWebBuilder extends RouterBuilder {
    entityHttpProcess(req, res, entityType, processer, isGet) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                let userToken = req.user;
                let { /*db, */ id: userId, unit, roles } = userToken;
                //if (db === undefined) db = consts.$unitx;
                let runner = yield this.checkRunner(req);
                if (runner === undefined)
                    return;
                let db = runner.dbName;
                let { params } = req;
                let { name } = params;
                let call, run;
                let result;
                if (name !== undefined) {
                    if (name === '$user') {
                        call = runner.$userSchema;
                        run = {};
                        result = yield processer(unit, userId, name, db, params, runner, req.body, call, run, this.net);
                        res.json({
                            ok: true,
                            res: result,
                        });
                        return;
                    }
                    name = name.toLowerCase();
                    let schema = runner.getSchema(name);
                    if (schema === undefined) {
                        return this.unknownEntity(res, name, runner);
                    }
                    call = schema.call;
                    run = schema.run;
                    if (this.validEntity(res, call, entityType) === false) {
                        return;
                    }
                }
                let modifyMax;
                let $uq;
                let app = req.header('app');
                let $roles;
                if (roles) {
                    $roles = yield runner.getRoles(unit, app, userId, roles);
                }
                let entityVersion = Number((_a = req.header('en')) !== null && _a !== void 0 ? _a : 0);
                let uqVersion = Number((_b = req.header('uq')) !== null && _b !== void 0 ? _b : 0);
                let eqEntity = (call === null || call === void 0 ? void 0 : call.version) === entityVersion || entityVersion === 0;
                let eqUq = runner.uqVersion === uqVersion || uqVersion === 0;
                if (eqEntity === true && eqUq === true) {
                    let body = isGet === true ? req.query : req.body;
                    result = yield processer(unit, userId, name, db, params, runner, body, call, run, this.net);
                }
                else {
                    $uq = {};
                    if (eqEntity === false) {
                        $uq.entity = call;
                    }
                    if (eqUq === false) {
                        let access = yield runner.getAccesses(unit, userId, undefined);
                        $uq.uq = access;
                    }
                }
                modifyMax = yield runner.getModifyMax(unit);
                res.json({
                    ok: true,
                    res: result,
                    $modify: modifyMax,
                    $uq: $uq,
                    $roles: $roles,
                });
            }
            catch (err) {
                tool_1.logger.error(err);
                res.json({ error: err });
            }
        });
    }
    entityHttpDownload(req, res, entityType, processer, isGet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let userToken = req.user;
                let { /*db, */ id: userId, unit, roles } = userToken;
                //if (db === undefined) db = consts.$unitx;
                let runner = yield this.checkRunner(req);
                if (runner === undefined)
                    return;
                let db = runner.dbName;
                let { params } = req;
                let { name } = params;
                let call, run;
                let body = isGet === true ? req.query : req.body;
                let result = yield processer(unit, userId, name, db, params, runner, body, call, run, this.net);
                res.send(result);
            }
            catch (err) {
                tool_1.logger.error(err);
                res.json({ error: err });
            }
        });
    }
}
exports.RouterWebBuilder = RouterWebBuilder;
class RouterLocalBuilder extends RouterBuilder {
    entityHttpProcess(req, res, entityType, processer, isGet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //let userToken: User = (req as any).user;
                //let { db, id: userId, unit, roles } = userToken;
                //if (db === undefined) db = consts.$unitx;
                // let db = req.params.db;
                let sUnit = req.header('unit');
                let unit = sUnit ? Number(sUnit) : 24;
                let userId = 0;
                let runner = yield this.checkRunner(req);
                if (runner === undefined)
                    return;
                let { params } = req;
                let { name } = params;
                let call, run;
                if (name !== undefined) {
                    name = name.toLowerCase();
                    let schema = runner.getSchema(name);
                    if (schema === undefined) {
                        return this.unknownEntity(res, name, runner);
                    }
                    call = schema.call;
                    run = schema.run;
                    if (this.validEntity(res, call, entityType) === false)
                        return;
                }
                let body = isGet === true ? req.query : req.body;
                let result = yield processer(unit, userId, name, runner.dbName, params, runner, body, call, run, this.net);
                res.json({
                    ok: true,
                    res: result,
                });
            }
            catch (err) {
                tool_1.logger.error(err);
                res.json({ error: err });
            }
        });
    }
    entityHttpDownload(req, res, entityType, processer, isGet) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('entityHttpDownload local version is not implemented');
        });
    }
}
exports.RouterLocalBuilder = RouterLocalBuilder;
class CompileRouterBuilder extends RouterWebBuilder {
}
exports.CompileRouterBuilder = CompileRouterBuilder;
class UnitxRouterBuilder extends RouterWebBuilder {
    routerRunner(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let runner = yield this.net.getUnitxRunner(req);
            if (runner !== undefined)
                return runner;
            throw `Database $unitx 不存在`;
        });
    }
}
exports.UnitxRouterBuilder = UnitxRouterBuilder;
class ApiRouterBuilder extends RouterWebBuilder {
}
exports.ApiRouterBuilder = ApiRouterBuilder;
//# sourceMappingURL=routerBuilder.js.map