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
exports.buildBuildRouter = void 0;
const tool_1 = require("../../tool");
const core_1 = require("../../core");
const buildDbNameFromReq_1 = require("../buildDbNameFromReq");
function buildBuildRouter(router, rb) {
    let net = (0, core_1.getNet)();
    let dbs = (0, core_1.getDbs)();
    function createBuildRunner(req) {
        return __awaiter(this, void 0, void 0, function* () {
            // let uqName: string = req.params.db;
            // if (req.baseUrl.indexOf('/test/') >= 0) uqName += consts.$test;
            let dbName = (0, buildDbNameFromReq_1.buildDbNameFromReq)(req);
            let db = yield dbs.getDbUq(dbName /*uqName*/);
            return new core_1.BuildRunner(db);
        });
    }
    router.post('/start', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            yield net.runnerSetCompiling(runner.dbUq);
            let { enc } = req.body;
            (0, core_1.setUqBuildSecret)(enc);
            let exists = yield runner.buildDatabase();
            res.json({
                ok: true,
                res: {
                    exists,
                    twProfix: runner.dbUq.twProfix,
                }
            });
        }
        catch (err) {
            tool_1.logger.error(err);
            res.json({
                error: err,
            });
        }
    }));
    router.post('/build-database', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            let exists = yield runner.buildDatabase();
            res.json({
                ok: true,
                res: {
                    exists: exists,
                }
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    router.post('/finish', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            let { body } = req;
            let { uqId: paramUqId, uqVersion } = body;
            yield runner.finishBuildDb(req.user, paramUqId, uqVersion);
            res.json({
                ok: true,
            });
        }
        catch (err) {
            res.json({
                error: err,
            });
        }
    }));
    router.post('/sql', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            let { sql, params } = req.body;
            let result;
            if (Array.isArray(sql) === true) {
                for (let s of sql) {
                    result = yield runner.sql(s, params);
                }
            }
            else {
                result = yield runner.sql(sql, params);
            }
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            debugger;
            res.json({ error: err });
        }
    }));
    router.post('/proc-sql', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            let { name, proc } = req.body;
            let result = yield runner.procSql(name, proc);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            debugger;
            res.json({ error: err });
        }
    }));
    router.post('/proc-core-sql', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            let { name, proc, isFunc } = req.body;
            // let index = sqlsVersion.unsupportProcs.findIndex(v => v === name);
            let result;
            if (runner.dbUq.isUnsupportProc(name) === false) {
                result = yield runner.procCoreSql(name, proc, isFunc);
            }
            else {
                // debugger;
            }
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            debugger;
            res.json({ error: err });
        }
    }));
    router.post('/create-database', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            let result = yield runner.createDatabase();
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    /*
    rb.post(router, '/create-database',
    async (runner:EntityRunner, body:any): Promise<void> => {
        await runner.createDatabase();
    });
    */
    router.post('/exists-database', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            let result = yield runner.existsDatabase();
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    /*
    rb.post(router, '/exists-databse',
    async (runner:EntityRunner): Promise<boolean> => {
        return await runner.existsDatabase();
    });
    */
    //rb.post(router, '/set-setting',
    //async (runner:EntityRunner, body: {[name:string]: any}): Promise<void> => {
    router.post('/set-setting', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            let promises = [];
            let { body } = req;
            let service;
            for (let i in body) {
                let v = body[i];
                // 如果要设置null值，则必须传进null
                if (v === undefined)
                    continue;
                if (i === 'service')
                    service = v;
                promises.push(runner.setSetting(0, i, v));
            }
            yield Promise.all(promises);
            // 取units，还有id的start和end
            let units = yield core_1.centerApi.serviceUnit(service);
            yield runner.setUnitAdmin(units);
            // sectionCount 从已经保存的当前id，和id-section-end 来计算
            yield runner.refreshIDSection(service);
            res.json({
                ok: true,
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    //rb.get(router, '/setting',
    //async (runner:EntityRunner, body: {name:string}):Promise<string> => {
    router.get('/setting', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield createBuildRunner(req);
            let ret = yield runner.getSetting(0, req.query['name']);
            res.json({
                ok: true,
                res: ret
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    rb.get(router, '/entitys', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.loadSchemas(Number(body.hasSource));
    }));
    rb.post(router, '/entity', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { id, name, type, schema, run, source, from, open } = body;
        let ret = yield runner.saveSchema(0, 0, id, name, type, schema, run, source, from, open, body['private']);
        return ret;
    }));
    rb.get(router, '/const-strs', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let ret = yield runner.loadConstStrs();
        return ret;
    }));
    // to be removed in the future
    // const # is removed when use get
    rb.get(router, '/const-str', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.saveConstStr(body.type);
    }));
    rb.post(router, '/const-str', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.saveConstStr(body.type);
    }));
    rb.post(router, '/phrases', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { phrases, roles } = body;
        return yield runner.savePhrases(phrases, roles);
    }));
    rb.post(router, '/text-id', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.saveTextId(body.text);
    }));
    rb.get(router, '/entity-version', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { name, version } = body;
        return yield runner.loadSchemaVersion(name, version);
    }));
    rb.post(router, '/entity-validate', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { entities, valid } = body;
        return yield runner.setEntityValid(entities, valid);
    }));
}
exports.buildBuildRouter = buildBuildRouter;
;
//# sourceMappingURL=router.js.map