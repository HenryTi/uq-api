"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSheetRouter = void 0;
const core_1 = require("../core");
const constSheet = 'sheet';
function buildSheetRouter(router, rb) {
    async function queueSheet(runner, unit, name, sheetId, content) {
        let ret = await runner.unitTableFromProc('$sheet_to_queue', unit, name, sheetId, JSON.stringify(content));
        return (ret[0].ret === 1);
    }
    async function directSheet(runner, unit, name, sheetId, content) {
        let { state, action, flow, user } = content;
        let ret = await runner.sheetAct(name, state, action, unit, user, sheetId, flow);
        //let ret = await runner.unitTableFromProc('$sheet_to_queue', unit, name, sheetId, JSON.stringify(content));
        return ret[0];
    }
    rb.entityPost(router, constSheet, '/:name', async (unit, user, name, db, urlParams, runner, body, schema, run) => {
        var _a;
        let { app, discription, data } = body;
        try {
            let verify = await runner.sheetVerify(name, unit, user, data);
            if (verify !== undefined) {
                return { error: verify };
            }
            let result = await runner.sheetSave(name, unit, user, app, discription, data);
            let sheetRet = result[0];
            if (sheetRet !== undefined) {
                //let states:any[] = schema.states;
                let startState = (_a = run === null || run === void 0 ? void 0 : run.run) === null || _a === void 0 ? void 0 : _a['$']; // states.find(v => v.name === '$');
                if (startState !== undefined) {
                    let $onsave = startState['$onsave'];
                    if ($onsave !== undefined) {
                        let { id, flow } = sheetRet;
                        let retQueue = await queueSheet(runner, unit, name, id, {
                            sheet: name,
                            state: '$',
                            action: '$onsave',
                            unit: unit,
                            user: user,
                            id: id,
                            flow: flow,
                        });
                    }
                }
            }
            return sheetRet;
        }
        catch (err) {
            await runner.logError(unit, 'sheet save ' + name, data);
        }
    });
    rb.entityPost(router, constSheet, '/:name/direct', async (unit, user, name, db, urlParams, runner, body, schema, run) => {
        var _a;
        let { app, discription, data } = body;
        try {
            let verify = await runner.sheetVerify(name, unit, user, data);
            if (verify !== undefined) {
                return { verify };
            }
            let result = await runner.sheetSave(name, unit, user, app, discription, data);
            let sheetRet = result[0];
            if (sheetRet !== undefined) {
                //let states:any[] = schema.states;
                let startState = (_a = run === null || run === void 0 ? void 0 : run.run) === null || _a === void 0 ? void 0 : _a['$']; // states.find(v => v.name === '$');
                if (startState !== undefined) {
                    let $onsave = startState['$onsave'];
                    if ($onsave !== undefined) {
                        let { id, flow } = sheetRet;
                        let retQueue = await directSheet(runner, unit, name, id, {
                            sheet: name,
                            state: '$',
                            action: '$onsave',
                            unit: unit,
                            user: user,
                            id: id,
                            flow: flow,
                        });
                    }
                }
            }
            return sheetRet;
        }
        catch (err) {
            await runner.logError(unit, 'sheet save ' + name, data);
        }
    });
    rb.entityPut(router, constSheet, '/:name', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { state, action, id, flow } = body;
        let retQueue = await queueSheet(runner, unit, name, id, {
            sheet: name,
            state: state,
            action: action,
            unit: unit,
            user: user,
            id: id,
            flow: flow,
        });
        // 这个地方以后需要更多的判断和返回。提供给界面操作
        if (retQueue === false)
            throw {
                type: 'sheet-processing',
                message: '不可以同时操作单据'
            };
        return { msg: 'add to queue' };
    });
    rb.entityPut(router, constSheet, '/:name/direct', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { state, action, id, flow } = body;
        let ret = await directSheet(runner, unit, name, id, {
            sheet: name,
            state: state,
            action: action,
            unit: unit,
            user: user,
            id: id,
            flow: flow,
        });
        // 这个地方以后需要更多的判断和返回。提供给界面操作
        /*
        if (retQueue === false) throw {
            type: 'sheet-processing',
            message: '不可以同时操作单据'
        };
        return {msg: 'add to queue'};
        */
        return ret;
    });
    rb.entityPost(router, constSheet, '/:name/states', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { state, pageStart, pageSize } = body;
        let result = await runner.sheetStates(name, state, unit, user, pageStart, pageSize);
        return result;
    });
    rb.entityGet(router, constSheet, '/:name/statecount', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let result = await runner.sheetStateCount(name, unit, user);
        return result;
    });
    rb.entityPost(router, constSheet, '/:name/user-sheets', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { state, user: sheetUser, pageStart, pageSize } = body;
        let result = await runner.userSheets(name, state, unit, user, sheetUser, pageStart, pageSize);
        return result;
    });
    rb.entityPost(router, constSheet, '/:name/my-sheets', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { state, pageStart, pageSize } = body;
        let result = await runner.mySheets(name, state, unit, user, pageStart, pageSize);
        return result;
    });
    rb.entityGet(router, constSheet, '-scan/:name/:id', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { id } = urlParams;
        let result = await runner.sheetScan(name, unit, user, id);
        let main = result[0];
        if (main === undefined)
            return;
        let data = main.data;
        let json = (0, core_1.unpack)(schema, data);
        main.data = json;
        return main;
    });
    rb.entityGet(router, constSheet, '/:name/get/:id', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { id } = urlParams;
        let result = await runner.getSheet(name, unit, user, id);
        return result;
    });
    rb.entityPost(router, constSheet, '/:name/archives', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { pageStart, pageSize } = body;
        let result = await runner.sheetArchives(name, unit, user, pageStart, pageSize);
        return result;
    });
    rb.entityGet(router, constSheet, '/:name/archive/:id', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { id } = urlParams;
        let result = await runner.sheetArchive(unit, user, name, id);
        return result;
    });
}
exports.buildSheetRouter = buildSheetRouter;
//# sourceMappingURL=sheet.js.map