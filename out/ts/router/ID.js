"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIDRouter = void 0;
const sqlResultProfix = 'sql-';
function buildIDRouter(router, rb) {
    rb.entityPost(router, 'acts', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.Acts(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'acts', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.Acts(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'act-ix', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.ActIX(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'act-ix', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.ActIX(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'act-id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.ActID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'act-id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.ActID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'act-id-prop', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { ID, id, name: propName, value } = body;
        let result = await runner.ActIDProp(unit, user, ID, id, propName, value);
        return result;
    });
    rb.entityPost(router, 'act-ix-sort', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.ActIXSort(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'act-ix-sort', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.ActIXSort(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'act-detail', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.ActDetail(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'act-detail', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.ActDetail(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'query-id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.QueryID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'query-id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.QueryID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    async function loadIDTypes(runner, unit, user, id) {
        let IDTypes;
        let idTypes;
        let sqlBuilder = runner.sqlFactory.idTypes(id);
        let retIdTypes = await runner.IDSql(unit, user, sqlBuilder);
        // let retIdTypes = await this.dbCaller.idTypes(unit, user, id);
        let coll = {};
        for (let r of retIdTypes) {
            let { id, $type } = r;
            coll[id] = $type;
        }
        if (typeof (id) === 'number') {
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
    }
    rb.entityPost(router, 'id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { IDX } = body;
        if (IDX === undefined) {
            body.IDX = await loadIDTypes(runner, unit, user, body.id);
        }
        let sqlBuilder = runner.sqlFactory.ID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let { IDX } = body;
        if (IDX === undefined) {
            body.IDX = await loadIDTypes(runner, unit, user, body.id);
        }
        let sqlBuilder = runner.sqlFactory.ID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'id-tv', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IDTv(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'id-tv', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDTv(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'key-id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.KeyID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'key-id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.KeyID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'ix', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IX(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'ix', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IX(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'ix-values', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IXValues(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'ix-values', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IXValues(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'ixr', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IXr(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'ixr', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IXr(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'key-ix', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.KeyIX(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'key-ix', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.KeyIX(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'id-log', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IDLog(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'id-log', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDLog(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'id-sum', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IDSum(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'id-sum', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDSum(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'id-no', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IDNO(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'id-no', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDNO(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'id-detail-get', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IDDetailGet(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'id-detail-get', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDDetailGet(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'id-in-ix', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IDinIX(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'id-in-ix', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDinIX(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'id-x-id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IDxID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'id-x-id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDxID(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, 'id-tree', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let sqlBuilder = runner.sqlFactory.IDTree(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'id-tree', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        body.$sql = true;
        let sqlBuilder = runner.sqlFactory.IDTree(body);
        let result = await runner.IDSql(unit, user, sqlBuilder);
        return result;
    });
}
exports.buildIDRouter = buildIDRouter;
//# sourceMappingURL=ID.js.map