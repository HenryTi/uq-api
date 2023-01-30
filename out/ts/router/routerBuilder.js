"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitxRouterBuilder = exports.CompileRouterBuilder = exports.RouterLocalBuilder = exports.RouterWebBuilder = exports.RouterBuilder = void 0;
const tool_1 = require("../tool");
const buildDbNameFromReq_1 = require("./buildDbNameFromReq");
;
class RouterBuilder {
    constructor(net) {
        this.process = async (req, res, processer, queryOrBody, params) => {
            try {
                let runner = await this.routerRunner(req);
                if (runner === undefined)
                    return;
                let userToken = req.user;
                let result = await processer(runner, queryOrBody, params, userToken);
                res.json({
                    ok: true,
                    res: result
                });
            }
            catch (err) {
                res.json({ error: err });
            }
        };
        this.net = net;
    }
    post(router, path, processer) {
        router.post(path, async (req, res, next) => {
            try {
                let { body, params } = req;
                await this.process(req, res, processer, body, params);
            }
            catch (err) {
                console.error('/post error', err);
                next(err);
            }
        });
    }
    ;
    get(router, path, processer) {
        router.get(path, async (req, res, next) => {
            try {
                let { query, params } = req;
                await this.process(req, res, processer, query, params);
            }
            catch (err) {
                next(err);
            }
        });
    }
    ;
    put(router, path, processer) {
        router.put(path, async (req, res, next) => {
            try {
                let { body, params } = req;
                await this.process(req, res, processer, body, params);
            }
            catch (err) {
                next(err);
            }
        });
    }
    ;
    // getDbName(name: string): string { return this.net.getDbName(name); }
    async routerRunner(req) {
        let runner = await this.checkRunner(req);
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
    }
    entityPost(router, entityType, path, processer) {
        router.post(`/${entityType}${path}`, async (req, res) => {
            await this.entityHttpProcess(req, res, entityType, processer, false);
        });
    }
    ;
    entityGet(router, entityType, path, processer) {
        router.get(`/${entityType}${path}`, async (req, res) => {
            await this.entityHttpProcess(req, res, entityType, processer, true);
        });
    }
    ;
    entityPut(router, entityType, path, processer) {
        router.put(`/${entityType}${path}`, async (req, res) => {
            await this.entityHttpProcess(req, res, entityType, processer, false);
        });
    }
    ;
    async checkRunner(req) {
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
        let runner = await this.net.getRunner(db);
        if (runner !== undefined)
            return runner;
        throw `Database ${db} 不存在`;
    }
    async getRunner(name) {
        return await this.net.getRunner(name);
    }
    async getUnitxRunner(req) {
        return await this.net.getUnitxRunner(req);
    }
    unknownEntity(res, name, runner) {
        res.json({ error: `uq:${runner.dbName} unknown entity ${name} all entities:${runner.getEntityNameList()}` });
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
    async entityHttpProcess(req, res, entityType, processer, isGet) {
        try {
            let userToken = req.user;
            let { /*db, */ id: userId, unit, roles } = userToken;
            //if (db === undefined) db = consts.$unitx;
            let runner = await this.checkRunner(req);
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
                    result = await processer(unit, userId, name, db, params, runner, req.body, call, run, this.net);
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
                $roles = await runner.getRoles(unit, app, userId, roles);
            }
            let entityVersion = req.header('en');
            let uqVersion = req.header('uq');
            let eqEntity = entityVersion === undefined || call.version === Number(entityVersion);
            let eqUq = uqVersion === undefined || runner.uqVersion === Number(uqVersion);
            if (eqEntity === true && eqUq === true) {
                let body = isGet === true ? req.query : req.body;
                result = await processer(unit, userId, name, db, params, runner, body, call, run, this.net);
            }
            else {
                $uq = {};
                if (eqEntity === false) {
                    $uq.entity = call;
                }
                if (eqUq === false) {
                    let access = await runner.getAccesses(unit, userId, undefined);
                    $uq.uq = access;
                }
            }
            modifyMax = await runner.getModifyMax(unit);
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
    }
}
exports.RouterWebBuilder = RouterWebBuilder;
class RouterLocalBuilder extends RouterBuilder {
    async entityHttpProcess(req, res, entityType, processer, isGet) {
        try {
            //let userToken: User = (req as any).user;
            //let { db, id: userId, unit, roles } = userToken;
            //if (db === undefined) db = consts.$unitx;
            // let db = req.params.db;
            let sUnit = req.header('unit');
            let unit = sUnit ? Number(sUnit) : 24;
            let userId = 0;
            let runner = await this.checkRunner(req);
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
            let result = await processer(unit, userId, name, runner.dbName, params, runner, body, call, run, this.net);
            res.json({
                ok: true,
                res: result,
            });
        }
        catch (err) {
            tool_1.logger.error(err);
            res.json({ error: err });
        }
    }
}
exports.RouterLocalBuilder = RouterLocalBuilder;
class CompileRouterBuilder extends RouterWebBuilder {
}
exports.CompileRouterBuilder = CompileRouterBuilder;
class UnitxRouterBuilder extends RouterWebBuilder {
    async routerRunner(req) {
        let runner = await this.net.getUnitxRunner(req);
        if (runner !== undefined)
            return runner;
        throw `Database ${runner.dbName} 不存在`;
    }
}
exports.UnitxRouterBuilder = UnitxRouterBuilder;
//# sourceMappingURL=routerBuilder.js.map