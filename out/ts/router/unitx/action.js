"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitxActionProcess = void 0;
const core_1 = require("../../core");
const actionProcess_1 = require("../actionProcess");
async function unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run, net) {
    switch (name) {
        case 'saveentityoppost':
            return await saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run, net);
        case 'saveentityopforall':
            await setAccessEntity(net, unit, body, schema);
            break;
        case 'entityOpUserFully$add$':
            await entityOpUserFully$add$(net, unit, body, schema);
            break;
        case 'entityOpUserFully$del$':
            await entityOpUserFully$del$(net, unit, body, schema);
            break;
    }
    return await (0, actionProcess_1.actionProcess)(unit, user, name, db, urlParams, runner, body, schema, run);
}
exports.unitxActionProcess = unitxActionProcess;
// ????????????????????????
// 这里的问题，记录在ondrive/同花待实现功能点.docx 文件中
// ????????????????????????
/*
if (opName === '$') {
    let users:{to:number}[] = await runner.query(
        'getEntityAccess', unit, user,
        [uq, entityName, opName]);
    logger.debug({
        '$': 'saveEntityOpPost',
        '#': 'getEntityAccess',
        unit: unit,
        user: user,
        uq: uq,
        entityName: entityName,
        opName: opName,
        
        users: users.join(','),
    })
    let uqApi = new UqApi(url);
    // 设置uq里面entity的access之后，才写unitx中的entity access
    await uqApi.setAccess(unit, entityName, anyone, users.map(v=>v.to).join(','));
}
return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
*/
async function saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run, net) {
    let actionParam = (0, core_1.unpack)(schema, body.data);
    let { uq, entityName, opName } = actionParam;
    let url = ''; //await net.uqUrl(runner, unit, uq);
    throw new Error('saveEntityOpPost');
    let ret = await (0, actionProcess_1.actionProcess)(unit, user, name, db, urlParams, runner, body, schema, run);
    if (opName === '$') {
        let users = await runner.query('getEntityAccess', unit, user, [uq, entityName, opName]);
        let uqApi = new UqApi(url);
        // 设置uq里面entity的access之后，才写unitx中的entity access
        await uqApi.setAccessUser(unit, entityName, users.map(v => v.to).join(','));
    }
    return ret;
}
async function buildUqApi(net, unit, uq) {
    let url = ''; // await net.uqUrl(unit, uq);
    throw new Error('buildUqApi');
    let uqApi = new UqApi(url);
    return uqApi;
}
async function setAccessFully(net, unit, body, schema, flag) {
    let actionParam = (0, core_1.unpack)(schema, body.data);
    let { _uq, arr1 } = actionParam;
    let uqApi = await buildUqApi(net, unit, _uq);
    for (let arr of arr1) {
        let { _user } = arr;
        await uqApi.setAccessFully(unit, _user, flag);
    }
}
async function entityOpUserFully$add$(net, unit, body, schema) {
    await setAccessFully(net, unit, body, schema, 1);
}
async function entityOpUserFully$del$(net, unit, body, schema) {
    await setAccessFully(net, unit, body, schema, 0);
}
async function setAccessEntity(net, unit, body, schema) {
    let actionParam = (0, core_1.unpack)(schema, body.data);
    let { uq, entities } = actionParam;
    let entityNames = entities.map(v => v.entity).join(',');
    let uqApi = await buildUqApi(net, unit, uq);
    await uqApi.setAccessEntity(unit, entityNames);
}
class UqApi extends core_1.Fetch {
    async setAccessUser(unit, entity, users) {
        let params = { unit: unit, entity: entity, users: users };
        return await this.post('setting/access-user', params);
    }
    async setAccessEntity(unit, entities) {
        let params = { unit: unit, entities: entities };
        return await this.post('setting/access-entity', params);
    }
    async setAccessFully(unit, user, flag) {
        let params = { unit: unit, user: user, flag: flag };
        return await this.post('setting/access-fully', params);
    }
}
//# sourceMappingURL=action.js.map