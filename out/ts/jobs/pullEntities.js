"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullEntities = void 0;
const tool_1 = require("../tool");
const core_1 = require("../core");
async function pullEntities(runner) {
    let { froms, hasPullEntities } = runner;
    if (hasPullEntities === false)
        return;
    if (froms === undefined)
        return;
    try {
        await pullNew(runner);
        await pullModify(runner);
    }
    catch (err) {
        debugger;
        if (err && err.message)
            tool_1.logger.error(err.message);
    }
}
exports.pullEntities = pullEntities;
var FromNewSet;
(function (FromNewSet) {
    FromNewSet[FromNewSet["ok"] = 1] = "ok";
    FromNewSet[FromNewSet["bad"] = 2] = "bad";
    FromNewSet[FromNewSet["moreTry"] = 3] = "moreTry";
})(FromNewSet || (FromNewSet = {}));
async function pullNew(runner) {
    let { net } = runner;
    let count = 0;
    tool_1.logger.debug(`== pullNew start ==`);
    for (; count < 200;) {
        let items = await runner.tableFromProc('$from_new', undefined);
        if (items.length === 0) {
            break;
        }
        tool_1.logger.debug(`== pullNew count=${items.length} ==`);
        for (let item of items) {
            count++;
            let { id, unit, entity, key, tries, update_time, now } = item;
            let fns;
            try {
                if (unit === undefined)
                    unit = runner.uniqueUnit;
                if (tries > 0) {
                    // 上次尝试之后十分钟内不尝试
                    if (now - update_time < tries * 10 * 60)
                        continue;
                }
                let schema = runner.getSchema(entity);
                if (schema === undefined)
                    continue;
                let { from } = schema;
                if (!from)
                    continue;
                let openApi = await net.openApiUnitUq(runner, unit, from);
                if (!openApi)
                    continue;
                await pullEntity(runner, openApi, schema, unit, entity, key);
                fns = FromNewSet.ok;
            }
            catch (err) {
                if (tries > 5)
                    fns = FromNewSet.bad;
                else
                    fns = FromNewSet.moreTry;
            }
            finally {
                await runner.call('$from_new_set', [unit, id, fns]);
            }
        }
        tool_1.logger.debug(`## pullNew end ##`);
    }
}
async function pullModify(runner) {
    tool_1.logger.debug(`== pullModify start ==`);
    let { net } = runner;
    let items = await runner.tableFromProc('$sync_from', undefined);
    if (items.length === 0)
        return;
    tool_1.logger.debug(`== pullModify count=${items.length} ==`);
    let unitOpenApiItems = {};
    // 把访问同一个openApi的整理到一起
    let promises = [];
    let params = [];
    let count = 0;
    for (let item of items) {
        let { unit, entity, modifyMax } = item;
        if (!unit)
            unit = runner.uniqueUnit;
        let schema = runner.getSchema(entity);
        if (schema === undefined) {
            debugger;
            continue;
        }
        let { type, from } = schema;
        if (!from)
            continue;
        let openApiPromise = net.openApiUnitUq(runner, unit, from);
        promises.push(openApiPromise);
        params.push({ from: from, unit: unit, modifyMax: modifyMax, entity: entity });
    }
    let openApis = await Promise.all(promises);
    let len = openApis.length;
    for (let i = 0; i < len; i++) {
        let openApi = openApis[i];
        if (!openApi)
            continue;
        let { from, unit, modifyMax, entity } = params[i];
        let openApiItems = unitOpenApiItems[unit];
        if (openApiItems === undefined) {
            unitOpenApiItems[unit] = openApiItems = [{
                    openApi: openApi,
                    entities: [entity],
                    modifyMax: modifyMax
                }];
        }
        else {
            let openApiItem = openApiItems.find(v => v.openApi === openApi);
            if (openApiItem === undefined) {
                openApiItems.push({
                    openApi: openApi,
                    entities: [entity],
                    modifyMax: modifyMax,
                });
            }
            else {
                openApiItem.entities.push(entity);
                if (modifyMax > openApiItem.modifyMax) {
                    openApiItem.modifyMax = modifyMax;
                }
            }
        }
    }
    // 从from uq获取数据
    let page = 100;
    for (let unit in unitOpenApiItems) {
        if (count > 200)
            break;
        let openApiItems = unitOpenApiItems[unit];
        for (let openApiItem of openApiItems) {
            try {
                // 只有exists items 需要pull modify
                // 对于tuid，id必须存在
                // 对于map，key0必须存在
                let { openApi, entities, modifyMax } = openApiItem;
                let ret = await openApi.queueModify(unit, modifyMax, page, entities.join('\t'));
                let { queue, queueMax } = ret;
                if (queue.length === 0) {
                    for (let entity of entities) {
                        await runner.call('$sync_from_set', [unit, entity, queueMax]);
                    }
                    continue;
                }
                let entityModifies = {};
                for (let item of queue) {
                    let { id: modifyId, entity, key } = item;
                    let em = entityModifies[entity];
                    if (em === undefined) {
                        entityModifies[entity] = em = {
                            modifies: '',
                            idMax: 0
                        };
                    }
                    em.modifies += modifyId + '\t' + key + '\n';
                    em.idMax = modifyId;
                }
                for (let entity in entityModifies) {
                    ++count;
                    let schema = runner.getSchema(entity);
                    let { modifies, idMax } = entityModifies[entity];
                    let ret = await runner.checkPull(unit, entity, schema.type, modifies);
                    for (let item of ret) {
                        let { modifyId, key } = item;
                        await pullEntity(runner, openApi, schema, unit, entity, key);
                    }
                    if (queue.length < page && idMax < queueMax)
                        idMax = queueMax;
                    if (idMax > 0) {
                        await runner.call('$sync_from_set', [unit, entity, idMax]);
                    }
                }
            }
            catch (err) {
                tool_1.logger.error(err);
            }
        }
        tool_1.logger.debug(`## pullModify end ##`);
    }
}
async function pullEntity(runner, openApi, schema, unit, entity, key) {
    let ret = await openApi.fromEntity(unit, entity, key);
    switch (schema.type) {
        case 'tuid':
            await setTuid(runner, entity, schema, unit, ret);
            break;
        case 'map':
            await setMap(runner, entity, schema, unit, ret);
            break;
    }
}
async function setMap(runner, mapName, schema, unit, values) {
    let map = schema; // runner.getMap(mapName);
    if (map === undefined)
        return;
    let { actions } = map.call;
    let { sync } = actions;
    let data = {
        //__id: id,
        arr1: values
    };
    let param = (0, core_1.packParam)(sync, data);
    await runner.action(sync.name, unit, undefined, param);
    return;
}
async function setTuid(runner, tuidName, schema, unit, values) {
    try {
        let user = undefined;
        let tuid = schema.call; // runner.getTuid(tuidName);
        let { id: idFieldName, fields, arrs } = tuid;
        let main = values[0];
        if (Array.isArray(main))
            main = main[0];
        if (main === undefined) {
            //await runner.tuidSetStamp(tuidName, unit, [id, -2]);
            return;
        }
        let idVal = main[idFieldName];
        if (arrs !== undefined) {
            let len = arrs.length;
            for (let i = 0; i < len; i++) {
                let arr = arrs[i];
                let { name, fields } = arr;
                let rows = values[i + 1];
                for (let row of rows) {
                    let param = [idVal, row.id];
                    fields.forEach(v => param.push(row[v.name]));
                    param.push(row.$order);
                    await runner.tuidArrSave(tuidName, name, unit, user, param);
                }
            }
        }
        let paramMain = [idVal];
        fields.forEach(v => paramMain.push(main[v.name]));
        //paramMain.push(main.$stamp);
        await runner.tuidSave(tuidName, unit, user, paramMain);
    }
    catch (err) {
        tool_1.logger.debug(err.message);
    }
}
//# sourceMappingURL=pullEntities.js.map