"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BIDX = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const entity_1 = require("./entity");
class BIDX extends entity_1.BEntity {
    buildTables() {
        let { name, id, indexes, stampCreate, stampUpdate, fieldsValuesList } = this.entity;
        // let { hasUnit } = this.context;
        let table = this.context.createTable(name);
        table.hasUnit = false; // global === false && hasUnit === true;
        table.id = id;
        table.keys = this.entity.getKeys();
        table.fields = [
            ...this.entity.getFields(),
        ];
        if (fieldsValuesList !== undefined) {
            table.fieldsValuesList = this.convertTableFieldsValuesList(fieldsValuesList);
            let validField = (0, il_1.tinyIntField)('$valid');
            validField.defaultValue = 2;
            table.fields.push(validField);
        }
        if (indexes) {
            table.indexes.push(...indexes);
        }
        this.buildSysFields(table, stampCreate, stampUpdate);
        this.context.appObjs.tables.push(table);
    }
    buildProcedures() {
        let { name } = this.entity;
        this.buildAct(this.context.createAppProc(name + '$act', true));
    }
    buildAct(p) {
        let { name } = this.entity;
        let { factory } = this.context;
        const vId = 'id';
        p.parameters.push((0, il_1.tinyIntField)('act'), (0, il_1.bigIntField)(vId));
        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('act'), sql_1.ExpNum.num1);
        let insert = factory.createInsert();
        iff.then(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.EntityTable(name, false);
        insert.cols = [
            { col: vId, val: new sql_1.ExpVar(vId) },
        ];
        let elseStats = new sql_1.Statements();
        iff.elseIf(new sql_1.ExpEQ(new sql_1.ExpVar('act'), sql_1.ExpNum.num2), elseStats);
        let del = factory.createDelete();
        elseStats.add(del);
        del.tables = ['a'];
        del.from(new statementWithFrom_1.EntityTable(name, false, 'a'));
        del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField(vId, 'a'), new sql_1.ExpVar(vId))));
    }
}
exports.BIDX = BIDX;
//# sourceMappingURL=IDX.js.map