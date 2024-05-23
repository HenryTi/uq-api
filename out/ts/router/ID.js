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
exports.buildIDRouter = void 0;
const sqlResultProfix = 'sql-';
function buildIDRouter(router, rb) {
    rb.entityPost(router, 'acts', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.Acts(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'acts', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.Acts(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'act-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.ActIX(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'act-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.ActIX(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'act-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.ActID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'act-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.ActID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'act-id-prop', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { ID, id, name: propName, value } = body;
        let result = yield runner.ActIDProp(unit, user, ID, id, propName, value);
        return result;
    }));
    rb.entityPost(router, 'act-ix-sort', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.ActIXSort(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'act-ix-sort', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.ActIXSort(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'act-detail', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.ActDetail(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'act-detail', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.ActDetail(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'query-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.QueryID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'query-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.QueryID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    function loadIDTypes(runner, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let IDTypes;
            let idTypes;
            let sqlBuilder = runner.sqlFactory.idTypes(id);
            let retIdTypes = yield runner.IDSql(unit, user, sqlBuilder);
            // let retIdTypes = await this.dbCaller.idTypes(unit, user, id);
            let coll = {};
            for (let r of retIdTypes) {
                let { id, $type } = r;
                coll[id] = $type;
            }
            if (Array.isArray(id) === false) {
                IDTypes = coll[id];
                idTypes = [IDTypes];
            }
            else {
                IDTypes = idTypes = [];
                for (let v of id) {
                    idTypes.push(coll[v]);
                }
            }
            return IDTypes;
        });
    }
    rb.entityPost(router, 'id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { IDX } = body;
        if (IDX === undefined) {
            let { id } = body;
            if (id === undefined) {
                console.error(`no IDX, no id`);
                return undefined;
            }
            IDX = yield loadIDTypes(runner, unit, user, id);
            if (IDX === undefined) {
                console.error(`no id type found for id=${id}`);
                return undefined;
            }
            body.IDX = IDX;
        }
        else if (Array.isArray(IDX) === true) {
            IDX = IDX[0].toLowerCase();
        }
        else {
            IDX = IDX.toLowerCase();
        }
        let { call } = runner.schemas[IDX];
        if (call === undefined) {
            console.error(`${IDX} is not a valid ID type`);
            return undefined;
        }
        let { stars } = call;
        let sqlBuilder = runner.sqlFactory.ID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        let idColl = {};
        if (stars !== undefined) {
            let obj = result[0];
            idColl[obj.id] = true;
            yield loadStars(obj, stars);
        }
        return result;
        function loadStars(obj, stars) {
            return __awaiter(this, void 0, void 0, function* () {
                if (obj === undefined)
                    return;
                if (stars === undefined)
                    return;
                let promises = [];
                for (let star of stars) {
                    promises.push(loadId(obj[star]));
                }
                if (promises.length > 0) {
                    yield Promise.all(promises);
                }
            });
        }
        function loadId(id) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!id)
                    return;
                if (idColl[id] === true)
                    return;
                let IDType = yield loadIDTypes(runner, unit, user, id);
                if (IDType === undefined)
                    return;
                let sqlBuilder = runner.sqlFactory.ID({ IDX: IDType, id });
                let resultFromId = yield runner.IDSql(unit, user, sqlBuilder);
                if (resultFromId !== undefined) {
                    result.push(...resultFromId);
                    let { call: { stars } } = runner.schemas[IDType];
                    let obj = resultFromId[0];
                    yield loadStars(obj, stars);
                }
                idColl[id] = true;
            });
        }
    }));
    rb.entityPost(router, sqlResultProfix + 'id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let { IDX } = body;
        if (IDX === undefined) {
            body.IDX = yield loadIDTypes(runner, unit, user, body.id);
        }
        let sqlBuilder = runner.sqlFactory.ID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'id-tv', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IDTv(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-tv', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDTv(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'key-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.KeyID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'key-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.KeyID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IX(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IX(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'ix-values', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IXValues(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'ix-values', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IXValues(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'ixr', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IXr(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'ixr', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IXr(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'key-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.KeyIX(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'key-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.KeyIX(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'id-log', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IDLog(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-log', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDLog(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'id-sum', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IDSum(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-sum', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDSum(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'id-no', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IDNO(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'id-joins', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = body;
        let IDType = yield loadIDTypes(runner, 0, 0, id);
        let results = yield runner.dbUq.tablesFromProc(`${IDType}$joins`, [id]);
        let main = results[0];
        let main0 = main[0];
        if (main0 !== undefined) {
            main0.ID = IDType;
        }
        return results;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-no', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDNO(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'id-detail-get', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IDDetailGet(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-detail-get', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDDetailGet(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'id-in-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IDinIX(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-in-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDinIX(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'id-x-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IDxID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-x-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDxID(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, 'id-tree', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let sqlBuilder = runner.sqlFactory.IDTree(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-tree', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDTree(body);
        let result = yield runner.IDSql(unit, user, sqlBuilder);
        return result;
    }));
}
exports.buildIDRouter = buildIDRouter;
//# sourceMappingURL=ID.js.map