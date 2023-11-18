"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompileRouter = void 0;
const compile_1 = require("../uq/compile");
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
    rb.entityPost(router, actionType, '/override', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { source } = body;
        const ret = await (0, compile_1.compileSource)(runner, unit, user, source);
        // const compile = new CompileSource(runner, source, unit, user, true);
        // const ret = await compile.run();
        return ret;
    });
    rb.entityPost(router, actionType, '/append', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { source } = body;
        const ret = await (0, compile_1.compileSource)(runner, unit, user, source);
        //const compile = new CompileSource(runner, source, unit, user, false);
        // const ret = await compile.run();
        return ret;
    });
    rb.entityPost(router, actionType, '/entity', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { id, code } = body;
        const ret = await (0, compile_1.compileSingle)(runner, unit, user, id, code);
        return ret;
    });
    rb.entityPost(router, actionType, '/rename', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { id, name: entityName } = body;
        let ret = await (0, compile_1.compileRename)(runner, unit, user, id, entityName);
        return ret;
    });
    rb.entityPost(router, actionType, '/del-entity', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { id } = body;
        let ret = await (0, compile_1.compileDelEntity)(runner, unit, user, id);
        return ret;
    });
    rb.entityPost(router, actionType, '/biz', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        let ret = await (0, compile_1.compileBiz)(runner, unit, user);
        return ret;
    });
    rb.entityDownload(router, actionType, '/source/:file', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        let ret = await (0, compile_1.compileDownload)(runner, unit, user, urlParams.file);
        return ret;
    });
}
exports.buildCompileRouter = buildCompileRouter;
//# sourceMappingURL=compile.js.map