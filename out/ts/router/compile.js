"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompileRouter = void 0;
const crypto_1 = require("crypto");
const compile_1 = require("../uq/compile");
const tool_1 = require("../tool");
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
    rb.entityPost(router, actionType, '/app-key', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { ioSite, atom, app, valid } = body;
        let ret = await runner.call('SetIOSiteAtomApp', [0, 0, ioSite, atom, app, valid]);
        const [{ id: siteAtomApp }] = ret;
        let appKey, appPassword;
        if (valid === 1) {
            appKey = siteAtomAppToAppKey(siteAtomApp);
            appPassword = createPassword();
            await runner.call('SetIOSiteAtomAppKey', [0, 0, siteAtomApp, appKey, appPassword]);
        }
        return {
            siteAtomApp,
            appKey,
            appPassword,
        };
    });
}
exports.buildCompileRouter = buildCompileRouter;
function createPassword() {
    let rand = (0, crypto_1.randomBytes)(20).toString('base64').substring(0, 16);
    return rand;
}
function siteAtomAppToAppKey(siteAtomApp) {
    let bufRand = (0, crypto_1.randomBytes)(1);
    let salt = bufRand.readUInt8();
    let saa = salt * 0x10000000000 + siteAtomApp;
    let appKey = (0, tool_1.to62)(saa);
    return appKey;
}
//# sourceMappingURL=compile.js.map