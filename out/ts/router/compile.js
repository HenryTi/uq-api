"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompileRouter = void 0;
const jsonpack = require("jsonpack");
const uq_1 = require("../uq");
const actionType = 'compile';
function buildCompileRouter(router, rb) {
    router.get('/compile/hello', async (req, res) => {
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
    rb.entityPost(router, actionType, '/override', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { source } = body;
        const ret = await compile(runner, source, true, unit, user);
        return ret;
    });
    rb.entityPost(router, actionType, '/append', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { source } = body;
        const ret = await compile(runner, source, false, unit, user);
        return ret;
    });
    rb.entityPost(router, actionType, '/biz', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const ret = await compile(runner, undefined, false, unit, user);
        return ret;
    });
}
exports.buildCompileRouter = buildCompileRouter;
async function compile(runner, clientSource, override, unit, user) {
    const uqRunner = new uq_1.UqRunner(undefined, log);
    const msgs = [];
    function log(msg) {
        msgs.push(msg);
        return true;
    }
    let t = Date.now();
    let now;
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
    let objNames = {};
    let objIds = {};
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
        if (!source)
            continue;
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
        };
    }
    logStep();
    await Promise.all(bizArr.map(entity => {
        return async function () {
            const { phrase, caption, source } = entity;
            const memo = undefined;
            let [{ id }] = await runner.unitUserTableFromProc('SaveBizObject', unit, user, phrase, caption, entity.typeNum, memo, source, undefined);
            let obj = { id, phrase };
            objIds[id] = obj;
            objNames[phrase] = obj;
        }();
    }));
    await Promise.all(bizArr.map(entity => {
        return async function () {
            const { phrase, caption, source } = entity;
            const memo = undefined;
            let [{ id }] = await runner.unitUserTableFromProc('SaveBizObject', unit, user, phrase, caption, entity.typeNum, memo, source, undefined);
            let obj = { id, phrase };
            objIds[id] = obj;
            objNames[phrase] = obj;
        }();
    }));
    const atomPairs = getAtomBasePairs(biz, bizArr);
    // const pairs = atomPairs.map(v => ([v[0].phrase, v[1].phrase]));
    await runner.unitUserTableFromProc('SaveBizIX', unit, user, JSON.stringify(atomPairs));
    await Promise.all(bizArr.map(entity => {
        return async function () {
            let { id } = objNames[entity.phrase];
            let buds = entity.getAllBuds();
            await Promise.all(buds.map(v => {
                return async function () {
                    const { phrase, caption, memo, dataTypeNum, objName } = v;
                    const typeNum = v.typeNum;
                    let objId;
                    if (objName !== undefined) {
                        const obj = objNames[objName];
                        if (obj !== undefined) {
                            objId = obj.id;
                        }
                    }
                    await runner.unitUserCall('SaveBizBud', unit, user, id, phrase, caption, typeNum, memo, dataTypeNum, objId);
                }();
            }));
        }();
    }));
    logStep();
    let schemas = uq.buildSchemas();
    logStep();
    return {
        schemas: jsonpack.pack(schemas.$biz),
        logs: msgs,
    };
}
function getAtomBasePairs(biz, arrNew) {
    const pairs = [];
    const coll = {};
    const pairColl = {};
    for (const entity of arrNew) {
        if (entity.type !== 'atom')
            continue;
        const bizAtom = entity;
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
        if (entity.type !== 'atom')
            continue;
        const bizAtom = entity;
        if (pairColl[bizAtom.name] !== undefined)
            continue;
        const { base } = bizAtom;
        if (base === undefined)
            continue;
        if (coll[base.name] === undefined)
            continue;
        pairs.push([base.phrase, bizAtom.phrase]);
    }
    return pairs;
}
//# sourceMappingURL=compile.js.map