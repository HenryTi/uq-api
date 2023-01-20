"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionConvert = exports.actionReturns = exports.actionProcess = void 0;
const _ = require("lodash");
const tool_1 = require("../tool");
const core_1 = require("../core");
const convert_1 = require("../convert");
async function actionProcess(unit, user, name, db, urlParams, runner, body, schema, run) {
    let result = await actionReturns(unit, user, name, db, urlParams, runner, body, schema, run);
    let arr0 = result[0];
    if (arr0 === undefined || arr0.length === 0)
        return;
    return arr0[0];
}
exports.actionProcess = actionProcess;
;
async function actionReturns(unit, user, name, db, urlParams, runner, body, schema, run) {
    let { data } = body;
    if (typeof data === 'object') {
        tool_1.logger.debug('action process data: ', body);
        data = (0, core_1.packParam)(schema, data);
    }
    tool_1.logger.debug('action process param: ', data);
    let { proxy, auth } = schema;
    await runner.buildUqStoreProcedureIfNotExists(proxy, auth);
    if (proxy !== undefined) {
        let result = await runner.actionProxy(name, unit, user, body.$$user, data);
        return result;
    }
    else {
        let result = await runner.action(name, unit, user, data);
        return result;
    }
}
exports.actionReturns = actionReturns;
async function actionConvert(unit, user, entityName, db, urlParams, runner, body, schema, run) {
    let data = Object.assign({}, body.data);
    let { paramConvert, returns } = schema;
    let actionConvertSchema;
    if (paramConvert !== undefined) {
        let { name, to, type } = paramConvert;
        let v = data[name];
        switch (type) {
            case 'expression':
                expressionConvert(data, v, to);
                break;
        }
        actionConvertSchema = runner.getActionConvertSchema(entityName);
        if (actionConvertSchema === undefined) {
            actionConvertSchema = _.cloneDeep(schema);
            let fields = actionConvertSchema.fields;
            let index = fields.findIndex(v => v.name === name);
            if (index >= 0) {
                fields.splice(index, 1);
                for (let t of to) {
                    fields.push({ name: t, type: 'text' });
                }
            }
            runner.setActionConvertSchema(entityName, actionConvertSchema);
        }
    }
    //let param = packParam(actionConvertSchema || schema, data);
    let results = await actionReturns(unit, user, entityName, db, urlParams, runner, { data }, actionConvertSchema || schema, run);
    if (returns == undefined)
        return;
    let len = returns.length;
    let ret = [];
    for (let i = 0; i < len; i++) {
        let result = results[i];
        let returnSchema = returns[i];
        let { convert } = returnSchema;
        if (convert === 'license') {
            ret.push((0, convert_1.buildLicense)(result));
        }
        else {
            ret.push(result);
        }
    }
    return ret;
}
exports.actionConvert = actionConvert;
;
function expressionConvert(data, exp, to) {
    data[to[0]] = (0, convert_1.buildExpVar)(exp);
    data[to[1]] = (0, convert_1.buildExpCalc)(exp);
}
//# sourceMappingURL=actionProcess.js.map