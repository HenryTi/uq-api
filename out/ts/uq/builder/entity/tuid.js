"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BTuid = void 0;
const _ = require("lodash");
const entity_1 = require("./entity");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const select_1 = require("../sql/select");
const __1 = require("..");
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const sqlBuilder_1 = require("../sql/sqlBuilder");
function selectCols(context, sel, fields, tbl) {
    if (fields === undefined)
        return;
    for (let f of fields) {
        let { name, sName, dataType } = f;
        switch (dataType.type) {
            default:
                sel.col(name, sName, tbl);
                break;
            case 'bin':
                sel.column(new sql_1.ExpFunc(context.factory.func_hex, new sql_1.ExpField(name, tbl)), sName);
                break;
        }
    }
}
class BTuid extends entity_1.BEntityBusable {
    static create(context, entity) {
        switch (entity.name) {
            default: return new BTuid(context, entity);
            case '$user':
                // 如果要$user相关重新编译，修改这里
                //entity.source = 'version 2021-09-28';
                return new BTuidUser(context, entity);
            case '$sheet':
                // 如果要$sheet相关重新编译，修改这里
                //entity.source = 'version 2020-08-27';
                return new BTuidSheet(context, entity);
        }
    }
    constructor(context, entity) {
        super(context, entity);
        this.hasUnit = this.entity.global === false && this.context.hasUnit;
        if (this.hasUnit === true) {
            this.eqUnit = new sql_1.ExpEQ(new sql_1.ExpField('$unit'), new sql_1.ExpVar('$unit'));
        }
    }
    buildTables() {
        let { id, name, unique, stampCreate, stampUpdate } = this.entity;
        let table = this.context.createTable(name);
        if (id.autoInc === true)
            table.autoIncId = id;
        table.hasUnit = this.hasUnit;
        table.keys = _.clone(this.entity.getKeys());
        table.fields = _.clone(this.entity.getFields());
        if (stampCreate === true) {
            let fieldCreate = (0, il_1.timeStampField)('$create');
            table.fields.push(fieldCreate);
        }
        if (stampUpdate === true) {
            let fieldUpdate = (0, il_1.timeStampField)('$update');
            fieldUpdate.defaultValue = [il_1.defaultStampOnUpdate];
            table.fields.push(fieldUpdate);
        }
        let indexes = this.entity.indexes;
        if (indexes !== undefined)
            table.indexes.push(...indexes);
        if (unique !== undefined)
            table.indexes.push(unique);
        this.context.appObjs.tables.push(table);
        this.buildArrTables();
    }
    buildArrTables() {
        let { name, arrs, from } = this.entity;
        if (arrs === undefined)
            return;
        for (let taProp of arrs) {
            let { ownerField, orderField, id, main, fields } = taProp;
            let table = this.context.createTable(name + '_' + taProp.name);
            table.hasUnit = false;
            if (id.autoInc === true) {
                table.autoIncId = id;
            }
            table.keys = [ownerField, id];
            table.fields = _.clone([ownerField, id, ...main, ...fields, orderField]);
            if (from !== undefined) {
                for (let f of table.fields)
                    f.nullable = true;
            }
            this.context.appObjs.tables.push(table);
        }
    }
    buildProcedures() {
        let { from } = this.entity;
        this.save();
        this.saveArr();
        this.setArrPos();
        if (from === undefined) {
            this.saveProp();
            this.selectAll();
            this.selectMainFromId();
            this.selectAllFieldsFromId();
            this.selectMainFromIds();
            this.selectArrAll();
            this.selectArrAllFieldsFromId();
            this.selectArrMainFromIds();
            this.vid();
            this.vidArr();
            this.search();
        }
        else {
            this.checkPull();
        }
    }
    saveProp() {
        let { id, name: tuidName, main, fields } = this.entity;
        //if (main === undefined || main.length === 0) return;
        let {} = this.entity;
        let { factory, appObjs } = this.context;
        let { procedures } = appObjs;
        let proc = this.context.createProcedure(tuidName + '$prop');
        procedures.push(proc);
        proc.addUnitUserParameter();
        let paramId = (0, il_1.idField)('id', id.dataType.idSize);
        let paramValue = new il_1.Field();
        paramValue.name = 'value';
        paramValue.dataType = new il_1.Text();
        proc.parameters.push(paramId, (0, il_1.charField)('prop', 100), paramValue);
        let iff = factory.createIf();
        proc.statements.push(iff);
        let n = 0;
        let saveProp = (field) => {
            let { name: fieldName, dataType } = field;
            let update = factory.createUpdate();
            update.cols = [
                { col: fieldName, val: new sql_1.ExpVar(paramValue.name) }
            ];
            update.table = new statementWithFrom_1.EntityTable(tuidName, this.hasUnit);
            let wheres = [];
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(id.name), new sql_1.ExpVar(paramId.name)));
            wheres.push(this.eqUnit);
            update.where = (new sql_1.ExpAnd(...wheres));
            let ifCmp = new sql_1.ExpEQ(new sql_1.ExpVar('prop'), new sql_1.ExpStr(fieldName));
            if (n > 0) {
                let stats = new sql_1.Statements();
                stats.add(update);
                iff.elseIf(ifCmp, stats);
            }
            else {
                iff.cmp = ifCmp;
                iff.then(update);
            }
            ++n;
        };
        if (main) {
            for (let mainField of main)
                saveProp(mainField);
        }
        for (let f of fields)
            saveProp(f);
    }
    createSelect() {
        let { factory } = this.context;
        let { name, id, stampCreate, stampUpdate } = this.entity;
        let sel = factory.createSelect();
        let tbl0 = 't0';
        sel.col(id.name, id.name, tbl0);
        if (stampCreate === true) {
            sel.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('$create', 't0')), '$create');
        }
        if (stampUpdate === true) {
            sel.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('$update', 't0')), '$update');
        }
        sel.from(new statementWithFrom_1.EntityTable(name, this.hasUnit, tbl0));
        return sel;
    }
    selCols(tuid, sel, cols) {
        let fields = cols(tuid);
        selectCols(this.context, sel, fields, 't0');
    }
    selMain(tuid, sel) {
        this.selCols(tuid, sel, (tuid) => tuid.main);
    }
    selFields(tuid, sel) {
        this.selCols(tuid, sel, (tuid) => tuid.fields);
    }
    selectMainFromId() {
        let { name, id /*, base, main, fields, global*/ } = this.entity;
        let proc = this.context.createProcedure(name + '$main');
        proc.addUnitUserParameter();
        let paramId = new il_1.Field();
        paramId.name = '$id';
        paramId.dataType = new il_1.BigInt();
        proc.parameters.push(paramId);
        let sel = this.createSelect();
        proc.statements.push(sel);
        this.selMain(this.entity, sel);
        let wheres = [];
        wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(id.name, 't0'), new sql_1.ExpVar(paramId.name)));
        sel.where(new sql_1.ExpAnd(...wheres));
        this.context.appObjs.procedures.push(proc);
    }
    selectAll() {
        let { name, id } = this.entity;
        let proc = this.context.createProcedure(name + '$all');
        proc.addUnitUserParameter();
        let idVar = new sql_1.ExpVar(id.name);
        let sel = this.createSelect();
        proc.statements.push(sel);
        //this.selBase(this.entity, sel);
        this.selMain(this.entity, sel);
        let wheres = [];
        sel.where(new sql_1.ExpAnd(...wheres));
        wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(id.name), idVar));
        sel.limit(new sql_1.ExpNum(100));
        this.context.appObjs.procedures.push(proc);
    }
    selectArrAll() {
        let { name, id, arrs } = this.entity;
        if (arrs === undefined)
            return;
        let factory = this.context.factory;
        for (let ar of arrs) {
            let { ownerField, main: arrMain, fields: arrFields, orderField } = ar;
            let proc = this.context.createProcedure(name + '_' + ar.name + '$all');
            proc.addUnitUserParameter();
            let idVar = new sql_1.ExpVar(id.name);
            proc.parameters.push(ownerField);
            let sel = factory.createSelect();
            proc.statements.push(sel);
            sel.col(id.name);
            sel.col(orderField.name);
            for (let field of arrMain)
                sel.col(field.name);
            for (let field of arrFields)
                sel.col(field.name);
            sel.from(new statementWithFrom_1.EntityTable(name + '_' + ar.name, false));
            sel.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField(ownerField.name), new sql_1.ExpVar(ownerField.name))));
            sel.order(new sql_1.ExpField(orderField.name), 'asc');
            sel.limit(new sql_1.ExpNum(100));
            this.context.appObjs.procedures.push(proc);
        }
    }
    selectAllFieldsFromId() {
        let { name, id, arrs } = this.entity;
        let factory = this.context.factory;
        let proc = this.context.createProcedure(name);
        proc.addUnitUserParameter();
        let paramId = new il_1.Field();
        paramId.name = '$id';
        paramId.dataType = new il_1.BigInt();
        proc.parameters.push(paramId);
        let sel = this.createSelect();
        proc.statements.push(sel);
        this.selMain(this.entity, sel);
        this.selFields(this.entity, sel);
        let wheres = [];
        wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(id.name, 't0'), new sql_1.ExpVar(paramId.name)));
        sel.where(new sql_1.ExpAnd(...wheres));
        if (arrs !== undefined) {
            for (let taProp of arrs) {
                let { ownerField, orderField, id, main, fields } = taProp;
                let selArrProp = factory.createSelect();
                proc.statements.push(selArrProp);
                selArrProp.col(ownerField.name);
                selArrProp.col(id.name);
                for (let f of main)
                    selArrProp.col(f.name);
                for (let f of fields)
                    selArrProp.col(f.name);
                selArrProp.col(orderField.name);
                selArrProp.where(new sql_1.ExpEQ(new sql_1.ExpField(ownerField.name), new sql_1.ExpVar(paramId.name)));
                selArrProp.from(new statementWithFrom_1.EntityTable(taProp.getTableName(), false));
            }
        }
        this.context.appObjs.procedures.push(proc);
    }
    selectArrAllFieldsFromId() {
        let { name, id, arrs } = this.entity;
        if (arrs === undefined)
            return;
        let factory = this.context.factory;
        for (let ar of arrs) {
            let { ownerField, main: arrMain, fields: arrFields, orderField } = ar;
            let proc = this.context.createProcedure(name + '_' + ar.name + '$id');
            proc.addUnitUserParameter();
            let idVar = new sql_1.ExpVar(id.name);
            proc.parameters.push(ownerField, id);
            let sel = factory.createSelect();
            proc.statements.push(sel);
            sel.from(new statementWithFrom_1.EntityTable(name + '_' + ar.name, false));
            sel.col(id.name);
            sel.col(orderField.name);
            for (let field of arrMain)
                sel.col(field.name);
            for (let field of arrFields)
                sel.col(field.name);
            let wheres = [];
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(ownerField.name), new sql_1.ExpVar(ownerField.name)), new sql_1.ExpEQ(new sql_1.ExpField(id.name), idVar));
            sel.where(new sql_1.ExpAnd(...wheres));
            sel.order(new sql_1.ExpField(orderField.name), 'asc');
            this.context.appObjs.procedures.push(proc);
        }
    }
    selectMainFromIds() {
        let { name, id, stampCreate, stampUpdate } = this.entity;
        let factory = this.context.factory;
        let ids = '$ids';
        let proc = this.context.createProcedure(name + '$ids');
        let stats = proc.statements;
        proc.addUnitUserParameter();
        let paramIds = new il_1.Field();
        paramIds.name = ids;
        paramIds.dataType = new il_1.Text();
        proc.parameters.push(paramIds);
        let c = '$c', p = '$p', len = '$len', int = new il_1.Int;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(c, int);
        declare.var(p, int);
        declare.var(len, int);
        let varTable = factory.createVarTable();
        stats.push(varTable);
        varTable.name = 'ids$tbl';
        let vtId = new il_1.Field();
        vtId.name = 'id';
        vtId.dataType = new il_1.BigInt();
        varTable.fields = [vtId];
        varTable.keys = [vtId];
        let set = factory.createSet();
        stats.push(set);
        set.equ(c, sql_1.ExpVal.num1);
        set = factory.createSet();
        stats.push(set);
        set.equ(len, new sql_1.ExpFunc(factory.func_length, new sql_1.ExpVar(ids)));
        let loop = factory.createWhile();
        stats.push(loop);
        loop.no = 1;
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        let lstats = loop.statements;
        set = factory.createSet();
        lstats.add(set);
        set.equ(p, new sql_1.ExpFunc(factory.func_charindex, new sql_1.ExpStr(','), new sql_1.ExpVar(ids), new sql_1.ExpVar(c)));
        let iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new sql_1.ExpLE(new sql_1.ExpVar(p), sql_1.ExpVal.num0);
        set = factory.createSet();
        iff.then(set);
        set.equ(p, new sql_1.ExpAdd(new sql_1.ExpVar(len), sql_1.ExpVal.num1));
        let insert = factory.createInsert();
        lstats.add(insert);
        insert.table = new sql_1.SqlVarTable(varTable.name);
        insert.cols.push({
            col: vtId.name,
            val: new sql_1.ExpFunc('SUBSTRING', new sql_1.ExpVar(ids), new sql_1.ExpVar(c), new sql_1.ExpSub(new sql_1.ExpVar(p), new sql_1.ExpVar(c)))
        });
        iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new sql_1.ExpGE(new sql_1.ExpVar(p), new sql_1.ExpVar(len));
        let leave = factory.createBreak();
        iff.then(leave);
        leave.no = loop.no;
        set = factory.createSet();
        lstats.add(set);
        set.equ(c, new sql_1.ExpAdd(new sql_1.ExpVar(p), sql_1.ExpVal.num1));
        let sel = this.createSelect();
        let t0 = 't0', tbIds = 'ids';
        stats.push(sel);
        sel.join(il_1.JoinType.inner, new statementWithFrom_1.VarTable(varTable.name, tbIds));
        sel.on(new sql_1.ExpEQ(new sql_1.ExpField(id.name, t0), new sql_1.ExpField(vtId.name, tbIds)));
        this.selMain(this.entity, sel);
        let wheres = [];
        if (wheres.length > 0)
            sel.where(new sql_1.ExpAnd(...wheres));
        this.context.appObjs.procedures.push(proc);
    }
    selectArrMainFromIds() {
        let { name, arrs, owner } = this.entity;
        if (arrs === undefined)
            return;
        let factory = this.context.factory;
        let ids = '$ids';
        let paramIds = new il_1.Field();
        paramIds.name = ids;
        paramIds.dataType = new il_1.Text();
        for (let tuidArr of arrs) {
            let { id, main, fields, ownerField } = tuidArr;
            let proc = this.context.createProcedure(name + '_' + tuidArr.name + '$ids');
            proc.addUnitUserParameter();
            let stats = proc.statements;
            proc.parameters.push(paramIds);
            let c = '$c', p = '$p', len = '$len', int = new il_1.Int;
            let declare = factory.createDeclare();
            stats.push(declare);
            declare.var(c, int);
            declare.var(p, int);
            declare.var(len, int);
            let varTable = factory.createVarTable();
            stats.push(varTable);
            varTable.name = 'ids$tbl';
            let vtId = new il_1.Field();
            vtId.name = 'id';
            vtId.dataType = new il_1.BigInt();
            varTable.fields = [vtId];
            varTable.keys = [vtId];
            let set = factory.createSet();
            stats.push(set);
            set.equ(c, sql_1.ExpVal.num1);
            set = factory.createSet();
            stats.push(set);
            set.equ(len, new sql_1.ExpFunc(factory.func_length, new sql_1.ExpVar(ids)));
            let loop = factory.createWhile();
            stats.push(loop);
            loop.no = 1;
            loop.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
            let lstats = loop.statements;
            set = factory.createSet();
            lstats.add(set);
            set.equ(p, new sql_1.ExpFunc(factory.func_charindex, new sql_1.ExpStr(','), new sql_1.ExpVar(ids), new sql_1.ExpVar(c)));
            let iff = factory.createIf();
            lstats.add(iff);
            iff.cmp = new sql_1.ExpLE(new sql_1.ExpVar(p), sql_1.ExpVal.num0);
            set = factory.createSet();
            iff.then(set);
            set.equ(p, new sql_1.ExpAdd(new sql_1.ExpVar(len), sql_1.ExpVal.num1));
            let insert = factory.createInsert();
            lstats.add(insert);
            insert.table = new sql_1.SqlVarTable(varTable.name);
            insert.cols.push({
                col: vtId.name,
                val: new sql_1.ExpFunc('SUBSTRING', new sql_1.ExpVar(ids), new sql_1.ExpVar(c), new sql_1.ExpSub(new sql_1.ExpVar(p), new sql_1.ExpVar(c)))
            });
            iff = factory.createIf();
            lstats.add(iff);
            iff.cmp = new sql_1.ExpGE(new sql_1.ExpVar(p), new sql_1.ExpVar(len));
            let leave = factory.createBreak();
            iff.then(leave);
            leave.no = loop.no;
            set = factory.createSet();
            lstats.add(set);
            set.equ(c, new sql_1.ExpAdd(new sql_1.ExpVar(p), sql_1.ExpVal.num1));
            let sel = factory.createSelect();
            let t0 = 't0', tbIds = 'ids';
            stats.push(sel);
            sel.from(new statementWithFrom_1.EntityTable(name + '_' + tuidArr.name, false, t0));
            sel.join(il_1.JoinType.inner, new statementWithFrom_1.VarTable(varTable.name, tbIds));
            sel.on(new sql_1.ExpEQ(new sql_1.ExpField(id.name, t0), new sql_1.ExpField(vtId.name, tbIds)));
            sel.col(ownerField.name, ownerField.name, t0);
            sel.col(id.name, undefined, t0);
            if (main.length > 0)
                for (let f of main)
                    sel.col(f.name, undefined, t0);
            else
                for (let f of fields)
                    sel.col(f.name, undefined, t0);
            this.context.appObjs.procedures.push(proc);
        }
    }
    addCols(cols, fields, syncStats) {
        if (fields === undefined)
            return;
        for (let f of fields) {
            let val = new sql_1.ExpVar(f.name);
            cols.push({ col: f.name, val: val });
            syncStats.push(this.buildSyncTuidField(f, val));
        }
    }
    setArrPos() {
        let { name, arrs } = this.entity;
        if (arrs === undefined)
            return;
        let factory = this.context.factory;
        for (let taProp of arrs) {
            let { name: taName, ownerField, id, orderField, fields } = taProp;
            let tblName = name + '_' + taName;
            let proc = this.context.createProcedure(tblName + '$pos');
            proc.addUnitUserParameter();
            this.context.appObjs.procedures.push(proc);
            let vId = '$id';
            let varSId = new sql_1.ExpVar(vId);
            let varId = new sql_1.ExpVar(id.name);
            let expOrderField = new sql_1.ExpField(orderField.name);
            let expOrderVar = new sql_1.ExpVar(orderField.name);
            let stats = proc.statements;
            proc.parameters.push(ownerField, id, orderField);
            let declare = factory.createDeclare();
            stats.push(declare);
            declare.var('orgOrder', new il_1.SmallInt());
            declare.var('maxOrder', new il_1.SmallInt());
            declare.var('order0', new il_1.SmallInt());
            declare.var('order1', new il_1.SmallInt());
            declare.var('delta', new il_1.SmallInt());
            stats.push(proc.createTransaction());
            let selectOrder = factory.createSelect();
            stats.push(selectOrder);
            selectOrder.lock = select_1.LockType.update;
            selectOrder.toVar = true;
            selectOrder.col(orderField.name, 'orgOrder', 'a');
            selectOrder.from(new statementWithFrom_1.EntityTable(tblName, false, 'a'));
            selectOrder
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(name, this.hasUnit, 'b'))
                .on(new sql_1.ExpEQ(new sql_1.ExpField(ownerField.name, 'a'), new sql_1.ExpField(id.name, 'b')));
            selectOrder.where(new sql_1.ExpEQ(new sql_1.ExpField(id.name, 'a'), new sql_1.ExpVar(id.name)));
            let iffExit = factory.createIf();
            stats.push(iffExit);
            iffExit.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('orgOrder'));
            let exit = proc.createLeaveProc();
            iffExit.then(exit);
            let selectMax = factory.createSelect();
            stats.push(selectMax);
            selectMax.lock = select_1.LockType.update;
            selectMax.toVar = true;
            selectMax.column(new sql_1.ExpFunc(factory.func_max, expOrderField), 'maxOrder');
            selectMax.from(new statementWithFrom_1.EntityTable(tblName, false));
            selectMax.where(new sql_1.ExpEQ(new sql_1.ExpField(ownerField.name), new sql_1.ExpVar(ownerField.name)));
            let iff = factory.createIf();
            stats.push(iff);
            iff.cmp = new sql_1.ExpAnd(new sql_1.ExpGE(expOrderVar, sql_1.ExpVal.num1), new sql_1.ExpLE(expOrderVar, new sql_1.ExpVar('maxOrder')), new sql_1.ExpNE(expOrderVar, new sql_1.ExpVar('orgOrder')));
            let setPos0 = factory.createUpdate();
            stats.push(setPos0);
            setPos0.table = new sql_1.SqlEntityTable(tblName, undefined, false);
            setPos0.cols = [{
                    col: orderField.name,
                    val: sql_1.ExpVal.num0
                }];
            setPos0.where = new sql_1.ExpEQ(new sql_1.ExpField(id.name), new sql_1.ExpVar(id.name));
            let iffX = factory.createIf();
            iffX.cmp = new sql_1.ExpLT(expOrderVar, new sql_1.ExpVar('orgOrder'));
            iff.then(iffX);
            let setOrder0 = factory.createSet();
            iffX.then(setOrder0);
            setOrder0.equ('order0', expOrderVar);
            let setOrder1 = factory.createSet();
            iffX.then(setOrder1);
            setOrder1.equ('order1', new sql_1.ExpVar('orgOrder'));
            let setDelta = factory.createSet();
            iffX.then(setDelta);
            setDelta.equ('delta', sql_1.ExpVal.num1);
            let setOrder0X = factory.createSet();
            iffX.else(setOrder0X);
            setOrder0X.equ('order0', new sql_1.ExpVar('orgOrder'));
            let setOrder1X = factory.createSet();
            iffX.else(setOrder1X);
            setOrder1X.equ('order1', expOrderVar);
            let setDeltaX = factory.createSet();
            iffX.else(setDeltaX);
            setDeltaX.equ('delta', new sql_1.ExpNum(-1));
            let move = factory.createUpdate();
            stats.push(move);
            move.table = new sql_1.SqlEntityTable(tblName, undefined, false);
            move.cols = [{
                    col: orderField.name,
                    val: new sql_1.ExpAdd(expOrderVar, new sql_1.ExpVar('delta'))
                }];
            move.where = new sql_1.ExpAnd(new sql_1.ExpGE(expOrderField, new sql_1.ExpVar('order0')), new sql_1.ExpLE(expOrderField, new sql_1.ExpVar('order1')));
            let setPosAt = factory.createUpdate();
            stats.push(setPosAt);
            setPosAt.table = new sql_1.SqlEntityTable(tblName, undefined, false);
            setPosAt.cols = [{
                    col: orderField.name,
                    val: new sql_1.ExpVar(orderField.name)
                }];
            setPosAt.where = new sql_1.ExpEQ(new sql_1.ExpField(id.name), new sql_1.ExpVar(id.name));
            stats.push(proc.createCommit());
        }
    }
    saveArr() {
        let { name, arrs, from, isOpen, global } = this.entity;
        if (arrs === undefined)
            return;
        let hasUnit = this.hasUnit && !global;
        let { unitField } = this.context;
        let factory = this.context.factory;
        for (let taProp of arrs) {
            let { name: taName, ownerField, id, orderField, main, fields } = taProp;
            let tblName = name + '_' + taName;
            let proc = this.context.createProcedure(tblName + '$save');
            let { parameters } = proc;
            proc.addUnitUserParameter();
            let syncStats = [];
            this.context.appObjs.procedures.push(proc);
            //let vId = '$id';
            let vOrder = orderField.name;
            //let varSId = new ExpVar(vId);
            let varId = new sql_1.ExpVar(id.name);
            let stats = proc.statements;
            let declare = factory.createDeclare();
            stats.push(declare);
            parameters.push(ownerField, id);
            let buildParam = (field) => { this.context.buildParam(field, parameters, stats, declare); };
            main.forEach(buildParam);
            fields.forEach(buildParam);
            if (from !== undefined)
                parameters.push(orderField);
            if (from === undefined)
                declare.var(vOrder, new il_1.SmallInt());
            stats.push(proc.createTransaction());
            // 利用select owner for update 锁住arr的操作
            let selectLock = factory.createSelect();
            stats.push(selectLock);
            selectLock.toVar = true;
            selectLock.col('id', ownerField.name);
            selectLock.from(new statementWithFrom_1.EntityTable(name, hasUnit));
            selectLock.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(ownerField.name)));
            selectLock.lock = select_1.LockType.update;
            let iff = factory.createIf();
            stats.push(iff);
            iff.cmp = new sql_1.ExpIsNull(varId);
            let selectVId = this.context.buildSelectVID(name, id.name, taName);
            iff.then(selectVId);
            let updateVId = factory.createUpdate();
            iff.then(updateVId);
            updateVId.cols = [{
                    col: 'tuidVId',
                    val: new sql_1.ExpAdd(varId, sql_1.ExpVal.num1)
                }];
            updateVId.table = (0, __1.sysTable)(il_1.EnumSysTable.entity);
            updateVId.where = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(name + '.' + taName));
            let insert = factory.createInsert();
            iff.then(insert);
            insert.table = new sql_1.SqlEntityTable(tblName, undefined, false);
            insert.cols = [
                { col: id.name, val: varId },
                { col: ownerField.name, val: new sql_1.ExpVar(ownerField.name) },
            ];
            let buildColVal = (f) => {
                let fn = f.name;
                let val = new sql_1.ExpVar(fn);
                syncStats.push(this.buildSyncTuidField(f, val));
                return { col: fn, val: val };
            };
            main.forEach(buildColVal);
            fields.forEach(buildColVal);
            let orderMax = factory.createSelect();
            iff.then(orderMax);
            orderMax.lock = select_1.LockType.update;
            orderMax.toVar = true;
            orderMax.column(new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_max, new sql_1.ExpField(orderField.name)), sql_1.ExpVal.num1), vOrder);
            orderMax.from(new statementWithFrom_1.EntityTable(tblName, false));
            orderMax.where(new sql_1.ExpEQ(new sql_1.ExpField(ownerField.name), new sql_1.ExpVar(ownerField.name)));
            let iffOrderMax = factory.createIf();
            iff.then(iffOrderMax);
            iffOrderMax.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(vOrder));
            let setOrder = factory.createSet();
            iffOrderMax.then(setOrder);
            setOrder.equ(vOrder, sql_1.ExpVal.num1);
            let updateOrder = factory.createUpdate();
            iff.then(updateOrder);
            updateOrder.table = new sql_1.SqlEntityTable(tblName, undefined, false);
            updateOrder.cols = [{
                    col: orderField.name,
                    val: new sql_1.ExpVar(vOrder)
                }];
            updateOrder.where = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField(ownerField.name), new sql_1.ExpVar(ownerField.name)), new sql_1.ExpEQ(new sql_1.ExpField(id.name), new sql_1.ExpVar('id')));
            let upsert = factory.createUpsert();
            stats.push(upsert);
            upsert.table = new sql_1.SqlEntityTable(tblName, undefined, false);
            upsert.cols = main.map(f => {
                let fn = f.name;
                let val = new sql_1.ExpVar(fn);
                syncStats.push(this.buildSyncTuidField(f, val));
                return { col: fn, val: val };
            });
            upsert.cols.push(...fields.map(f => {
                let fn = f.name;
                let val = new sql_1.ExpVar(fn);
                syncStats.push(this.buildSyncTuidField(f, val));
                return { col: fn, val: val };
            }));
            // 如果有id，不需要修改$order
            if (from !== undefined) {
                upsert.cols.push({
                    col: vOrder,
                    val: new sql_1.ExpVar(vOrder)
                });
            }
            upsert.keys.push({
                col: ownerField.name,
                val: new sql_1.ExpVar(ownerField.name)
            }, {
                col: id.name,
                val: varId
            });
            let retSel = factory.createSelect();
            retSel.column(varId, 'id')
                .column(varId, 'inId');
            stats.push(retSel);
            for (let s of syncStats)
                if (s !== undefined)
                    stats.push(s);
            stats.push(proc.createCommit());
        }
    }
    vid() {
        let { id, name, unique } = this.entity;
        let factory = this.context.factory;
        let proc = this.context.createProcedure(name + '$vid');
        proc.addUnitParameter();
        this.context.appObjs.procedures.push(proc);
        let uniqueParam = (0, il_1.charField)('unique', 100);
        proc.parameters.push(uniqueParam);
        let stats = proc.statements;
        let vInc = 'inc', vTuidType = 'tuidType';
        let dec = factory.createDeclare();
        stats.push(dec);
        dec.var(vInc, new il_1.BigInt());
        //dec.var(vIncSeed, new BigInt());
        dec.var(vTuidType, new il_1.Int());
        if (unique !== undefined && unique.fields.length === 1) {
            let selectIdFromUnique = factory.createSelect();
            stats.push(selectIdFromUnique);
            selectIdFromUnique.lock = select_1.LockType.update;
            selectIdFromUnique.toVar = true;
            selectIdFromUnique.column(new sql_1.ExpField(id.name), vInc);
            selectIdFromUnique.from(new statementWithFrom_1.EntityTable(name, this.hasUnit));
            selectIdFromUnique.where(new sql_1.ExpEQ(new sql_1.ExpField(unique.fields[0].name), new sql_1.ExpParam(uniqueParam.name)));
            let ifUnique = factory.createIf();
            stats.push(ifUnique);
            ifUnique.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(vInc));
            let returnId = factory.createSelect();
            ifUnique.then(returnId);
            returnId.column(new sql_1.ExpVar(vInc), 'id');
            let leave = proc.createLeaveProc();
            ifUnique.then(leave);
        }
        stats.push(proc.createTransaction());
        let selectEntity = factory.createSelect();
        stats.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(new sql_1.ExpField('id'), vTuidType);
        selectEntity.column(new sql_1.ExpField('tuidVId'), vInc);
        selectEntity.from((0, __1.sysTable)(il_1.EnumSysTable.entity));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(name)));
        selectEntity.lock = select_1.LockType.update;
        let set = factory.createSet();
        stats.push(set);
        set.equ(vInc, new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpVar(vInc), sql_1.ExpVal.num1), sql_1.ExpVal.num1));
        let update = factory.createUpdate();
        stats.push(update);
        update.table = (0, __1.sysTable)(il_1.EnumSysTable.entity);
        update.cols.push({
            col: 'tuidVId',
            val: new sql_1.ExpVar(vInc),
        });
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(vTuidType));
        let select = factory.createSelect();
        stats.push(select);
        select.column(new sql_1.ExpSub(new sql_1.ExpVar(vInc), sql_1.ExpVal.num1), 'id');
        stats.push(proc.createCommit());
        // 极端情况下，会出错。
        // 获取$vid之后，已经commit，还没有写table seed。如果有人创建新id，会冲掉$vid
        // 但是这种情况及其罕见。除非在commit之后的瞬间断电。
        /*
        let setSeed = factory.createSetTableSeed();
        stats.push(setSeed)
        setSeed.seed = new ExpVar(vInc);
        setSeed.table = new ExpStr(name);
        */
    }
    vidArr() {
        let { name, arrs } = this.entity;
        if (arrs === undefined)
            return;
        let factory = this.context.factory;
        for (let arr of arrs) {
            let { name: arrName } = arr;
            let tblName = `${name}_${arrName}`;
            let proc = this.context.createProcedure(`${tblName}$vid`);
            proc.addUnitParameter();
            this.context.appObjs.procedures.push(proc);
            let uniqueParam = (0, il_1.bigIntField)('unique');
            proc.parameters.push(uniqueParam);
            let stats = proc.statements;
            let vInc = 'inc', vTuidType = 'tuidType';
            let dec = factory.createDeclare();
            stats.push(dec);
            dec.var(vInc, new il_1.BigInt());
            dec.var(vTuidType, new il_1.Int());
            stats.push(proc.createTransaction());
            let selectEntity = factory.createSelect();
            stats.push(selectEntity);
            selectEntity.lock = select_1.LockType.update;
            selectEntity.toVar = true;
            selectEntity.column(new sql_1.ExpField('id'), vTuidType);
            selectEntity.column(new sql_1.ExpField('tuidVId'), vInc);
            selectEntity.from((0, __1.sysTable)(il_1.EnumSysTable.entity));
            selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(name + '_' + arrName)));
            let set = factory.createSet();
            stats.push(set);
            set.equ(vInc, new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpVar(vInc), sql_1.ExpVal.num1), sql_1.ExpVal.num1));
            let update = factory.createUpdate();
            stats.push(update);
            update.table = (0, __1.sysTable)(il_1.EnumSysTable.entity);
            update.cols.push({
                col: 'tuidVId',
                val: new sql_1.ExpVar(vInc),
            });
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(vTuidType));
            let select = factory.createSelect();
            stats.push(select);
            select.column(new sql_1.ExpSub(new sql_1.ExpVar(vInc), sql_1.ExpVal.num1), 'id');
            stats.push(proc.createCommit());
            // 极端情况下，会出错。
            // 获取$vid之后，已经commit，还没有写table seed。如果有人创建新id，会冲掉$vid
            // 但是这种情况及其罕见。除非在commit之后的瞬间断电。
            /*
            let setSeed = factory.createSetTableSeed();
            stats.push(setSeed)
            setSeed.seed = new ExpVar(vInc);
            setSeed.table = new ExpStr(tblName);
            */
        }
    }
    save() {
        let { name, id, global, from } = this.entity;
        let { factory, unitFieldName } = this.context;
        let proc = this.context.createProcedure(name + '$save');
        proc.addUnitUserParameter();
        this.context.appObjs.procedures.push(proc);
        let stats = proc.statements;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var('$idParam', new il_1.BigInt);
        declare.var('$id_u', new il_1.BigInt);
        let setIdParam = factory.createSet();
        stats.push(setIdParam);
        setIdParam.equ('$idParam', new sql_1.ExpVar(id.name));
        if (from === undefined) {
            declare.var('$isVId', new il_1.TinyInt());
            let tuidHasUnit = this.hasUnit === true && global === false;
            let selectId = factory.createSelect();
            selectId.col(id.name);
            selectId.from(new statementWithFrom_1.EntityTable(name, tuidHasUnit));
            let eqId = new sql_1.ExpEQ(new sql_1.ExpField(id.name), new sql_1.ExpVar(id.name));
            selectId.where(eqId);
            let iff = factory.createIf();
            stats.push(iff);
            iff.cmp = new sql_1.ExpExists(selectId);
            let setIsNotVId = factory.createSet();
            setIsNotVId.equ('$isVId', sql_1.ExpVal.num0);
            let setIsVId = factory.createSet();
            setIsVId.equ('$isVId', sql_1.ExpVal.num1);
            iff.then(setIsNotVId);
            iff.else(setIsVId);
        }
        stats.push(proc.createTransaction());
        this.buildSaveProc(proc, this.entity);
        let retSel = factory.createSelect();
        let vId = '$id';
        let varSId = new sql_1.ExpVar(vId);
        let varId = new sql_1.ExpVar(id.name);
        retSel.column(varSId, 'id')
            .column(new sql_1.ExpVar('$idParam'), 'inId');
        stats.push(retSel);
        stats.push(proc.createCommit());
    }
    buildSaveProc(proc, tuid) {
        let { name, id, main, fields, from, onSaveStatement } = tuid;
        let { factory } = this.context;
        let stats = proc.statements;
        let declare = factory.createDeclare();
        stats.push(declare);
        let parameters = proc.parameters;
        parameters.push(id);
        let buildParam = (field) => { this.context.buildParam(field, parameters, stats, declare); };
        main.forEach(buildParam);
        fields.forEach(buildParam);
        let setParam = (field) => {
            let { dataType } = field;
            if (dataType.isId === true) {
                let idDataType = dataType;
                if (idDataType.idType === '$user') {
                    let iif = factory.createIf();
                    stats.push(iif);
                    iif.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(field.name));
                    let set = factory.createSet();
                    iif.then(set);
                    set.equ(field.name, new sql_1.ExpVar('$user'));
                }
                return;
            }
            if (dataType.type === 'timestamp') {
                let iif = factory.createIf();
                stats.push(iif);
                iif.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(field.name));
                let set = factory.createSet();
                iif.then(set);
                set.equ(field.name, new sql_1.ExpFuncCustom(factory.func_current_timestamp));
                return;
            }
        };
        main.forEach(setParam);
        fields.forEach(setParam);
        let vId = '$id';
        declare.var(vId, new il_1.BigInt);
        this.declareBusVar(declare, this.entity.buses, stats);
        let syncStats = [];
        this.buildTuidUpsert(stats, tuid, syncStats, proc.createCommit());
        if (onSaveStatement !== undefined) {
            let sqls = new bstatement_1.Sqls(this.context, stats);
            const { statements } = onSaveStatement;
            sqls.head(statements);
            sqls.body(statements);
            sqls.foot(statements);
        }
        this.buildBusWriteQueueStatement(stats, this.entity.buses);
        stats.push(...syncStats);
    }
    buildTuidUpsert(stats, tuid, syncStats, commit) {
        let { id, from, main, fields, name, isOpen, global, unique } = tuid;
        let varId = new sql_1.ExpVar(id.name);
        let dollarId = '$id';
        let varDollarId = new sql_1.ExpVar(dollarId);
        if (id.autoInc === false) {
            // 暂时没有select id back
            let upsert = this.buildNoAutoIdTuidUpsert(tuid, syncStats);
            stats.push(upsert);
            let set = this.context.factory.createSet();
            stats.push(set);
            set.equ(dollarId, varId);
            return;
        }
        let { factory } = this.context;
        let tuidHasUnit = this.hasUnit === true && global === false;
        function fieldColVal(f) {
            let fn = f.name;
            return { col: fn, val: new sql_1.ExpVar(fn) };
        }
        let cols = [
            ...main.map(fieldColVal),
            ...fields.map(fieldColVal)
        ];
        let colUnit = { col: sqlBuilder_1.unitFieldName, val: new sql_1.ExpVar(sqlBuilder_1.unitFieldName) };
        let updateWhereUnique = [];
        let idu = '$id_u';
        let varIdU = new sql_1.ExpVar(idu);
        if (unique !== undefined) {
            let selectId = factory.createSelect();
            stats.push(selectId);
            selectId.toVar = true;
            selectId.col(id.name, idu);
            selectId.from(new statementWithFrom_1.EntityTable(name, tuidHasUnit));
            selectId.lock = select_1.LockType.update;
            let wheres = [];
            for (let f of unique.fields) {
                let { name } = f;
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(name), new sql_1.ExpVar(name)));
            }
            selectId.where(new sql_1.ExpAnd(...wheres));
            let iffUNotNUll = factory.createIf();
            stats.push(iffUNotNUll);
            iffUNotNUll.cmp = new sql_1.ExpIsNotNull(varIdU);
            let iffRet = factory.createIf();
            iffUNotNUll.then(iffRet);
            iffRet.cmp = new sql_1.ExpOr(new sql_1.ExpLE(varId, sql_1.ExpNum.num0), new sql_1.ExpAnd(new sql_1.ExpGT(varId, sql_1.ExpNum.num0), new sql_1.ExpNE(varId, varIdU)));
            let selectRet = factory.createSelect();
            iffRet.then(selectRet);
            selectRet.column(new sql_1.ExpNum(0), 'id');
            iffRet.then(commit);
            let leave = factory.createLeaveProc();
            iffRet.then(leave);
            let iffIdNeg = factory.createIf();
            stats.push(iffIdNeg);
            iffIdNeg.cmp = new sql_1.ExpLE(varId, sql_1.ExpNum.num0);
            let setIdNull = factory.createSet();
            iffIdNeg.then(setIdNull);
            setIdNull.equ(id.name, sql_1.ExpVal.null);
        }
        let selectVId = this.context.buildSelectVID(name, dollarId); // factory.createSelect();
        stats.push(selectVId);
        let updateVId = factory.createUpdate();
        updateVId.cols = [{
                col: 'tuidVId',
                val: new sql_1.ExpAdd(varDollarId, sql_1.ExpVal.num1)
            }];
        updateVId.table = (0, __1.sysTable)(il_1.EnumSysTable.entity);
        updateVId.where = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(name));
        let iff = factory.createIf();
        stats.push(iff);
        iff.cmp = new sql_1.ExpIsNull(varId);
        if (unique === undefined) {
            iff.then(updateVId);
            let insert = factory.createInsert();
            iff.then(insert);
            insert.table = new statementWithFrom_1.EntityTable(name, tuidHasUnit);
            insert.cols = [{
                    col: id.name, val: varDollarId
                }, ...cols];
            if (tuidHasUnit === true)
                insert.cols.push(colUnit);
        }
        else {
            let iffUniqueIdNull = factory.createIf();
            iff.then(iffUniqueIdNull);
            iffUniqueIdNull.cmp = new sql_1.ExpIsNull(varIdU);
            iffUniqueIdNull.then(updateVId);
            let setDIdFromU = factory.createSet();
            setDIdFromU.equ(dollarId, varIdU);
            iffUniqueIdNull.else(setDIdFromU);
            for (let f of unique.fields) {
                let fn = f.name;
                let v = new sql_1.ExpVar(fn);
                updateWhereUnique.push(
                //new ExpOr( 如果id null的时候，unique必须有值。所以得去掉这里的null判断。否则，有可能把整个表的字段改写了
                // 这是一个恐怖错误
                //    new ExpIsNull(v),
                new sql_1.ExpEQ(new sql_1.ExpField(fn), v)
                //)
                );
            }
            let upsert = factory.createUpsert();
            iff.then(upsert);
            let upsertCols = [{
                    col: id.name, val: varDollarId
                }], upsertKeys = [];
            upsert.table = new statementWithFrom_1.EntityTable(name, tuidHasUnit);
            upsert.cols = upsertCols;
            upsert.keys = upsertKeys;
            function eachFields(fieldArr) {
                for (let f of fieldArr) {
                    let fn = f.name;
                    let columns = unique.fields.findIndex(v => v.name === fn) < 0 ?
                        upsertCols : upsertKeys;
                    columns.push({ col: fn, val: new sql_1.ExpVar(fn) });
                }
            }
            eachFields(main);
            eachFields(fields);
            if (tuidHasUnit === true) {
                upsertKeys.push(colUnit);
            }
        }
        let setId = factory.createSet();
        setId.equ(dollarId, varId);
        let iffBiggerVId = factory.createIf();
        iff.else(iffBiggerVId);
        iffBiggerVId.cmp = new sql_1.ExpGT(varId, varDollarId);
        iffBiggerVId.then(setId);
        iffBiggerVId.then(updateVId);
        iffBiggerVId.else(setId);
        let ifIsVId = factory.createIf();
        iff.else(ifIsVId);
        ifIsVId.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('$isVId'), sql_1.ExpVal.num1);
        let insertId = factory.createInsert();
        ifIsVId.then(insertId);
        insertId.table = new statementWithFrom_1.EntityTable(name, tuidHasUnit);
        insertId.cols = [
            { col: id.name, val: new sql_1.ExpVar(id.name) },
            ...cols
        ];
        if (tuidHasUnit === true)
            insertId.cols.push(colUnit);
        let update = factory.createUpdate();
        ifIsVId.else(update);
        update.table = new statementWithFrom_1.EntityTable(name, tuidHasUnit);
        update.cols = cols;
        /*
        let updateWheres:ExpCmp[] = [new ExpEQ(new ExpField(id.name), varId)];
        if (tuidHasUnit === true) {
            updateWheres.push(new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)));
        }
        update.where = new ExpAnd(...updateWheres);
        */
        let updateIdEqu = new sql_1.ExpEQ(new sql_1.ExpField(id.name), varId);
        let updateNoUnitWhere;
        if (updateWhereUnique.length > 0) {
            updateNoUnitWhere = new sql_1.ExpOr(updateIdEqu, new sql_1.ExpAnd(new sql_1.ExpIsNull(new sql_1.ExpVar(id.name)), ...updateWhereUnique));
        }
        else {
            updateNoUnitWhere = updateIdEqu;
        }
        update.where = (tuidHasUnit === true) ?
            new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField(sqlBuilder_1.unitFieldName), new sql_1.ExpVar(sqlBuilder_1.unitFieldName)), updateNoUnitWhere)
            :
                updateNoUnitWhere;
        let iffUpdateRowCount = factory.createIf();
        ifIsVId.else(iffUpdateRowCount);
        iffUpdateRowCount.cmp = new sql_1.ExpEQ(new sql_1.ExpFunc(factory.func_rowCount), sql_1.ExpVal.num0);
        let setNetId = factory.createSet();
        iffUpdateRowCount.then(setNetId);
        setNetId.equ(dollarId, new sql_1.ExpNeg(varId));
        // 非导入tuid，id参数有值，不是vid
        if (from === undefined) {
            let varIdParam = new sql_1.ExpVar('$idParam');
            let statModifyQueue = this.context.buildModifyQueue(tuid, varIdParam);
            if (statModifyQueue) {
                let iffModified = factory.createIf();
                stats.push(iffModified);
                iffModified.cmp = new sql_1.ExpAnd(new sql_1.ExpGT(varIdParam, sql_1.ExpNum.num0), new sql_1.ExpEQ(new sql_1.ExpVar('$isVId'), sql_1.ExpVal.num0));
                iffModified.then(...statModifyQueue);
            }
        }
        let syncField = (f) => {
            syncStats.push(this.buildSyncTuidField(f, new sql_1.ExpVar(f.name)));
        };
        main.forEach(syncField);
        fields.forEach(syncField);
    }
    buildNoAutoIdTuidUpsert(tuid, syncStats) {
        let { id, fields, main, from } = tuid;
        let factory = this.context.factory;
        let upsert = factory.createUpsert();
        let { unitField } = this.context;
        upsert.table = new sql_1.SqlEntityTable(tuid, undefined, this.hasUnit);
        let { cols, keys } = upsert;
        for (let f of fields) {
            let val = new sql_1.ExpVar(f.name);
            cols.push({ col: f.name, val: val });
            syncStats.push(this.buildSyncTuidField(f, val));
        }
        for (let f of main) {
            let val = new sql_1.ExpVar(f.name);
            cols.push({ col: f.name, val: val });
            syncStats.push(this.buildSyncTuidField(f, val));
        }
        if (this.hasUnit == true) {
            let col = { col: unitField.name, val: new sql_1.ExpVar(unitField.name) };
            keys.push(col);
        }
        let idCol = { col: id.name, val: new sql_1.ExpVar(id.name) };
        keys.push(idCol);
        return upsert;
    }
    buildSearchProc(tuid) {
        let { name, owner } = tuid;
        let factory = this.context.factory;
        let proc = this.context.createProcedure((owner === undefined ? '' : owner.name + '_') + name + '$search');
        proc.addUnitUserParameter();
        let { parameters, statements } = proc;
        let key = new il_1.Field();
        key.name = '$key';
        key.dataType = new il_1.Text();
        let pageStart = new il_1.Field();
        pageStart.name = '$pageStart';
        pageStart.dataType = new il_1.BigInt();
        let pageSize = new il_1.Field();
        pageSize.name = '$pageSize';
        pageSize.dataType = new il_1.Int();
        if (tuid.owner !== undefined) {
            parameters.push((0, il_1.bigIntField)(tuid.ownerField.name));
        }
        parameters.push(key, pageStart, pageSize);
        let declare = factory.createDeclare();
        statements.push(declare);
        let dtChar = new il_1.Char(), dtInt = new il_1.Int;
        dtChar.size = 50;
        let varKey = new sql_1.ExpVar(key.name);
        let space = new sql_1.ExpStr(' ');
        let percent = new sql_1.ExpStr('%');
        let key1 = '$key1', key2 = '$key2', c = '$c', p = '$p', s1 = '$s1', s2 = '$s2', len = '$len';
        let varKey1 = new sql_1.ExpVar(key1);
        let varKey2 = new sql_1.ExpVar(key2);
        let varC = new sql_1.ExpVar(c);
        let varP = new sql_1.ExpVar(p);
        let varS1 = new sql_1.ExpVar(s1);
        let varS2 = new sql_1.ExpVar(s2);
        let varLen = new sql_1.ExpVar(len);
        declare.var(key1, dtChar).var(key2, dtChar)
            .var(c, dtInt).var(p, dtInt)
            .var(s1, dtInt).var(s2, dtInt).var(len, dtInt);
        let num0 = sql_1.ExpVal.num0;
        let num1 = sql_1.ExpVal.num1;
        let s11 = new sql_1.ExpAdd(varS1, num1);
        let s1n1 = new sql_1.ExpSub(varS1, num1);
        let set = factory.createSet();
        statements.push(set);
        set.equ(pageSize.name, new sql_1.ExpAdd(new sql_1.ExpVar(pageSize.name), num1));
        set = factory.createSet();
        statements.push(set);
        set.equ(len, new sql_1.ExpFunc(factory.func_length, varKey));
        set = factory.createSet();
        statements.push(set);
        set.equ(s1, new sql_1.ExpFunc(factory.func_charindex, space, varKey));
        set = factory.createSet();
        statements.push(set);
        set.equ(s2, new sql_1.ExpFunc(factory.func_charindex, space, varKey, s11));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpEQ(varS1, sql_1.ExpVal.num0);
        set = factory.createSet();
        iff.then(set);
        set.equ(key1, new sql_1.ExpFunc('CONCAT', percent, varKey, percent));
        set = factory.createSet();
        iff.then(set);
        set.equ(key2, new sql_1.ExpFunc('CONCAT', percent, varKey, percent));
        let key1Part = new sql_1.ExpFunc('SUBSTRING', varKey, num1, s1n1);
        let key2Part = new sql_1.ExpFunc('SUBSTRING', varKey, s11, new sql_1.ExpSub(varS2, s11));
        let key2End = new sql_1.ExpFunc('SUBSTRING', varKey, s11, new sql_1.ExpSub(varLen, varS1));
        let iff2 = factory.createIf();
        iff.else(iff2);
        iff2.cmp = new sql_1.ExpEQ(varS2, sql_1.ExpVal.num0);
        set = factory.createSet();
        iff2.then(set);
        set.equ(key1, new sql_1.ExpFunc('CONCAT', percent, key1Part, percent, key2End, percent));
        set = factory.createSet();
        iff2.then(set);
        set.equ(key2, new sql_1.ExpFunc('CONCAT', percent, key2End, percent, key1Part, percent));
        set = factory.createSet();
        iff2.else(set);
        set.equ(key1, new sql_1.ExpFunc('CONCAT', percent, key1Part, percent, key2Part, percent));
        set = factory.createSet();
        iff2.else(set);
        set.equ(key2, new sql_1.ExpFunc('CONCAT', percent, key2Part, percent, key1Part, percent));
        set = factory.createSet();
        iff2.else(set);
        set.equ(p, new sql_1.ExpAdd(varS2, num1));
        let loop = factory.createWhile();
        iff2.else(loop);
        loop.no = 1;
        loop.cmp = new sql_1.ExpEQ(num1, num1);
        set = factory.createSet();
        loop.statements.add(set);
        set.equ(c, new sql_1.ExpFunc(factory.func_charindex, space, varKey, new sql_1.ExpAdd(varP, num1)));
        let iff3 = factory.createIf();
        loop.statements.add(iff3);
        iff3.cmp = new sql_1.ExpEQ(varC, num0);
        let p1 = new sql_1.ExpAdd(varP, num1);
        let p1n1 = new sql_1.ExpSub(varP, num1);
        let pEnd = new sql_1.ExpFunc('SUBSTRING', varKey, varP, new sql_1.ExpSub(varLen, p1n1));
        set = factory.createSet();
        iff3.then(set);
        set.equ(key1, new sql_1.ExpFunc('CONCAT', varKey1, pEnd, percent));
        set = factory.createSet();
        iff3.then(set);
        set.equ(key2, new sql_1.ExpFunc('CONCAT', varKey2, pEnd, percent));
        let leave = factory.createBreak();
        iff3.then(leave);
        leave.no = 1;
        let pToC = new sql_1.ExpFunc('SUBSTRING', varKey, varP, new sql_1.ExpSub(varC, varP));
        set = factory.createSet();
        iff3.else(set);
        set.equ(key1, new sql_1.ExpFunc('CONCAT', varKey1, pToC, percent));
        set = factory.createSet();
        iff3.else(set);
        set.equ(key2, new sql_1.ExpFunc('CONCAT', varKey2, pToC, percent));
        set = factory.createSet();
        iff3.else(set);
        set.equ(p, new sql_1.ExpAdd(varC, num1));
        return proc;
    }
    search() {
        let proc = this.buildSearchProc(this.entity);
        let { id } = this.entity;
        let sel = this.createSelect();
        proc.statements.push(sel);
        this.selMain(this.entity, sel);
        let wheres = [];
        wheres.push(new sql_1.ExpGT(new sql_1.ExpField(id.name, 't0'), new sql_1.ExpVar('$pageStart')));
        sel.where(new sql_1.ExpAnd(...wheres));
        sel.order(new sql_1.ExpField(id.name, 't0'), 'asc');
        sel.limit(new sql_1.ExpVar('$pageSize'));
        let tn = 0;
        let p = this.entity;
        let s = p.search;
        if (s !== undefined) {
            let tbl = 't' + tn;
            sel.search(s, '$key1', tbl);
            sel.search(s, '$key2', tbl);
        }
        let { procedures } = this.context.appObjs;
        procedures.push(proc);
        let { arrs } = this.entity;
        if (arrs === undefined)
            return;
        for (let arr of arrs) {
            procedures.push(this.buildArrSearch(arr));
        }
    }
    buildArrSearch(arr) {
        let proc = this.buildSearchProc(arr);
        let { id, owner, ownerField } = arr;
        let sel = this.context.factory.createSelect();
        proc.statements.push(sel);
        let tbl0 = 't0';
        sel.col(id.name, id.name, tbl0);
        sel.col(ownerField.name, ownerField.name, tbl0);
        this.selMain(arr, sel);
        this.selFields(arr, sel);
        sel.from(new statementWithFrom_1.EntityTable(this.entity.name + '_' + arr.name, false, tbl0));
        let wheres = [];
        wheres.push(new sql_1.ExpGT(new sql_1.ExpField(id.name, 't0'), new sql_1.ExpVar('$pageStart')));
        wheres.push(new sql_1.ExpOr(new sql_1.ExpEQ(new sql_1.ExpVar(ownerField.name), sql_1.ExpVal.num0), new sql_1.ExpIsNull(new sql_1.ExpVar(ownerField.name)), new sql_1.ExpEQ(new sql_1.ExpField(ownerField.name, tbl0), new sql_1.ExpVar(ownerField.name))));
        sel.where(new sql_1.ExpAnd(...wheres));
        sel.limit(new sql_1.ExpVar('$pageSize'));
        let p = arr;
        let s = p.search;
        if (s !== undefined) {
            let tbl = 't0';
            sel.search(s, '$key1', tbl);
            sel.search(s, '$key2', tbl);
        }
        return proc;
    }
    checkPull() {
        let { name } = this.entity;
        let p = this.context.createProcedure(name + '$pull_check');
        this.context.pullCheckProc(p, name, 'tuid');
        this.context.appObjs.procedures.push(p);
    }
}
exports.BTuid = BTuid;
class BTuidUser extends BTuid {
    search() { }
    save() {
        let { name, id, /*base, */ main, fields } = this.entity;
        let factory = this.context.factory;
        let proc = this.context.createProcedure(name + '$save');
        proc.addUnitUserParameter();
        let { appObjs, userParam } = this.context;
        appObjs.procedures.push(proc);
        let stats = proc.statements;
        proc.parameters.push(id, ...main, ...fields);
        let iff = factory.createIf();
        stats.push(iff);
        iff.cmp = new sql_1.ExpEQ(new sql_1.ExpVar(userParam.name), new sql_1.ExpVar('id'));
        iff.then(proc.createTransaction());
        let dollarId = '$id';
        let varDollarId = new sql_1.ExpVar(dollarId);
        let varId = new sql_1.ExpVar(id.name);
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(dollarId, new il_1.BigInt());
        let syncStats = [];
        this.buildTuidUpsert(iff.thenStatements, this.entity, syncStats, proc.createCommit());
        iff.then(proc.createCommit());
        let retSel = factory.createSelect();
        stats.push(retSel);
        retSel.column(varDollarId, 'id')
            .column(varId, 'inId');
    }
}
class BTuidSheet extends BTuid {
    search() { }
    save() { }
}
//# sourceMappingURL=tuid.js.map