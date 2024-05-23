"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompileRouter = void 0;
const crypto_1 = require("crypto");
const compile_1 = require("../uq/compile");
const tool_1 = require("../tool");
const actionType = 'compile';
function buildCompileRouter(router, rb) {
    router.get('/compile/hello', (req, res) => __awaiter(this, void 0, void 0, function* () {
        res.json({
            ok: true,
            res: {
                route: 'compile',
                sub: 'hello',
            }
        });
    }));
    rb.entityPost(router, actionType, '/override', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        const { source } = body;
        const ret = yield (0, compile_1.compileSource)(runner, unit, user, source);
        // const compile = new CompileSource(runner, source, unit, user, true);
        // const ret = await compile.run();
        return ret;
    }));
    rb.entityPost(router, actionType, '/append', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        const { source } = body;
        const ret = yield (0, compile_1.compileSource)(runner, unit, user, source);
        //const compile = new CompileSource(runner, source, unit, user, false);
        // const ret = await compile.run();
        return ret;
    }));
    rb.entityPost(router, actionType, '/entity', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        const { id, code } = body;
        const ret = yield (0, compile_1.compileSingle)(runner, unit, user, id, code);
        return ret;
    }));
    rb.entityPost(router, actionType, '/rename', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        const { id, name: entityName } = body;
        let ret = yield (0, compile_1.compileRename)(runner, unit, user, id, entityName);
        return ret;
    }));
    rb.entityPost(router, actionType, '/del-entity', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        const { id } = body;
        let ret = yield (0, compile_1.compileDelEntity)(runner, unit, user, id);
        return ret;
    }));
    rb.entityPost(router, actionType, '/biz', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        let ret = yield (0, compile_1.compileBiz)(runner, unit, user);
        return ret;
    }));
    rb.entityDownload(router, actionType, '/source/:file', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        let ret = yield (0, compile_1.compileDownload)(runner, unit, user, urlParams.file);
        return ret;
    }));
    rb.entityPost(router, actionType, '/app-key', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        const { ioSite, atom, app, valid } = body;
        let ret = yield runner.call('SetIOSiteAtomApp', [0, 0, ioSite, atom, app, valid]);
        const [{ id: siteAtomApp }] = ret;
        let appKey, appPassword;
        if (valid === 1) {
            appKey = siteAtomAppToAppKey(siteAtomApp);
            appPassword = createPassword();
            yield runner.call('SetIOSiteAtomAppKey', [0, 0, siteAtomApp, appKey, appPassword]);
        }
        return {
            siteAtomApp,
            appKey,
            appPassword,
        };
    }));
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