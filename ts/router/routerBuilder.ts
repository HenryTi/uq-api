import { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../tool';
import { EntityRunner } from '../core/runner';
import { Net, } from '../core/net';
import { buildDbNameFromReq } from './buildDbNameFromReq';

type Processer = (runner: EntityRunner, body: any, urlParams: any, userToken?: User) => Promise<any>;
type EntityProcesser = (unit: number, user: number, name: string, db: string, urlParams: any,
    runner: EntityRunner, body: any, schema: any, run: any, net?: Net) => Promise<any>;

export interface User {
    db: string;
    id: number;
    unit: number;
    roles: string;
};

export abstract class RouterBuilder {
    protected net: Net;
    constructor(net: Net) {
        this.net = net;
    }

    post(router: Router, path: string, processer: Processer) {
        router.post(path, async (req: Request, res: Response, next: NextFunction) => {
            try {
                let { body, params } = req;
                await this.process(req, res, processer, body, params);
            }
            catch (err) {
                console.error('/post error', err);
                next(err);
            }
        });
    };

    get(router: Router, path: string, processer: Processer) {
        router.get(path, async (req: Request, res: Response, next: NextFunction) => {
            try {
                let { query, params } = req;
                await this.process(req, res, processer, query, params);
            }
            catch (err) {
                next(err);
            }
        })
    };

    put(router: Router, path: string, processer: Processer) {
        router.put(path, async (req: Request, res: Response, next: NextFunction) => {
            try {
                let { body, params } = req;
                await this.process(req, res, processer, body, params);
            }
            catch (err) {
                next(err);
            }
        })
    };
    // getDbName(name: string): string { return this.net.getDbName(name); }
    protected async routerRunner(req: Request): Promise<EntityRunner> {
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

    private process = async (req: Request, res: Response, processer: Processer, queryOrBody: any, params: any): Promise<void> => {
        try {
            let runner = await this.routerRunner(req);
            if (!runner) {
                res.json({
                    err: {
                        error: 'runner not found for ' + req.originalUrl,
                    }
                });
                return;
            }
            let userToken: User = (req as any).user;
            let result = await processer(runner, queryOrBody, params, userToken);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            console.error('process in routerBuilder error', err);
            res.json({ error: err });
        }
    }

    entityPost(router: Router, entityType: string, path: string, processer: EntityProcesser) {
        router.post(`/${entityType}${path}`, async (req: Request, res: Response) => {
            await this.entityHttpProcess(req, res, entityType, processer, false);
        });
    };

    entityGet(router: Router, entityType: string, path: string, processer: EntityProcesser) {
        router.get(`/${entityType}${path}`, async (req: Request, res: Response) => {
            await this.entityHttpProcess(req, res, entityType, processer, true);
        });
    };

    entityDownload(router: Router, entityType: string, path: string, processer: EntityProcesser) {
        router.get(`/${entityType}${path}`, async (req: Request, res: Response) => {
            await this.entityHttpDownload(req, res, entityType, processer, true);
        });
    };

    entityPut(router: Router, entityType: string, path: string, processer: EntityProcesser) {
        router.put(`/${entityType}${path}`, async (req: Request, res: Response) => {
            await this.entityHttpProcess(req, res, entityType, processer, false);
        });
    };

    protected abstract entityHttpProcess(req: Request, res: Response, entityType: string, processer: EntityProcesser, isGet: boolean): Promise<void>;
    protected abstract entityHttpDownload(req: Request, res: Response, entityType: string, processer: EntityProcesser, isGet: boolean): Promise<void>;

    protected async checkRunner(req: Request): Promise<EntityRunner> {
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
        let db = buildDbNameFromReq(req);
        let runner = await this.net.getRunner(db);
        if (runner !== undefined) return runner;
        throw `Database ${db} 不存在`;
    }

    async getRunner(name: string): Promise<EntityRunner> {
        return await this.net.getRunner(name);
    }

    async getUnitxRunner(req: Request): Promise<EntityRunner> {
        return await this.net.getUnitxRunner(req);
    }

    protected unknownEntity(res: Response, name: string, runner: EntityRunner) {
        res.json({ error: `uq:${runner.dbName} unknown entity ${name}` });
    }

    protected validEntity(res: Response, schema: any, type: string): boolean {
        if (schema.type === type) return true;
        if (type === 'schema') return true;
        res.json({ error: schema.name + ' is not ' + type });
        return false;
    }

}

export class RouterWebBuilder extends RouterBuilder {
    protected async entityHttpProcess(req: Request, res: Response, entityType: string, processer: EntityProcesser, isGet: boolean): Promise<void> {
        let time = Date.now();
        try {
            let userToken: User = (req as any).user;
            let { id: userId, unit, roles } = userToken;
            let runner = await this.checkRunner(req);
            if (runner === undefined) return;
            let db = runner.dbName;
            let { params } = req;
            let { name } = params;
            let call: any, run: any;
            let result: any;
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
            let modifyMax: any;
            let $uq: any;
            let app = req.header('app');
            let $roles: any;
            if (roles) {
                $roles = await runner.getRoles(unit, app, userId, roles);
            }
            let entityVersion = Number(req.header('en') ?? 0);
            let uqVersion = Number(req.header('uq') ?? 0);
            let eqEntity = call?.version === entityVersion || entityVersion === 0;
            let eqUq = runner.uqVersion === uqVersion || uqVersion === 0;
            if (eqEntity === true && eqUq === true) {
                let body = isGet === true ? (req as any).query : (req as any).body;
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
            logger.error(err);
            res.json({ error: err });
        }
        finally {
            logger.debug('done:', req.originalUrl, Date.now() - time, 'ms');
        }
    }

    protected async entityHttpDownload(req: Request, res: Response, entityType: string, processer: EntityProcesser, isGet: boolean): Promise<void> {
        try {
            let userToken: User = (req as any).user;
            let { /*db, */id: userId, unit, roles } = userToken;
            //if (db === undefined) db = consts.$unitx;
            let runner = await this.checkRunner(req);
            if (runner === undefined) return;
            let db = runner.dbName;
            let { params } = req;
            let { name } = params;
            let call: any, run: any;
            let body = isGet === true ? (req as any).query : (req as any).body;
            let result = await processer(unit, userId, name, db, params, runner, body, call, run, this.net);
            res.send(result);
        }
        catch (err) {
            logger.error(err);
            res.json({ error: err });
        }
    }
}

export class RouterLocalBuilder extends RouterBuilder {
    protected async entityHttpProcess(req: Request, res: Response, entityType: string, processer: EntityProcesser, isGet: boolean): Promise<void> {
        let time = Date.now();
        try {
            let sUnit = req.header('unit');
            let unit: number = sUnit ? Number(sUnit) : 24;
            let userId = 0;
            let runner = await this.checkRunner(req);
            if (runner === undefined) return;
            let { params } = req;
            let { name } = params;
            let call: any, run: any;
            if (name !== undefined) {
                name = name.toLowerCase();
                let schema = runner.getSchema(name);
                if (schema === undefined) {
                    return this.unknownEntity(res, name, runner);
                }
                call = schema.call;
                run = schema.run;
                if (this.validEntity(res, call, entityType) === false) return;
            }
            let body = isGet === true ? (req as any).query : (req as any).body;
            let result = await processer(unit, userId, name, runner.dbName, params, runner, body, call, run, this.net);
            res.json({
                ok: true,
                res: result,
            });
        }
        catch (err) {
            logger.error(err);
            res.json({ error: err });
        }
        finally {
            logger.debug('done:', req.originalUrl, Date.now() - time, 'ms');
        }
    }

    protected async entityHttpDownload(req: Request, res: Response, entityType: string, processer: EntityProcesser, isGet: boolean): Promise<void> {
        throw new Error('entityHttpDownload local version is not implemented');
    }
}

export class CompileRouterBuilder extends RouterWebBuilder {
}

export class UnitxRouterBuilder extends RouterWebBuilder {
    protected async routerRunner(req: Request): Promise<EntityRunner> {
        let runner = await this.net.getUnitxRunner(req);
        if (runner !== undefined) return runner;
        throw `Database $unitx 不存在`;
    }
}

export class ApiRouterBuilder extends RouterWebBuilder {
}