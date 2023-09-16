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
    let [objs, props] = await runner.unitUserTablesFromProc('GetBizObjects', unit, user, 'zh', 'cn');
    const { uq } = uqRunner;
    const { biz } = uq;
    const res = {};
    let objNames = {};
    let objIds = {};
    for (let obj of objs) {
        const { id, phrase, caption } = obj;
        objNames[phrase] = obj;
        objIds[id] = obj;
        res[phrase] = caption;
    }
    for (let prop of props) {
        const { id, phrase, base, caption } = prop;
        const obj = objIds[base];
        let { props } = obj;
        if (props === undefined) {
            obj.props = props = [];
        }
        props.push(prop);
        res[phrase] = caption;
    }
    biz.bizArr.splice(0);
    if (clientSource) {
        uqRunner.parse(clientSource, 'upload');
    }
    let bizArr = [...biz.bizArr];
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
    await Promise.all(bizArr.map(entity => {
        return async function () {
            const { type, phrase, caption, source } = entity;
            const memo = undefined;
            let sqlIdFromKeyArr;
            if (type === 'atom') {
                sqlIdFromKeyArr = entity.sqlIdFromKeyArr;
            }
            let [{ id }] = await runner.unitUserTableFromProc('SaveBizObject', unit, user, phrase, caption, entity.typeNum, memo, source, undefined, sqlIdFromKeyArr);
            let obj = { id, phrase };
            objIds[id] = obj;
            objNames[phrase] = obj;
        }();
    }));
    const atomPairs = getAtomExtendsPairs(biz, bizArr);
    await runner.unitUserTableFromProc('SaveBizIX', unit, user, JSON.stringify(atomPairs));
    await Promise.all(bizArr.map(entity => {
        return async function () {
            let { id } = objNames[entity.phrase];
            let buds = entity.getAllBuds();
            await Promise.all(buds.map(v => {
                return async function () {
                    const { phrase, caption, memo, dataTypeNum, objName, flag } = v;
                    const typeNum = v.typeNum;
                    let objId;
                    if (objName !== undefined) {
                        const obj = objNames[objName];
                        if (obj !== undefined) {
                            objId = obj.id;
                        }
                    }
                    await runner.unitUserCall('SaveBizBud', unit, user, id, phrase, caption, typeNum, memo, dataTypeNum, objId, flag);
                }();
            }));
        }();
    }));
    let schemas = uq.buildSchemas(res);
    return {
        schemas: jsonpack.pack(schemas.$biz),
        logs: msgs,
    };
}
function getAtomExtendsPairs(biz, arrNew) {
    const pairs = [];
    const coll = {};
    const pairColl = {};
    for (const entity of arrNew) {
        if (entity.type !== 'atom')
            continue;
        const bizAtom = entity;
        const { name } = bizAtom;
        coll[name] = bizAtom;
        const { extends: _extends } = bizAtom;
        if (_extends === undefined) {
            pairs.push(['', bizAtom.phrase]);
        }
        else {
            pairs.push([_extends.phrase, bizAtom.phrase]);
        }
        pairColl[name] = bizAtom;
    }
    for (const [, entity] of biz.bizEntities) {
        if (entity.type !== 'atom')
            continue;
        const bizAtom = entity;
        if (pairColl[bizAtom.name] !== undefined)
            continue;
        const { extends: _extends } = bizAtom;
        if (_extends === undefined)
            continue;
        if (coll[_extends.name] === undefined)
            continue;
        pairs.push([_extends.phrase, bizAtom.phrase]);
    }
    return pairs;
}
//# sourceMappingURL=compile.js.map