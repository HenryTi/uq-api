import * as jsonpack from 'jsonpack';
import { Router, Request, Response } from 'express';
import { RouterBuilder } from './routerBuilder';
import { UqRunner } from '../uq';
import { EntityRunner, Net } from '../core';

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
}


async function compile(runner: EntityRunner, clientSource: string, override: boolean, unit: number, user: number) {
    const uqRunner = new UqRunner(undefined, log);
    const msgs: string[] = [];
    function log(msg: string) {
        msgs.push(msg);
        return true;
    }
    let t = Date.now();
    let now: number;
    let step = 1;
    function logStep() {
        // now = Date.now();
        // console.log(`step${step++}`, now - t, now);
        // t = now;
    }
    logStep();
    let [objs, props] = await runner.unitUserTablesFromProc('GetBizObjects', unit, user);
    logStep();
    const { uq } = uqRunner;
    const { biz } = uq;
    let objNames: { [name: string]: any } = {};
    let objIds: { [id: number]: any } = {};
    for (let obj of objs) {
        const { id, phrase } = obj;
        objNames[phrase] = obj;
        objIds[id] = obj;
    }
    for (let prop of props) {
        const { id, phrase, base } = prop;
        const obj = objIds[base];
        let { props } = obj;
        if (props === undefined) {
            obj.props = props = [];
        }
        props.push(prop);
    }

    biz.bizArr.splice(0);
    uqRunner.parse(clientSource, 'upload');
    let bizArr = [...biz.bizArr];
    logStep();
    for (let obj of objs) {
        const { phrase, source } = obj;
        if (!source) continue;
        if (override === true) {
            if (bizArr.find(v => v.nameDotType === phrase) !== undefined) {
                continue;
            }
        }
        uqRunner.parse(source, phrase);
    }

    uqRunner.scan();
    // const schemas: any[] = [];
    logStep();
    await Promise.all(bizArr.map(entity => {
        return async function () {
            const { phrase, caption, source } = entity;
            const memo = undefined;
            // schemas.push(entitySchema);
            let [{ id }] = await runner.unitUserTableFromProc('SaveBizObject'
                , unit, user, phrase, caption, entity.getTypeNum(), memo, source
                , undefined);
            let obj = { id, phrase };
            objIds[id] = obj;
            objNames[phrase] = obj;
        }();
    }));
    /*
    for (let entity of bizArr) {
        // entity.buildSchema();
        const { phrase, caption, source } = entity;
        const memo = undefined;
        // schemas.push(entitySchema);
        let [{ id }] = await runner.unitUserTableFromProc('SaveBizObject'
            , unit, user, phrase, caption, entity.getTypeNum(), memo, source
            , undefined);
        let obj = { id, phrase };
        objIds[id] = obj;
        objNames[phrase] = obj;
    }
    */
    logStep();
    await Promise.all(bizArr.map(entity => {
        return async function () {
            let { id } = objNames[entity.phrase];
            let buds = entity.getAllBuds();
            await Promise.all(buds.map(v => {
                const { phrase, caption, memo, dataTypeNum, objName } = v;
                const typeNum = v.getTypeNum();
                let objId: number;
                if (objName !== undefined) {
                    const obj = objNames[objName];
                    if (obj !== undefined) {
                        objId = obj.id;
                    }
                }
                return runner.unitUserCall('SaveBizBud', unit, user, id, phrase, caption, typeNum, memo, dataTypeNum, objId);
            }));
        }();
    }));
    logStep();
    let schemas = uq.buildSchemas();
    logStep();
    return {
        schemas: jsonpack.pack(schemas.$biz), //: uqRunner.uq.biz.schema, //.bizArr.map(v => v.buildSchema()),
        logs: msgs,
    }
}
