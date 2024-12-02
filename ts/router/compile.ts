import { Router, Request, Response } from 'express';
import { randomBytes } from "crypto";
import { RouterBuilder } from './routerBuilder';
import { EntityRunner, Net } from '../core';
import { compileBiz, compileSingle, compileSource, compileDelEntity, compileRename, compileDownload } from '../uq/compile';
import { to62 } from '../tool';

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
            const ret = await compileSource(runner, unit, user, source)
            // const compile = new CompileSource(runner, source, unit, user, true);
            // const ret = await compile.run();
            return ret
        });

    rb.entityPost(router, actionType, '/append',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { source } = body;
            const ret = await compileSource(runner, unit, user, source)
            //const compile = new CompileSource(runner, source, unit, user, false);
            // const ret = await compile.run();
            return ret
        });

    rb.entityPost(router, actionType, '/entity',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { id, code } = body;
            const ret = await compileSingle(runner, unit, user, id, code);
            return ret;
        });

    rb.entityPost(router, actionType, '/rename',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { id, name: entityName } = body;
            let ret = await compileRename(runner, unit, user, id, entityName);
            return ret;
        });

    rb.entityPost(router, actionType, '/del-entity',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { id } = body;
            let ret = await compileDelEntity(runner, unit, user, id);
            return ret;
        });

    rb.entityPost(router, actionType, '/biz',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            let ret = await compileBiz(runner, unit, user);
            return ret
        });

    rb.entityDownload(router, actionType, '/source',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            let ret = await compileDownload(runner, unit, user, undefined);
            return ret;
        });

    rb.entityDownload(router, actionType, '/source/:file',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            let ret = await compileDownload(runner, unit, user, urlParams.file);
            return ret;
        });

    rb.entityPost(router, actionType, '/app-key',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            const { ioSite, atom, app, valid } = body;
            let ret = await runner.call('SetIOSiteAtomApp', [0, 0, ioSite, atom, app, valid]);
            const [{ id: siteAtomApp }] = ret;
            let appKey: string, appPassword: string;
            if (valid === 1) {
                appKey = siteAtomAppToAppKey(siteAtomApp);
                appPassword = createPassword();
                await runner.call('SetIOSiteAtomAppKey', [0, 0, siteAtomApp, appKey, appPassword]);
            }
            return {
                siteAtomApp,
                appKey,
                appPassword,
            }
        });
}

function createPassword() {
    let rand = randomBytes(20).toString('base64').substring(0, 16);
    return rand;
}

function siteAtomAppToAppKey(siteAtomApp: number) {
    let bufRand = randomBytes(1);
    let salt = bufRand.readUInt8();
    let saa = salt * 0x10000000000 + siteAtomApp;
    let appKey = to62(saa);
    return appKey;
}
