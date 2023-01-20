"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageQueryProcess = exports.queryProcess = exports.buildQueryRouter = void 0;
const core_1 = require("../core");
function buildQueryRouter(router, rb) {
    rb.entityPost(router, 'query', '/:name', exports.queryProcess);
    rb.entityPost(router, 'query', '-page/:name', exports.pageQueryProcess);
}
exports.buildQueryRouter = buildQueryRouter;
const queryProcess = async (unit, user, name, db, urlParams, runner, body, schema) => {
    try {
        let params = [];
        let fields = schema.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result;
        let { proxy, auth } = schema;
        await runner.buildUqStoreProcedureIfNotExists(proxy, auth);
        if (proxy !== undefined) {
            result = await runner.queryProxy(name, unit, user, body.$$user, params);
        }
        else {
            result = await runner.query(name, unit, user, params);
        }
        let data = (0, core_1.packReturn)(schema, result);
        return data;
    }
    catch (err) {
        debugger;
        console.error(err);
        throw err;
    }
};
exports.queryProcess = queryProcess;
const pageQueryProcess = async (unit, user, name, db, urlParams, runner, body, schema) => {
    let pageStart = body['$pageStart'];
    if (pageStart !== undefined) {
        let page = schema.returns.find(v => v.name === '$page');
        if (page !== undefined) {
            let startField = page.fields[0];
            if (startField !== undefined) {
                switch (startField.type) {
                    case 'date':
                    case 'time':
                    case 'datetime':
                        pageStart = new Date(pageStart);
                        break;
                }
            }
        }
    }
    let params = [pageStart, body['$pageSize']];
    let fields = schema.fields;
    let len = fields.length;
    for (let i = 0; i < len; i++) {
        params.push(body[fields[i].name]);
    }
    let result;
    let { proxy, auth } = schema;
    await runner.buildUqStoreProcedureIfNotExists(proxy, auth);
    if (proxy !== undefined) {
        result = await runner.queryProxy(name, unit, user, body.$$user, params);
    }
    else {
        result = await runner.query(name, unit, user, params);
    }
    let data = (0, core_1.packReturn)(schema, result);
    return data;
    //let result = await runner.query(name, proxy!==undefined, unit, user, params);
    //let data = packReturn(schema, result);
    //return data;
};
exports.pageQueryProcess = pageQueryProcess;
//# sourceMappingURL=query.js.map