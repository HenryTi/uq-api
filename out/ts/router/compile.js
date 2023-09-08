"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompileRouter = void 0;
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
    rb.entityPost(router, actionType, '/source', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        let { source } = body;
        const msgs = [];
        function log(msg) {
            msgs.push(msg);
            return true;
        }
        const uqRunner = new uq_1.UqRunner(undefined, log);
        const { uq } = uqRunner;
        const { biz } = uq;
        biz.bizArr.splice(0);
        uqRunner.parse(source, 'upload');
        uqRunner.scan();
        const phrases = biz.phrases.map(v => v.join('\t')).join('\n');
        await runner.unitUserCall('SaveBizMoniker', unit, user, phrases + '\n\n');
        return {
            source,
            schemas: uqRunner.uq.biz.bizArr.map(v => v.buildSchema()),
            logs: msgs,
            phrases,
        };
    });
}
exports.buildCompileRouter = buildCompileRouter;
//# sourceMappingURL=compile.js.map