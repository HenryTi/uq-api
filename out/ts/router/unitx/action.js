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
exports.unitxActionProcess = void 0;
const core_1 = require("../../core");
const actionProcess_1 = require("../actionProcess");
function unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run, net) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (name) {
            case 'saveentityoppost':
                return yield saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run, net);
            case 'saveentityopforall':
                yield setAccessEntity(net, unit, body, schema);
                break;
            case 'entityOpUserFully$add$':
                yield entityOpUserFully$add$(net, unit, body, schema);
                break;
            case 'entityOpUserFully$del$':
                yield entityOpUserFully$del$(net, unit, body, schema);
                break;
        }
        return yield (0, actionProcess_1.actionProcess)(unit, user, name, db, urlParams, runner, body, schema, run);
    });
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
function saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run, net) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = (0, core_1.unpack)(schema, body.data);
        let { uq, entityName, opName } = actionParam;
        let url = ''; //await net.uqUrl(runner, unit, uq);
        throw new Error('saveEntityOpPost');
        let ret = yield (0, actionProcess_1.actionProcess)(unit, user, name, db, urlParams, runner, body, schema, run);
        if (opName === '$') {
            let users = yield runner.query('getEntityAccess', unit, user, [uq, entityName, opName]);
            let uqApi = new UqApi(url);
            // 设置uq里面entity的access之后，才写unitx中的entity access
            yield uqApi.setAccessUser(unit, entityName, users.map(v => v.to).join(','));
        }
        return ret;
    });
}
function buildUqApi(net, unit, uq) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = ''; // await net.uqUrl(unit, uq);
        throw new Error('buildUqApi');
        let uqApi = new UqApi(url);
        return uqApi;
    });
}
function setAccessFully(net, unit, body, schema, flag) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = (0, core_1.unpack)(schema, body.data);
        let { _uq, arr1 } = actionParam;
        let uqApi = yield buildUqApi(net, unit, _uq);
        for (let arr of arr1) {
            let { _user } = arr;
            yield uqApi.setAccessFully(unit, _user, flag);
        }
    });
}
function entityOpUserFully$add$(net, unit, body, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setAccessFully(net, unit, body, schema, 1);
    });
}
function entityOpUserFully$del$(net, unit, body, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setAccessFully(net, unit, body, schema, 0);
    });
}
function setAccessEntity(net, unit, body, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = (0, core_1.unpack)(schema, body.data);
        let { uq, entities } = actionParam;
        let entityNames = entities.map(v => v.entity).join(',');
        let uqApi = yield buildUqApi(net, unit, uq);
        yield uqApi.setAccessEntity(unit, entityNames);
    });
}
class UqApi extends core_1.Fetch {
    setAccessUser(unit, entity, users) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = { unit: unit, entity: entity, users: users };
            return yield this.post('setting/access-user', params);
        });
    }
    setAccessEntity(unit, entities) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = { unit: unit, entities: entities };
            return yield this.post('setting/access-entity', params);
        });
    }
    setAccessFully(unit, user, flag) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = { unit: unit, user: user, flag: flag };
            return yield this.post('setting/access-fully', params);
        });
    }
}
//# sourceMappingURL=action.js.map