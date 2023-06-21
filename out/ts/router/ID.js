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
    }
    rb.entityPost(router, 'id', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { IDX } = body;
        if (IDX === undefined) {
            let { id } = body;
            if (id === undefined) {
                console.error(`no IDX, no id`);
                return undefined;
            }
            IDX = await loadIDTypes(runner, unit, user, id);
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
        let result = await runner.IDSql(unit, user, sqlBuilder);
        let idColl = {};
        if (stars !== undefined) {
            let obj = result[0];
            idColl[obj.id] = true;
            await loadStars(obj, stars);
        }
        return result;
        async function loadStars(obj, stars) {
            if (obj === undefined)
                return;
            if (stars === undefined)
                return;
            let promises = [];
            for (let star of stars) {
                promises.push(loadId(obj[star]));
            }
            if (promises.length > 0) {
                await Promise.all(promises);
            }
        }
        async function loadId(id) {
            if (!id)
                return;
            if (idColl[id] === true)
                return;
            let IDType = await loadIDTypes(runner, unit, user, id);
            if (IDType === undefined)
                return;
            let sqlBuilder = runner.sqlFactory.ID({ IDX: IDType, id });
            let resultFromId = await runner.IDSql(unit, user, sqlBuilder);
            if (resultFromId !== undefined) {
                result.push(...resultFromId);
                let { call: { stars } } = runner.schemas[IDType];
                let obj = resultFromId[0];
                await loadStars(obj, stars);
            }
            idColl[id] = true;
        }
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
    rb.entityPost(router, 'id-joins', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { id } = body;
        let IDType = await loadIDTypes(runner, 0, 0, id);
        let results = await runner.dbUq.tablesFromProc(`${IDType}$joins`, [id]);
        let main = results[0];
        let main0 = main[0];
        if (main0 !== undefined) {
            main0.ID = IDType;
        }
        return results;
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