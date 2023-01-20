"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTuidRouter = void 0;
const core_1 = require("../core");
const tuidType = 'tuid';
function buildTuidRouter(router, rb) {
    rb.post(router, '/queue-modify', async (runner, body, params, userToken) => {
        /*
        let {db, unit} = userToken;
        let {start, page, entities} = body;
        if (runner === undefined) return;
        let ret = await runner.unitTablesFromProc('$modify_queue', unit, start, page, entities);
        let ret1 = ret[1];
        let modifyMax = ret1.length===0? 0: ret1[0].max;
        runner.setModifyMax(unit, modifyMax);
        */
        return {
            queue: [],
            queueMax: 0, //modifyMax
        };
    });
    rb.entityGet(router, tuidType, '/:name/:id', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { id } = urlParams;
        let result = await runner.tuidGet(name, unit, user, id);
        let arr0 = result[0];
        let value = undefined;
        if (arr0.length > 0) {
            value = arr0[0];
            let { arrs } = schema;
            if (arrs !== undefined) {
                let len = arrs.length;
                for (let i = 0; i < len; i++) {
                    value[arrs[i].name] = result[i + 1];
                }
            }
        }
        return value;
    });
    rb.entityPost(router, tuidType, '-no/:name', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { year, month, date } = body;
        let result = await runner.entityNo(name, unit, year, month, date);
        return result[0];
    });
    rb.entityGet(router, tuidType, '-arr/:name/:owner/:arr/:id/', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { id, owner, arr } = urlParams;
        let schemaArr = getTuidArr(schema, arr);
        let result = await runner.tuidArrGet(name, arr, unit, user, owner, id);
        let row = result[0];
        return row;
    });
    rb.entityGet(router, tuidType, '-all/:name/', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let result = await runner.tuidGetAll(name, unit, user);
        return result;
    });
    rb.entityGet(router, tuidType, '-vid/:name/', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { u } = body;
        let result = await runner.tuidVid(name, unit, u);
        return result[0].id;
    });
    rb.entityGet(router, tuidType, '-arr-vid/:name/:arr', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { u } = body;
        let result = await runner.tuidArrVid(name, urlParams.arr, unit, u);
        return result[0].id;
    });
    rb.entityGet(router, tuidType, '-arr-all/:name/:owner/:arr/', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { owner, arr } = urlParams;
        let schemaArr = getTuidArr(schema, arr);
        let result = await runner.tuidGetArrAll(name, arr, unit, user, owner);
        return result;
    });
    /*
    rb.entityGet(router, tuidType, '-proxy/:name/:type/:id',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id, type} = urlParams;
        let result = await runner.tuidProxyGet(name, unit, user, id, type);
        let row = result[0];
        return row;
    });
    */
    rb.entityPost(router, tuidType, '/:name', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let id = body["$id"];
        let dbParams = [id];
        let fields = schema.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            dbParams.push(body[fields[i].name]);
        }
        let result = await runner.tuidSave(name, unit, user, dbParams);
        let row = result[0];
        if (!id)
            id = row.id;
        if (id < 0)
            id = -id;
        if (id > 0) {
            let { arrs } = schema;
            if (arrs !== undefined) {
                for (let arr of arrs) {
                    let arrName = arr.name;
                    let fields = arr.fields;
                    let arrValues = body[arrName];
                    if (arrValues === undefined)
                        continue;
                    for (let arrValue of arrValues) {
                        let arrParams = [id, arrValue[arr.id]];
                        let len = fields.length;
                        for (let i = 0; i < len; i++) {
                            arrParams.push(arrValue[fields[i].name]);
                        }
                        await runner.tuidArrSave(name, arrName, unit, user, arrParams);
                    }
                }
            }
        }
        return row;
    });
    rb.entityPost(router, tuidType, '-arr/:name/:owner/:arr/', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { owner, arr } = urlParams;
        let schemaArr = getTuidArr(schema, arr);
        let id = body["$id"];
        let dbParams = [owner, id];
        let fields = schemaArr.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            dbParams.push(body[fields[i].name]);
        }
        let result = await runner.tuidArrSave(name, arr, unit, user, dbParams);
        let row = result[0];
        return row;
    });
    rb.entityPost(router, tuidType, '-arr-pos/:name/:owner/:arr/', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { owner, arr } = urlParams;
        let { $id, $order } = body;
        let dbParams = [owner, $id, $order];
        let result = await runner.tuidArrPos(name, arr, unit, user, dbParams);
        return undefined;
    });
    rb.entityPost(router, tuidType, 'ids/:name/:arr', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { arr } = urlParams;
        let ids = body.join(',');
        let result = await runner.tuidIds(name, arr, unit, user, ids);
        if (arr === '$') {
            let { mainFields, $create, $update, stampOnMain } = schema;
            if (mainFields !== undefined) {
                let ret = [];
                let exFields;
                if (stampOnMain === true) {
                    exFields = [];
                    if ($create === true)
                        exFields.push('$create');
                    if ($update === true)
                        exFields.push('$update');
                }
                (0, core_1.packArr)(ret, mainFields, result, exFields);
                return ret.join('');
            }
        }
        else {
            let { arrs } = schema;
            let arrSchema = arrs.find(v => v.name === arr);
            let { mainFields } = arrSchema;
            if (mainFields !== undefined) {
                let ret = [];
                (0, core_1.packArr)(ret, mainFields, result);
                return ret.join('');
            }
        }
        return result;
    });
    rb.entityPost(router, tuidType, 's/:name', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { arr, owner, key, pageStart, pageSize } = body;
        let result = arr === undefined ?
            await runner.tuidSeach(name, unit, user, arr, key, pageStart, pageSize)
            :
                await runner.tuidArrSeach(name, unit, user, arr, owner, key, pageStart, pageSize);
        let rows = result[0];
        return rows;
    });
    rb.entityPost(router, tuidType, 'import/:name/:arr', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { arr } = urlParams;
        let entity = arr !== undefined ? name + '.' + arr : name;
        let filePath = 'C:/Users/Henry/Desktop/Results.csv';
        await runner.importData(unit, user, body.source, entity, filePath);
        return;
    });
    rb.entityPost(router, tuidType, '-prop/:name', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { id, prop, value } = body;
        await runner.saveProp(name, unit, user, id, prop, value);
        return;
    });
}
exports.buildTuidRouter = buildTuidRouter;
;
function getTuidArr(schema, arrName) {
    let { name, type, arrs } = schema;
    if (type !== 'tuid')
        throw name + ' is not tuid';
    let an = arrName.toLowerCase();
    let schemaArr = arrs.find(v => v.name === an);
    if (schemaArr !== undefined)
        return schemaArr;
    throw 'getTuidArr: ' + name + ' does not have arr ' + arrName + ' arrs:' + arrs.map(v => v.name).join(',');
}
//# sourceMappingURL=tuid.js.map