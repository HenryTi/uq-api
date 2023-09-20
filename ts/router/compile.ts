import * as jsonpack from 'jsonpack';
import { Router, Request, Response } from 'express';
import { RouterBuilder } from './routerBuilder';
import { UqRunner } from '../uq';
import { EntityRunner, Net } from '../core';
import { Biz, BizAtom, BizEntity } from '../uq/il';
import { BUq, DbContext } from '../uq/builder';
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

    /*
    rb.entityPost(router, actionType, '/source',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { source } = body;
            const ret = await compile(runner, source, true, unit, user);
            return ret
        });
    */
    rb.entityPost(router, actionType, '/override',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { source } = body;
            const ret = await compile(runner, source, true, unit, user);
            return ret
        });

    rb.entityPost(router, actionType, '/append',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { source } = body;
            const ret = await compile(runner, source, false, unit, user);
            return ret
        });

    rb.entityPost(router, actionType, '/biz',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const ret = await compile(runner, undefined, false, unit, user);
            return ret
        });

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
        const { phrase, source } = obj;
        if (!source) continue;
        if (override === true) {
            if (uqRunner.isLatest(phrase) === true) continue;
        }
        uqRunner.parse(source, phrase);
    }
    uqRunner.scan();
    if (uqRunner.ok === false) {
        return {
            logs: msgs,
        }
    }

    await bizSiteBuilder.build(log);
    let schemas = bizSiteBuilder.buildSchemas();
    return {
        schemas: jsonpack.pack(schemas.$biz),
        logs: msgs,
    }
}
