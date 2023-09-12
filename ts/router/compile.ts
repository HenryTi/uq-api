import * as jsonpack from 'jsonpack';
import { Router, Request, Response } from 'express';
import { RouterBuilder } from './routerBuilder';
import { UqRunner } from '../uq';
import { EntityRunner, Net } from '../core';
import { Biz, BizAtom, BizEntity, BizOptions, OptionsItem, OptionsItemValueType } from '../uq/il';

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
    if (clientSource) {
        uqRunner.parse(clientSource, 'upload');
    }
    let bizArr = [...biz.bizArr];
    logStep();
    for (let obj of objs) {
        const { phrase, source } = obj;
        if (!source) continue;
        if (override === true) {
            if (bizArr.find(v => v.name === phrase) !== undefined) {
                continue;
            }
        }
        uqRunner.parse(source, phrase);
    }

    uqRunner.scan();
    if (uqRunner.ok === false) {
        return {
            logs: msgs,
        }
    }
    logStep();
    await Promise.all(bizArr.map(entity => {
        return async function () {
            const { phrase, caption, source } = entity;
            const memo = undefined;
            let [{ id }] = await runner.unitUserTableFromProc('SaveBizObject'
                , unit, user, phrase, caption, entity.typeNum, memo, source
                , undefined);
            let obj = { id, phrase };
            objIds[id] = obj;
            objNames[phrase] = obj;
        }();
    }));
    await Promise.all(bizArr.map(entity => {
        return async function () {
            const { phrase, caption, source } = entity;
            const memo = undefined;
            let [{ id }] = await runner.unitUserTableFromProc('SaveBizObject'
                , unit, user, phrase, caption, entity.typeNum, memo, source
                , undefined);
            let obj = { id, phrase };
            objIds[id] = obj;
            objNames[phrase] = obj;
        }();
    }));
    const atomPairs = getAtomBasePairs(biz, bizArr);
    // const pairs = atomPairs.map(v => ([v[0].phrase, v[1].phrase]));
    await runner.unitUserTableFromProc('SaveBizIX'
        , unit, user, JSON.stringify(atomPairs));
    await Promise.all(bizArr.map(entity => {
        return async function () {
            let { id } = objNames[entity.phrase];
            let buds = entity.getAllBuds();
            await Promise.all(buds.map(v => {
                return async function () {
                    const { phrase, caption, memo, dataTypeNum, objName } = v;
                    const typeNum = v.typeNum;
                    let objId: number;
                    if (objName !== undefined) {
                        const obj = objNames[objName];
                        if (obj !== undefined) {
                            objId = obj.id;
                        }
                    }
                    await runner.unitUserCall('SaveBizBud'
                        , unit, user, id, phrase, caption
                        , typeNum, memo, dataTypeNum, objId
                    );
                }();
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

function getAtomBasePairs(biz: Biz, arrNew: BizEntity[]) {
    const pairs: [string, string][] = [];
    const coll: { [name: string]: BizAtom } = {};
    const pairColl: { [name: string]: BizAtom } = {};
    for (const entity of arrNew) {
        if (entity.type !== 'atom') continue;
        const bizAtom = entity as BizAtom;
        const { name } = bizAtom;
        coll[name] = bizAtom;
        const { base } = bizAtom;
        if (base === undefined) {
            pairs.push(['', bizAtom.phrase]);
        }
        else {
            pairs.push([base.phrase, bizAtom.phrase]);
        }
        pairColl[name] = bizAtom;
    }

    for (const [, entity] of biz.bizEntities) {
        if (entity.type !== 'atom') continue;
        const bizAtom = entity as BizAtom;
        if (pairColl[bizAtom.name] !== undefined) continue;
        const { base } = bizAtom;
        if (base === undefined) continue;
        if (coll[base.name] === undefined) continue;
        pairs.push([base.phrase, bizAtom.phrase]);
    }
    return pairs;
}
