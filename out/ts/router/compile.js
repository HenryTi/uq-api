"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompileRouter = void 0;
const jsonpack = require("jsonpack");
const uq_1 = require("../uq");
const bizSiteBuilder_1 = require("../uq/bizSiteBuilder");
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
    const msgs = [];
    function log(msg) {
        msgs.push(msg);
        return true;
    }
    const uqRunner = new uq_1.UqRunner(undefined, log);
    let [objs, props] = await runner.unitUserTablesFromProc('GetBizObjects', unit, user, 'zh', 'cn');
    const { uq } = uqRunner;
    const { biz } = uq;
    const bizSiteBuilder = new bizSiteBuilder_1.BizSiteBuilder(biz, runner, unit, user);
    await bizSiteBuilder.parse(objs, props);
    /*
    const res: { [phrase: string]: string } = {};
    let objNames: { [name: string]: any } = {};
    let objIds: { [id: number]: any } = {};
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

    // biz.bizArr.splice(0);
    */
    if (clientSource) {
        uqRunner.parse(clientSource, 'upload');
        uqRunner.anchorLatest();
    }
    // let bizArr = [...biz.bizArr];
    for (let obj of objs) {
        const { phrase, source } = obj;
        if (!source)
            continue;
        if (override === true) {
            if (uqRunner.isLatest(phrase) === true)
                continue;
        }
        uqRunner.parse(source, phrase);
    }
    uqRunner.scan();
    if (uqRunner.ok === false) {
        return {
            logs: msgs,
        };
    }
    /*
    const hasUnit = false;
    let context = new DbContext(this.compilerVersion, sqlType, dbSiteName, '', this.log, hasUnit);
    const bUq = new BUq(this.uq, context);

    await uqRunner.saveLatest(runner);
    await Promise.all(bizArr.map(entity => {
        return async function () {
            const { type, phrase, caption, source } = entity;
            const memo = undefined;
            let [{ id }] = await runner.unitUserTableFromProc('SaveBizObject'
                , unit, user, phrase, caption, entity.typeNum, memo, source
                , undefined);
            if (entity.type === 'atom') {

            }
            let obj = { id, phrase };
            objIds[id] = obj;
            objNames[phrase] = obj;
        }();
    }));
    const atomPairs = getAtomExtendsPairs(biz, bizArr);
    await runner.unitUserTableFromProc('SaveBizIX'
        , unit, user, JSON.stringify(atomPairs));
    await Promise.all(bizArr.map(entity => {
        return async function () {
            let { id } = objNames[entity.phrase];
            let buds = entity.getAllBuds();
            await Promise.all(buds.map(v => {
                return async function () {
                    const { phrase, caption, memo, dataTypeNum, objName, flag } = v;
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
                        , typeNum, memo, dataTypeNum, objId, flag
                    );
                }();
            }));
        }();
    }));
    */
    await bizSiteBuilder.build(log);
    // let schemas = uq.buildSchemas(res);
    let schemas = bizSiteBuilder.buildSchemas();
    return {
        schemas: jsonpack.pack(schemas.$biz),
        logs: msgs,
    };
}
//# sourceMappingURL=compile.js.map