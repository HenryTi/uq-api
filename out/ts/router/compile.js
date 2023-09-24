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
        if (!source)
            continue;
        if (override === true) {
            if (uqRunner.isLatest(phrase) === true)
                continue;
        }
        uqRunner.parse(source, phrase);
        let entity = uqRunner.uq.biz.bizEntities.get(phrase);
        if (entity !== undefined)
            entity.id = id;
    }
    uqRunner.scan();
    if (uqRunner.ok === false) {
        return {
            logs: msgs,
        };
    }
    await bizSiteBuilder.build(log);
    let schemas = bizSiteBuilder.buildSchemas();
    return {
        schemas: jsonpack.pack(schemas.$biz),
        logs: msgs,
    };
}
//# sourceMappingURL=compile.js.map