import * as jsonpack from 'jsonpack';
import { Router, Request, Response } from 'express';
import { RouterBuilder } from './routerBuilder';
import { UqRunner } from '../uq';
import { EntityRunner, Net } from '../core';
import { BizSiteBuilder } from '../uq/bizSiteBuilder';

const actionType = 'compile';

export function buildCompileRouter(router: Router, rb: RouterBuilder) {
    router.get('/compile/hello', async (req: Request, res: Response) => {
        res.json({
            ok: true,
            res: {
                route: 'compile',
                sub: 'hello',
            }
        });
    });

    rb.entityPost(router, actionType, '/override',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { source } = body;
            const compile = new CompileSource(runner, source, unit, user, true);
            const ret = await compile.run();
            return ret
        });

    rb.entityPost(router, actionType, '/append',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { source } = body;
            const compile = new CompileSource(runner, source, unit, user, false);
            const ret = await compile.run();
            return ret
        });

    rb.entityPost(router, actionType, '/entity',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            try {
                const { id, code } = body;
                const compile = new CompileEntity(runner, code, unit, user, id);
                const ret = await compile.run();
                return ret;
            }
            catch (err) {
                return {
                    hasError: true,
                    logs: [err.message],
                }
            }
        });

    rb.entityPost(router, actionType, '/biz',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const compile = new CompileSource(runner, undefined, unit, user, false);
            const ret = await compile.run();
            return ret
        });

}

abstract class Compile {
    readonly runner: EntityRunner;
    readonly code: string;
    readonly site: number;
    readonly user: number;
    readonly msgs: string[] = [];

    constructor(runner: EntityRunner, code: string, site: number, user: number) {
        this.runner = runner;
        this.code = code;
        this.site = site;
        this.user = user;
    }

    abstract get override(): boolean;
    protected setUqRunnerEntityId(uqRunner: UqRunner): void { }
    protected setBizSiteBuilderEntityId(bizSiteBuilder: BizSiteBuilder): boolean { return true; }

    async run() {
        const uqRunner = new UqRunner(undefined, this.log);
        this.setUqRunnerEntityId(uqRunner);
        let [objs, props] = await this.runner.unitUserTablesFromProc('GetBizObjects', this.site, this.user, 'zh', 'cn');
        const { uq } = uqRunner;
        const { biz } = uq;
        const bizSiteBuilder = new BizSiteBuilder(biz, this.runner, this.site, this.user);
        await bizSiteBuilder.loadObjects(objs, props);

        if (this.code) {
            for (let source of bizSiteBuilder.sysEntitySources) {
                uqRunner.parse(source, '$sys', true);
            }

            uqRunner.parse(this.code, 'upload');
            let isIdNewOk = uqRunner.anchorLatest();
            let isIdNameOk = this.setBizSiteBuilderEntityId(bizSiteBuilder);
            if (isIdNewOk === false || isIdNameOk === false) {
                return {
                    logs: this.msgs,
                    hasError: false,
                }
            }
        }
        for (let obj of objs) {
            const { id, phrase, source } = obj;
            if (!source) continue;
            if (this.override === true) {
                if (uqRunner.isLatest(phrase) === true) continue;
            }
            uqRunner.parse(source, phrase);
            let entity = uqRunner.uq.biz.bizEntities.get(phrase);
            if (entity !== undefined) entity.id = id;
        }
        uqRunner.scan();
        if (uqRunner.ok === false) {
            return {
                logs: this.msgs,
                hasError: true,
            }
        }

        await bizSiteBuilder.build(this.log);
        let schemas = bizSiteBuilder.buildSchemas();
        return {
            schemas: jsonpack.pack(schemas.$biz),
            logs: this.msgs,
            hasError: false,
        }
    }

    readonly log = (msg: string) => {
        this.msgs.push(msg);
        return true;
    }
}

class CompileEntity extends Compile {
    id: number;
    readonly override = true;
    constructor(runner: EntityRunner, code: string, site: number, user: number, id: number) {
        super(runner, code, site, user);
        this.id = id;
    }

    protected override setUqRunnerEntityId(uqRunner: UqRunner): void {
        uqRunner.setEntityId(this.id);
    }

    protected override setBizSiteBuilderEntityId(bizSiteBuilder: BizSiteBuilder): boolean {
        return bizSiteBuilder.setEntityId(this.id);
    }
}

class CompileSource extends Compile {
    readonly override: boolean;
    constructor(runner: EntityRunner, code: string, site: number, user: number, override: boolean) {
        super(runner, code, site, user);
        this.override = override;
    }
}
/*
async function compileEntity(runner: EntityRunner, id: number, code: string, unit: number, user: number) {
}

async function compile(runner: EntityRunner, clientSource: string, override: boolean, unit: number, user: number) {
    const msgs: string[] = [];
    function log(msg: string) {
        msgs.push(msg);
        return true;
    }
    const uqRunner = new UqRunner(undefined, log);
    let [objs, props] = await runner.unitUserTablesFromProc('GetBizObjects', unit, user, 'zh', 'cn');
    const { uq } = uqRunner;
    const { biz } = uq;
    const bizSiteBuilder = new BizSiteBuilder(biz, runner, unit, user);
    await bizSiteBuilder.loadObjects(objs, props);

    if (clientSource) {
        for (let source of bizSiteBuilder.sysEntitySources) {
            uqRunner.parse(source, '$sys', true);
        }

        uqRunner.parse(clientSource, 'upload');
        uqRunner.anchorLatest();
    }
    for (let obj of objs) {
        const { id, phrase, source } = obj;
        if (!source) continue;
        if (override === true) {
            if (uqRunner.isLatest(phrase) === true) continue;
        }
        uqRunner.parse(source, phrase);
        let entity = uqRunner.uq.biz.bizEntities.get(phrase);
        if (entity !== undefined) entity.id = id;
    }
    uqRunner.scan();
    if (uqRunner.ok === false) {
        return {
            logs: msgs,
            hasError: true,
        }
    }

    await bizSiteBuilder.build(log);
    let schemas = bizSiteBuilder.buildSchemas();
    return {
        schemas: jsonpack.pack(schemas.$biz),
        logs: msgs,
        hasError: false,
    }
}
*/
