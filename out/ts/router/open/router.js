"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOpenRouter = void 0;
const tool_1 = require("../../tool");
function buildOpenRouter(router, rb) {
    rb.get(router, '/entities/:unit', async (runner, body, params) => {
        return await runner.getEntities(params.unit);
    });
    rb.get(router, '/entity/:entityName', async (runner, body, params) => {
        return runner.getSchema(params.entityName);
    });
    rb.post(router, '/entities/:unit', async (runner, body, params) => {
        return await runner.getEntities(params.unit);
    });
    rb.post(router, '/from-entity', async (runner, body) => {
        let { unit, entity, key } = body;
        let schema = runner.getSchema(entity);
        let { type } = schema;
        if (type === 'tuid') {
            let tuidRet = await runner.unitUserCall(entity, unit, undefined, key);
            return tuidRet;
        }
        if (type === 'map') {
            let keys = key.split('\t');
            let len = keys.length;
            for (let i = 0; i < len; i++) {
                if (!key[i])
                    keys[i] = undefined;
            }
            let { keys: keyFields } = schema.call;
            let fieldsLen = keyFields.length;
            for (let i = len; i < fieldsLen; i++) {
                keys.push(undefined);
            }
            let mapRet = await runner.unitUserCall(entity + '$query$', unit, undefined, keys);
            return mapRet;
        }
    });
    rb.post(router, '/queue-modify', async (runner, body) => {
        /*
        let {unit, start, page, entities} = body;
        let ret = await runner.unitTablesFromProc('$modify_queue', unit, start, page, entities);
        let ret1 = ret[1];
        let modifyMax = ret1.length===0? 0: ret1[0].max;
        runner.setModifyMax(unit, modifyMax);
        */
        return {
            queue: [], //ret[0],
            queueMax: 0, //modifyMax
        };
    });
    rb.post(router, '/bus-query', async (runner, body) => {
        let { unit, busOwner, busName, face: faceName, params } = body;
        let faceUrl = `${busOwner}/${busName}/${faceName}`;
        let face = runner.buses.urlColl[faceUrl];
        let { bus } = face;
        // 之前的编译，BUS accept和query存储过程没有分开
        try {
            let ret = await runner.tablesFromProc(bus + '$q_' + faceName, [unit, 0, ...params]);
            return ret;
        }
        catch {
            let ret = await runner.tablesFromProc(bus + '_' + faceName, [unit, 0, ...params]);
            return ret;
        }
    });
    rb.post(router, '/tuid-main/:tuid', async (runner, body, params) => {
        body.$ = 'open/tuid-main/';
        tool_1.logger.debug(body);
        let { tuid } = params;
        let { unit, id, all } = body;
        if (runner.isTuidOpen(tuid) === false)
            return;
        // maps: tab分隔的map名字
        let suffix = (all === true ? '$id' : '$main');
        let ret = await runner.unitUserCall(tuid + suffix, unit, undefined, id);
        return ret;
    });
    rb.post(router, '/tuid-div/:tuid/:div', async (runner, body, params) => {
        body.$ = 'open/tuid-div/';
        tool_1.logger.debug(body);
        let { tuid, div } = params;
        let { unit, id, ownerId, all } = body;
        if (runner.isTuidOpen(tuid) === false)
            return;
        // maps: tab分隔的map名字
        let suffix = (all === true ? '$id' : '$main');
        return await runner.unitUserCall(`${tuid}_${div}${suffix}`, unit, undefined, ownerId, id);
    });
    rb.get(router, '/proc/:name', async (runner, body, params) => {
        let { name } = params;
        return await runner.buildProc(name);
    });
    rb.post(router, '/action/:action', async (runner, body, params) => {
        let { action } = params;
        if (runner.isActionOpen(action) === false)
            return;
        let { unit, id, data } = body;
        return await runner.actionDirect(action, unit, id, data);
    });
}
exports.buildOpenRouter = buildOpenRouter;
;
//# sourceMappingURL=router.js.map