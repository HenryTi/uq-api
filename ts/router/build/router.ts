import { Router, Request, Response } from 'express';
import { logger } from '../../tool';
import { BuildRunner, EntityRunner, setUqBuildSecret, centerApi, getDbs, getNet, consts } from '../../core';
import { RouterWebBuilder } from "../routerBuilder";
import { buildDbNameFromReq } from '../buildDbNameFromReq';

export function buildBuildRouter(router: Router, rb: RouterWebBuilder) {
    let net = getNet();
    let dbs = getDbs();
    async function createBuildRunner(req: Request): Promise<BuildRunner> {
        // let uqName: string = req.params.db;
        // if (req.baseUrl.indexOf('/test/') >= 0) uqName += consts.$test;
        let dbName = buildDbNameFromReq(req);
        let db = await dbs.getDbUq(dbName/*uqName*/);
        return new BuildRunner(db);
    }
    router.post('/start', async (req: Request, res: Response) => {
        try {
            let runner = await createBuildRunner(req);
            await net.runnerSetCompiling(runner.dbUq);
            let { enc } = req.body;
            setUqBuildSecret(enc);
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
            logger.error(err);
            res.json({
                error: err,
            });
        }
    });
    router.post('/build-database', async (req: Request, res: Response) => {
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

    router.post('/finish', async (req: Request, res: Response) => {
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

            let { user } = req as any;
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

    router.post('/sql', async (req: Request, res: Response) => {
        try {
            let runner = await createBuildRunner(req);
            let { sql, params } = req.body;
            let result = await runner.sql(sql, params);
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

    router.post('/proc-sql', async (req: Request, res: Response) => {
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
    router.post('/proc-core-sql', async (req: Request, res: Response) => {
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
    router.post('/create-database', async (req: Request, res: Response) => {
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
    router.post('/exists-database', async (req: Request, res: Response) => {
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
    router.post('/set-setting', async (req: Request, res: Response) => {
        try {
            let runner = await createBuildRunner(req);
            let promises: Promise<any>[] = [];
            let { body } = req;
            let service: any;
            for (let i in body) {
                let v = body[i];
                // 如果要设置null值，则必须传进null
                if (v === undefined) continue;
                if (i === 'service') service = v;
                promises.push(runner.setSetting(0, i, v));
            }
            await Promise.all(promises);

            // 取units，还有id的start和end
            let units = await centerApi.serviceUnit(service);
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
    router.get('/setting', async (req: Request, res: Response) => {
        try {
            let runner = await createBuildRunner(req);
            let ret = await runner.getSetting(0, req.query['name'] as string);
            res.json({
                ok: true,
                res: ret
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    });

    rb.get(router, '/entitys',
        async (runner: EntityRunner, body: { hasSource: string }): Promise<any[][]> => {
            //return await this.db.call('$entitys', [hasSource===true? 1:0]);
            return await runner.loadSchemas(Number(body.hasSource));
        });

    rb.post(router, '/entity',
        async (runner: EntityRunner, body: any): Promise<any> => {
            let { id, name, type, schema, run, source, from, open } = body;
            let ret = await runner.saveSchema(0, 0, id, name, type, schema, run, source, from, open, body['private']);
            return ret;
        });

    rb.get(router, '/const-strs',
        async (runner: EntityRunner, body: any): Promise<{ [name: string]: number }[]> => {
            return await runner.loadConstStrs();
        });

    // to be removed in the future
    // const # is removed when use get
    rb.get(router, '/const-str',
        async (runner: EntityRunner, body: { type: string }): Promise<number> => {
            return await runner.saveConstStr(body.type);
        });

    rb.post(router, '/const-str',
        async (runner: EntityRunner, body: { type: string }): Promise<number> => {
            return await runner.saveConstStr(body.type);
        });

    rb.post(router, '/text-id',
        async (runner: EntityRunner, body: { text: string }): Promise<number> => {
            return await runner.saveTextId(body.text);
        });

    rb.get(router, '/entity-version',
        async (runner: EntityRunner, body: { name: string; version: string }): Promise<string> => {
            let { name, version } = body;
            return await runner.loadSchemaVersion(name, version);
        });

    rb.post(router, '/entity-validate',
        async (runner: EntityRunner, body: { entities: string, valid: number }): Promise<any[]> => {
            let { entities, valid } = body;
            return await runner.setEntityValid(entities, valid);
        });
};
