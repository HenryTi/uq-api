"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBuildRouter = void 0;
const tool_1 = require("../../tool");
const core_1 = require("../../core");
const buildDbNameFromReq_1 = require("../buildDbNameFromReq");
function buildBuildRouter(router, rb) {
    let net = (0, core_1.getNet)();
    let dbs = (0, core_1.getDbs)();
    async function createBuildRunner(req) {
        // let uqName: string = req.params.db;
        // if (req.baseUrl.indexOf('/test/') >= 0) uqName += consts.$test;
        let dbName = (0, buildDbNameFromReq_1.buildDbNameFromReq)(req);
        let db = await dbs.getDbUq(dbName /*uqName*/);
        return new core_1.BuildRunner(db);
    }
    router.post('/start', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
            await net.runnerSetCompiling(runner.dbUq);
            let { enc } = req.body;
            (0, core_1.setUqBuildSecret)(enc);
            let exists = await runner.buildDatabase();
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
    });
    router.post('/build-database', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
            let exists = await runner.buildDatabase();
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
    });
    router.post('/finish', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
            let { uqId: paramUqId, uqVersion } = req.body;
            await Promise.all([
                runner.setSetting(0, 'uqId', String(paramUqId)),
                runner.setSetting(0, 'uqVersion', String(uqVersion)),
            ]);
            await runner.initSetting();
            await net.resetRunnerAfterCompile(runner.dbUq);
            // await net.resetRunnerAfterCompile(db);
            let { user } = req;
            if (user) {
                let id = user.id;
                if (id) {
                    await runner.setUqOwner(id);
                    await runner.syncCenterUser(id);
                }
            }
            res.json({
                ok: true,
            });
        }
        catch (err) {
            res.json({
                error: err,
            });
        }
    });
    router.post('/sql', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
            let { sql, params } = req.body;
            let result;
            if (Array.isArray(sql) === true) {
                for (let s of sql) {
                    result = await runner.sql(s, params);
                }
            }
            else {
                result = await runner.sql(sql, params);
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
    });
    router.post('/proc-sql', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
            let { name, proc } = req.body;
            let result = await runner.procSql(name, proc);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            debugger;
            res.json({ error: err });
        }
    });
    /*
        rb.post(router, '/proc-sql',
        async (runner:EntityRunner, body:{name:string, proc:string}): Promise<any> => {
            //return this.db.sql(sql, params);
            let {name, proc} = body;
            return await runner.procSql(name, proc);
        });
    */
    router.post('/proc-core-sql', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
            let { name, proc, isFunc } = req.body;
            let result = await runner.procCoreSql(name, proc, isFunc);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            debugger;
            res.json({ error: err });
        }
    });
    router.post('/create-database', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
            let result = await runner.createDatabase();
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    });
    /*
    rb.post(router, '/create-database',
    async (runner:EntityRunner, body:any): Promise<void> => {
        await runner.createDatabase();
    });
    */
    router.post('/exists-database', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
            let result = await runner.existsDatabase();
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    });
    /*
    rb.post(router, '/exists-databse',
    async (runner:EntityRunner): Promise<boolean> => {
        return await runner.existsDatabase();
    });
    */
    //rb.post(router, '/set-setting',
    //async (runner:EntityRunner, body: {[name:string]: any}): Promise<void> => {
    router.post('/set-setting', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
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
            await Promise.all(promises);
            // 取units，还有id的start和end
            let units = await core_1.centerApi.serviceUnit(service);
            await runner.setUnitAdmin(units);
            // sectionCount 从已经保存的当前id，和id-section-end 来计算
            await runner.refreshIDSection(service);
            res.json({
                ok: true,
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    });
    //rb.get(router, '/setting',
    //async (runner:EntityRunner, body: {name:string}):Promise<string> => {
    router.get('/setting', async (req, res) => {
        try {
            let runner = await createBuildRunner(req);
            let ret = await runner.getSetting(0, req.query['name']);
            res.json({
                ok: true,
                res: ret
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    });
    rb.get(router, '/entitys', async (runner, body) => {
        //return await this.db.call('$entitys', [hasSource===true? 1:0]);
        return await runner.loadSchemas(Number(body.hasSource));
    });
    rb.post(router, '/entity', async (runner, body) => {
        let { id, name, type, schema, run, source, from, open } = body;
        let ret = await runner.saveSchema(0, 0, id, name, type, schema, run, source, from, open, body['private']);
        return ret;
    });
    rb.get(router, '/const-strs', async (runner, body) => {
        return await runner.loadConstStrs();
    });
    // to be removed in the future
    // const # is removed when use get
    rb.get(router, '/const-str', async (runner, body) => {
        return await runner.saveConstStr(body.type);
    });
    rb.post(router, '/const-str', async (runner, body) => {
        return await runner.saveConstStr(body.type);
    });
    rb.post(router, '/text-id', async (runner, body) => {
        return await runner.saveTextId(body.text);
    });
    rb.get(router, '/entity-version', async (runner, body) => {
        let { name, version } = body;
        return await runner.loadSchemaVersion(name, version);
    });
    rb.post(router, '/entity-validate', async (runner, body) => {
        let { entities, valid } = body;
        return await runner.setEntityValid(entities, valid);
    });
}
exports.buildBuildRouter = buildBuildRouter;
;
//# sourceMappingURL=router.js.map