"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BMap = exports.BBook = exports.BBookBase = void 0;
const il = require("../../il");
const sql = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const entity_1 = require("./entity");
const sql_1 = require("../sql");
const bstatement_1 = require("../bstatement");
class BBookBase extends entity_1.BEntityBusable {
    buildTables() {
        let { name, indexes } = this.entity;
        let table = this.context.createTable(name);
        table.keys = this.entity.getKeys();
        table.fields = this.entity.getFields();
        if (indexes !== undefined)
            table.indexes.push(...indexes);
        this.context.appObjs.tables.push(table);
    }
    buildProcedures() {
        this.procSave();
    }
    procSave() {
        let { name } = this.entity;
        let proc = this.context.createProcedure(name + '$save');
        this.buildSave(proc);
        this.context.appObjs.procedures.push(proc);
    }
}
exports.BBookBase = BBookBase;
class BBook extends BBookBase {
    buildProcedures() {
        super.buildProcedures();
        let { name, keys } = this.entity;
        let p = this.context.createProcedure(name);
        p.addUnitUserParameter();
        let pageStart = il.charField('$pageStart', 100);
        let pageSize = il.intField('$pageSize');
        let paramKeys = [];
        let len = keys.length;
        for (let i = 0; i < len - 1; i++)
            paramKeys.push(keys[i]);
        let lastField = keys[len - 1];
        p.parameters.push(pageStart, pageSize, ...paramKeys);
        let iff = this.context.factory.createIf();
        p.statements.push(iff);
        iff.cmp = new sql.ExpIsNull(new sql.ExpVar(pageStart.name));
        let set = this.context.factory.createSet();
        iff.then(set);
        set.equ(pageStart.name, new sql.ExpNum(0));
        let select = this.context.factory.createSelect();
        let ta = 'a', tb = 'b';
        p.statements.push(select);
        select.column(new sql.ExpField(lastField.name, ta));
        for (let f of this.entity.fields)
            select.column(new sql.ExpField(f.name, ta));
        select.from(new statementWithFrom_1.EntityTable(this.entity.name, this.context.hasUnit, ta));
        let wheres = [];
        wheres.push(new sql.ExpGT(new sql.ExpField(lastField.name, ta), new sql.ExpVar(pageStart.name)));
        for (let i = 0; i < len - 1; i++) {
            let { name: kn } = keys[i];
            wheres.push(new sql.ExpEQ(new sql.ExpField(kn, ta), new sql.ExpVar(kn)));
        }
        if (wheres.length > 0)
            select.where(new sql.ExpAnd(...wheres));
        select.limit(new sql.ExpVar(pageSize.name));
        select.order(new sql.ExpField(lastField.name, ta), 'asc');
        this.context.appObjs.procedures.push(p);
    }
    buildSave(proc) {
        let { factory, hasUnit } = this.context;
        let { name, keys, fields } = this.entity;
        proc.addUnitUserParameter();
        let { parameters, statements } = proc;
        let declare = factory.createDeclare();
        statements.push(declare);
        keys.forEach(v => this.context.buildParam(v, parameters, statements, declare));
        fields.forEach(v => this.context.buildParam(v, parameters, statements, declare));
        let upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.table = new statementWithFrom_1.EntityTable(name, hasUnit);
        upsert.keys = keys.map(v => { let vn = v.name; return { col: vn, val: new sql_1.ExpVar(vn) }; });
        if (hasUnit === true) {
            upsert.keys.push({
                col: '$unit',
                val: new sql_1.ExpVar('$unit'),
            });
        }
        upsert.cols = fields.map(v => { let vn = v.name; return { col: vn, val: new sql_1.ExpVar(vn) }; });
    }
}
exports.BBook = BBook;
class BMap extends BBookBase {
    buildSave(proc) {
        let { factory, hasUnit, unitFieldName } = this.context;
        let { statements } = proc;
        this.buildRoleCheck(statements);
        let declare = factory.createDeclare();
        statements.push(declare);
        let { name, keys, fields, isOpen } = this.entity;
        proc.addUnitUserParameter();
        proc.parameters.push(...keys, ...fields);
        function fieldToCol(f) {
            let vn = f.name;
            return { col: vn, val: new sql_1.ExpVar(vn) };
        }
        let keyCols = keys.map(fieldToCol);
        let fieldCols = fields.map(fieldToCol);
        let upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.table = new statementWithFrom_1.EntityTable(name, hasUnit);
        upsert.cols = fieldCols;
        upsert.keys = keyCols;
        if (isOpen === true) {
            let modifyQueue = this.context.buildModifyQueue(this.entity, new sql_1.ExpFunc(factory.func_concat_ws, new sql_1.ExpStr('\\t'), ...keys.map(v => new sql_1.ExpVar(v.name))));
            if (modifyQueue)
                statements.push(...modifyQueue);
        }
        this.declareBusVar(declare, this.entity.buses, statements);
        let { onAddStatement } = this.entity;
        if (onAddStatement !== undefined) {
            let sqls = new bstatement_1.Sqls(this.context, statements);
            const { statements: stats } = onAddStatement;
            sqls.head(stats);
            sqls.body(stats);
            sqls.foot(stats);
        }
        this.buildBusWriteQueueStatement(statements, this.entity.buses);
        keys.forEach(v => statements.push(this.context.buildPullTuidField(v, new sql_1.ExpVar(v.name))));
        fields.forEach(v => statements.push(this.context.buildPullTuidField(v, new sql_1.ExpVar(v.name))));
    }
}
exports.BMap = BMap;
//# sourceMappingURL=book.js.map