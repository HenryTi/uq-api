"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildActionRouter = void 0;
const core_1 = require("../core");
const actionProcess_1 = require("./actionProcess");
const unitx_1 = require("./unitx");
const actionType = 'action';
function buildActionRouter(router, rb) {
    rb.entityPost(router, actionType, '/:name', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        if (db === core_1.consts.$unitx)
            return await (0, unitx_1.unitxActionProcess)(unit, user, name, db, urlParams, runner, body, schema, run, net);
        return await (0, actionProcess_1.actionProcess)(unit, user, name, db, urlParams, runner, body, schema, run);
    });
    rb.entityPost(router, actionType, '/:name/returns', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        if (db === core_1.consts.$unitx)
            return await (0, unitx_1.unitxActionProcess)(unit, user, name, db, urlParams, runner, body, schema, run, net);
        return await (0, actionProcess_1.actionReturns)(unit, user, name, db, urlParams, runner, body, schema, run);
    });
    rb.entityPost(router, actionType, '-json/:name', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        if (db === core_1.consts.$unitx)
            return await (0, unitx_1.unitxActionProcess)(unit, user, name, db, urlParams, runner, body, schema, run, net);
        return await (0, actionProcess_1.actionProcess)(unit, user, name, db, urlParams, runner, body, schema, run);
    });
    rb.entityPost(router, actionType, '-convert/:name', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        return await (0, actionProcess_1.actionConvert)(unit, user, name, db, urlParams, runner, body, schema, run);
    });
}
exports.buildActionRouter = buildActionRouter;
//# sourceMappingURL=action.js.map