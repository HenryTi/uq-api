"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BID = void 0;
const il_1 = require("../../il");
const il_2 = require("../../il");
const consts_1 = require("../consts");
const dbContext_1 = require("../dbContext");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const sqlBuilder_1 = require("../sql/sqlBuilder");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const entity_1 = require("./entity");
class BID extends entity_1.BEntity {
    buildTables() {
        if (this.entity.onlyForSyntax === true)
            return;
        this.buildMainTable();
    }
    buildProcedures() {
        if (this.entity.onlyForSyntax === true)
            return;
        let { id, name, version, joins } = this.entity;
        if (!id)
            return;
        let returnTypeId = new il_1.BigInt();
        let funcId = this.context.createAppFunc(`${name}$id`, returnTypeId);
        this.buildIdFunc(funcId);
        if (version !== undefined) {
            this.buildIdPrevFunc(this.context.createAppFunc(`${name}$prev`, returnTypeId));
        }
        let returnTypeValue = new il_1.Text();
        let funcValue = this.context.createAppFunc(`${name}$value`, returnTypeValue);
        this.buildValueFunc(funcValue);
        let procSetProp = this.context.createAppProc(`${name}$prop`);
        this.buildSetProp(procSetProp);
        if (joins !== undefined) {
            this.buildJoinsProc(this.context.createAppProc(`${name}$joins`));
        }
    }
    buildMainTable() {
        let { id, name, stampCreate, stampUpdate, keys, version, indexes, fieldsValuesList, idIsKey, isConst, isMinute } = this.entity;
        if (!id)
            return;
        let table = this.context.createTable(name);
        table.hasUnit = false; // global === false && hasUnit === true;
        if (id.autoInc === true)
            table.autoIncId = id;
        table.id = id;
        table.isMinuteId = isMinute;
        table.idKeys = [...keys];
        table.keys = this.entity.getKeys();
        table.fields = [...this.entity.getFields()];
        if (version !== undefined) {
            table.idKeys.push(version);
            table.fields.push(version);
        }
        if (isConst === true) {
            let validField = (0, il_1.tinyIntField)('$valid');
            validField.defaultValue = 2;
            table.fields.push(validField);
        }
        this.buildSysFields(table, stampCreate, stampUpdate);
        if (indexes) {
            table.indexes.push(...indexes);
        }
        if (keys.length > 0) {
            let index = new il_1.Index('key');
            index.unique = true;
            index.fields = [...keys];
            if (version !== undefined)
                index.fields.push(version);
            if (idIsKey === true) {
                index.fields.push(id);
            }
            table.indexes.push(index);
        }
        table.fieldsValuesList = this.convertTableFieldsValuesList(fieldsValuesList);
        this.context.appObjs.tables.push(table);
    }
    buildIdFunc(p) {
        let { name, keys, idType, isConst, isMinute, version, idIsKey } = this.entity;
        let { unitField, userParam, factory, hasUnit } = this.context;
        hasUnit = false;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam, (0, il_1.tinyIntField)('$new'));
        const idVersion = '$id$version';
        const varIdVersion = new sql_1.ExpVar(idVersion);
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('$id', new il_1.BigInt());
        if (idIsKey === true) {
            let iffStampNull = factory.createIf();
            statements.push(iffStampNull);
            iffStampNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('$stamp'));
            let setStamp = factory.createSet();
            iffStampNull.then(setStamp);
            setStamp.equ('$stamp', new sql_1.ExpFuncCustom(factory.func_unix_timestamp));
        }
        if (keys.length > 0) {
            let keyCompares = keys.map(v => {
                let fName = v.name;
                return new sql_1.ExpEQ(new sql_1.ExpField(fName), new sql_1.ExpVar(fName));
            });
            let select = factory.createSelect();
            statements.push(select);
            select.toVar = true;
            select.col('id', '$id');
            select.from(new statementWithFrom_1.EntityTable(name, hasUnit));
            select.lock = select_1.LockType.update;
            if (version !== undefined) {
                declare.var('$id$version', new il_1.SmallInt());
                select.col('version', idVersion);
                select.order(new sql_1.ExpField('version'), 'desc');
                select.limit(sql_1.ExpNum.num1);
            }
            if (idIsKey === true) {
                select.order(new sql_1.ExpField('id'), 'desc');
                select.limit(sql_1.ExpNum.num1);
                keyCompares.push(new sql_1.ExpLE(new sql_1.ExpField('id'), new sql_1.ExpBitLeft(new sql_1.ExpDiv(new sql_1.ExpVar('$stamp'), new sql_1.ExpNum(60)), new sql_1.ExpNum(20))));
            }
            select.where(new sql_1.ExpAnd(...keyCompares));
        }
        // 如果是仅仅取id值
        let ifGet = factory.createIf();
        statements.push(ifGet);
        ifGet.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('$new'), sql_1.ExpNum.num0);
        let retId = factory.createReturn();
        retId.returnVar = '$id';
        ifGet.then(retId);
        let iff = factory.createIf();
        statements.push(iff);
        let ifCmps = [
            new sql_1.ExpIsNotNull(new sql_1.ExpVar('$id')),
        ];
        if (version !== undefined) {
            ifCmps.push(new sql_1.ExpEQ(new sql_1.ExpVar('$new'), sql_1.ExpNum.num2));
        }
        if (idIsKey === true) {
            ifCmps.push(new sql_1.ExpNE(new sql_1.ExpVar('$new'), sql_1.ExpNum.num3));
        }
        iff.cmp = new sql_1.ExpAnd(...ifCmps);
        iff.then(retId);
        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(name)));
        selectEntity.lock = select_1.LockType.update;
        if (idType === il_2.EnumIdType.MinuteId) {
            parameters.push((0, il_1.intField)('$stamp'));
            statements.push(...this.build$MinuteId());
        }
        else if (isConst === false || idType === il_2.EnumIdType.ULocal /*UConst*/) {
            let setId = factory.createSet();
            statements.push(setId);
            let idFunc;
            let idFuncParams = [
                new sql_1.ExpSelect(selectEntity)
            ];
            if (isMinute === true) {
                switch (idType) {
                    case il_2.EnumIdType.UUID:
                        idFunc = '$iduum';
                        parameters.push((0, il_1.charField)('$uuid', 100));
                        idFuncParams.push(new sql_1.ExpVar('$uuid'));
                        break;
                    case il_2.EnumIdType.ULocal:
                        idFunc = '$idmu';
                        break;
                    case il_2.EnumIdType.Minute:
                        idFuncParams.unshift(new sql_1.ExpVar(sqlBuilder_1.unitFieldName));
                        idFunc = '$id_minute';
                        break;
                }
                parameters.push((0, il_1.intField)('$stamp'));
                idFuncParams.push(new sql_1.ExpVar('$stamp'));
            }
            else {
                switch (idType) {
                    case il_2.EnumIdType.UUID:
                        idFunc = '$iduu';
                        parameters.push((0, il_1.charField)('$uuid', 100));
                        idFuncParams.push(new sql_1.ExpVar('$uuid'));
                        break;
                    case il_2.EnumIdType.ULocal:
                        idFunc = '$idnu';
                        break;
                    default:
                    case il_2.EnumIdType.Local:
                        idFuncParams.unshift(new sql_1.ExpVar(sqlBuilder_1.unitFieldName));
                        idFunc = '$id_local';
                        break;
                    case il_2.EnumIdType.Global:
                        idFuncParams.unshift(new sql_1.ExpVar(sqlBuilder_1.unitFieldName));
                        idFunc = '$id';
                        break;
                    case il_2.EnumIdType.Minute:
                        idFuncParams.unshift(new sql_1.ExpVar(sqlBuilder_1.unitFieldName));
                        idFunc = '$id_minute';
                        parameters.push((0, il_1.intField)('$stamp'));
                        idFuncParams.push(new sql_1.ExpVar('$stamp'));
                        break;
                }
            }
            setId.equ('$id', new sql_1.ExpFunc(this.context.twProfix + idFunc, ...idFuncParams));
        }
        parameters.push(...keys);
        let insert = factory.createInsert();
        statements.push(insert);
        insert.table = new statementWithFrom_1.EntityTable(name, hasUnit);
        insert.cols = [{ col: 'id', val: new sql_1.ExpVar('$id') }];
        let { cols } = insert;
        cols.push(...keys.map(k => ({ col: k.name, val: new sql_1.ExpVar(k.name) })));
        if (version !== undefined) {
            cols.push({ col: 'version', val: new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_ifnull, varIdVersion, sql_1.ExpNum.num0), sql_1.ExpNum.num1) });
        }
        if (isConst === true && idType !== il_2.EnumIdType.ULocal) {
            let setConstId = factory.createSet();
            statements.push(setConstId);
            setConstId.equ('$id', new sql_1.ExpFunc(factory.func_lastinsertid));
        }
        let insertOwner = this.buildInsertOwner();
        if (insertOwner) {
            statements.push(...insertOwner);
        }
        statements.push(retId);
    }
    buildIdPrevFunc(p) {
        let { name } = this.entity;
        let { factory, hasUnit } = this.context;
        hasUnit = false;
        let { parameters, statements } = p;
        parameters.push((0, il_1.bigIntField)('$id'));
        let selectPrev = factory.createSelect();
        selectPrev.col('id');
        selectPrev.from(new statementWithFrom_1.EntityTable(name, hasUnit));
        selectPrev.where(new sql_1.ExpAnd(new sql_1.ExpLT(new sql_1.ExpField('id'), new sql_1.ExpVar('$id'))));
        selectPrev.lock = select_1.LockType.update;
        selectPrev.order(new sql_1.ExpField('version'), 'desc');
        selectPrev.limit(sql_1.ExpNum.num1);
        let returnPrev = factory.createReturn();
        statements.push(returnPrev);
        returnPrev.expVal = new sql_1.ExpSelect(selectPrev);
    }
    buildInsertOwner() {
        let { permit } = this.entity;
        if (permit === undefined)
            return;
        let { factory } = this.context;
        let iff = factory.createIf();
        iff.cmp = new sql_1.ExpGT(new sql_1.ExpVar('$user'), sql_1.ExpNum.num0);
        let declare = factory.createDeclare();
        iff.then(declare);
        const vUserUnitId = 'userUnitId';
        declare.var(vUserUnitId, new il_1.BigInt());
        let set = factory.createSet();
        iff.then(set);
        set.equ(vUserUnitId, new sql_1.ExpFuncInUq('$UserSite$id', [sql_1.ExpNum.num0, new sql_1.ExpVar('$user'), sql_1.ExpNum.num1, new sql_1.ExpVar('$id'), new sql_1.ExpVar('$user')], true));
        let updateOwner = factory.createUpdate();
        iff.then(updateOwner);
        updateOwner.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.userSite);
        updateOwner.cols = [
            { col: 'admin', val: new sql_1.ExpNum(il_1.EnumRole.Owner + il_1.EnumRole.Admin) }
        ];
        updateOwner.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(vUserUnitId));
        return [iff];
    }
    build$MinuteId() {
        let ret = [];
        let { factory } = this.context;
        let declare = factory.createDeclare();
        ret.push(declare);
        const idminute = '$idminute';
        const idminute0 = idminute + '0';
        declare.vars((0, il_1.bigIntField)(idminute), (0, il_1.bigIntField)(idminute0));
        let iffStampNull = factory.createIf();
        ret.push(iffStampNull);
        iffStampNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('$stamp'));
        let setStamp = factory.createSet();
        iffStampNull.then(setStamp);
        setStamp.equ('$stamp', new sql_1.ExpFuncCustom(factory.func_unix_timestamp));
        let setMinStamp = factory.createSet();
        ret.push(setMinStamp);
        setMinStamp.equ('$stamp', new sql_1.ExpSub(new sql_1.ExpDiv(new sql_1.ExpVar('$stamp'), new sql_1.ExpNum(60)), new sql_1.ExpNum(consts_1.minteIdOf2020_01_01) // 2020-1-1 0:0:0 utc的分钟数
        ));
        let setIdMinute0 = factory.createSet();
        ret.push(setIdMinute0);
        setIdMinute0.equ(idminute0, new sql_1.ExpFunc(factory.func_if, new sql_1.ExpLT(new sql_1.ExpVar('$stamp'), sql_1.ExpNum.num0), new sql_1.ExpNeg(new sql_1.ExpBitLeft(new sql_1.ExpNeg(new sql_1.ExpVar('$stamp')), new sql_1.ExpNum(20))), new sql_1.ExpBitLeft(new sql_1.ExpVar('$stamp'), new sql_1.ExpNum(20))));
        const idName = this.entity.id.name;
        const idField = new sql_1.ExpField(idName);
        const idHasUnit = false; // this.context.hasUnit && !this.entity.global;
        let selectMaxId = factory.createSelect();
        ret.push(selectMaxId);
        selectMaxId.column(new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_max, idField), sql_1.ExpNum.num1), idminute);
        selectMaxId.toVar = true;
        selectMaxId.lock = select_1.LockType.update;
        selectMaxId.from(new statementWithFrom_1.EntityTable(this.entity.name, idHasUnit));
        let wheres = [
            new sql_1.ExpGE(idField, new sql_1.ExpVar(idminute0)),
            new sql_1.ExpLT(idField, new sql_1.ExpAdd(new sql_1.ExpVar(idminute0), new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpBitLeft(sql_1.ExpNum.num1, new sql_1.ExpNum(20)), new sql_1.ExpDatePart('signed')))),
        ];
        selectMaxId.where(new sql_1.ExpAnd(...wheres));
        let set$Id = factory.createSet();
        ret.push(set$Id);
        set$Id.equ('$id', new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpVar(idminute), new sql_1.ExpVar(idminute0)));
        return ret;
    }
    buildSetProp(p) {
        let { name, fields, id } = this.entity;
        let { factory, hasUnit, unitField, userParam } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam, (0, il_1.bigIntField)('id'), (0, il_1.charField)('name', 100), (0, il_1.textField)('value'));
        let iff = factory.createIf();
        statements.push(iff);
        let first = true;
        for (let field of fields) {
            if (field === id /* || field === main*/)
                continue;
            let cmp = new sql_1.ExpEQ(new sql_1.ExpVar('name'), new sql_1.ExpStr(field.name));
            let update = factory.createUpdate();
            update.table = new statementWithFrom_1.EntityTable(name, hasUnit);
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id'));
            update.cols = [
                { col: field.name, val: new sql_1.ExpVar('value') }
            ];
            if (first === true) {
                iff.cmp = cmp;
                iff.then(update);
                first = false;
            }
            else {
                let elseStats = new sql_1.Statements();
                elseStats.add(update);
                iff.elseIf(cmp, elseStats);
            }
        }
    }
    buildValueFunc(p) {
        let { factory, hasUnit } = this.context;
        hasUnit = false;
        let { name, fields, version } = this.entity;
        let { parameters, statements } = p;
        parameters.push((0, il_1.bigIntField)('id'));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('ret', new il_1.Text());
        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        let exp = new sql_1.ExpFunc(factory.func_concat_ws, new sql_1.ExpFunc('char', new sql_1.ExpNum(12)), ...fields.map(v => new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpField(v.name), new sql_1.ExpStr(''))));
        select.column(exp, 'ret');
        select.from(new statementWithFrom_1.EntityTable(name, hasUnit));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')));
        if (version !== undefined) {
            select.order(new sql_1.ExpField(version.name), 'desc');
            select.limit(sql_1.ExpNum.num1);
        }
        select.lock = select_1.LockType.update;
        let ret = factory.createReturn();
        ret.returnVar = 'ret';
        statements.push(ret);
    }
    buildJoinsProc(p) {
        let { name, fields, id, joins } = this.entity;
        let { factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push((0, il_1.bigIntField)('id'));
        const a = 'a';
        const sep = new sql_1.ExpFunc('char', new sql_1.ExpNum(12));
        let select = factory.createSelect();
        statements.push(select);
        let vals = fields.map(f => new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpField(f.name, a), new sql_1.ExpStr('')));
        select.column(new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpFunc(factory.func_concat_ws, sep, ...vals), new sql_1.ExpKey('CHAR')), 'value');
        select.from(new statementWithFrom_1.EntityTable(name, hasUnit, a));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar('id')));
        for (let { ID, field } of joins) {
            let { name, id, fields } = ID;
            let selectJoin = factory.createSelect();
            statements.push(selectJoin);
            let vals = [new sql_1.ExpField(id.name, a)];
            for (let f of fields) {
                if (f === id)
                    continue;
                if (f === field)
                    continue;
                vals.push(new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpField(f.name, a), new sql_1.ExpStr('')));
            }
            selectJoin.column(new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpFunc(factory.func_concat_ws, sep, ...vals), new sql_1.ExpKey('CHAR')), 'value');
            selectJoin.from(new statementWithFrom_1.EntityTable(name, hasUnit, a));
            selectJoin.where(new sql_1.ExpEQ(new sql_1.ExpField(field.name, a), new sql_1.ExpVar('id')));
        }
    }
}
exports.BID = BID;
//# sourceMappingURL=ID.js.map