"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMapRouter = void 0;
const actionProcess_1 = require("./actionProcess");
const query_1 = require("./query");
const actionType = 'map';
function buildMapRouter(router, rb) {
    rb.entityPost(router, actionType, '/:name/add', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        let actionName = name + '$add$';
        let actionSchema = runner.getSchema(actionName);
        //return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return await (0, actionProcess_1.actionProcess)(unit, user, actionName, db, urlParams, runner, body, actionSchema.call, run);
    });
    rb.entityPost(router, actionType, '/:name/del', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        let actionName = name + '$del$';
        let actionSchema = runner.getSchema(actionName);
        //return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return await (0, actionProcess_1.actionProcess)(unit, user, actionName, db, urlParams, runner, body, actionSchema.call, run);
    });
    rb.entityPost(router, actionType, '/:name/all', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        let queryName = name + '$all$';
        let querySchema = runner.getSchema(queryName);
        return await (0, query_1.pageQueryProcess)(unit, user, queryName, db, urlParams, runner, body, querySchema.call);
    });
    rb.entityPost(router, actionType, '/:name/page', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        let queryName = name + '$page$';
        let querySchema = runner.getSchema(queryName);
        return await (0, query_1.pageQueryProcess)(unit, user, queryName, db, urlParams, runner, body, querySchema.call);
    });
    rb.entityPost(router, actionType, '/:name/query', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        let queryName = name + '$query$';
        let querySchema = runner.getSchema(queryName);
        let ret = await (0, query_1.queryProcess)(unit, user, queryName, db, urlParams, runner, body, querySchema.call);
        return ret;
    });
}
exports.buildMapRouter = buildMapRouter;
//# sourceMappingURL=map.js.map