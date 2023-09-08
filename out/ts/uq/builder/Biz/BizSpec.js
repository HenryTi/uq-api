"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizSpec = void 0;
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizBase_1 = require("./BizBase");
class BBizSpec extends BizBase_1.BBizBase {
    buildTables() {
        let { appObjs } = this.context;
        let { tables } = appObjs;
        let table = this.context.createTable(`spec$${this.base.name}`);
        tables.push(table);
        let { keyFields, propFields } = this.base;
        let idField = (0, il_1.bigIntField)('id');
        table.keys = [idField];
        let baseField = (0, il_1.bigIntField)('base');
        let indexFields = [baseField];
        let fields = table.fields = [
            idField,
            baseField,
        ];
        fields.push(...keyFields);
        indexFields.push(...keyFields);
        fields.push(...propFields);
        let index = new il_1.Index('base_keys', true);
        index.fields.push(...indexFields);
        table.indexes.push(index);
    }
    buildProcedures() {
        let { appObjs } = this.context;
        let { procedures } = appObjs;
        let func = this.context.createFunction(`spec$${this.base.name}$id`, new il_1.BigInt());
        procedures.push(func);
        this.buildIdFunc(func);
    }
    buildIdFunc(func) {
        let { factory } = this.context;
        let { parameters, statements } = func;
        parameters.push((0, il_1.tinyIntField)('$new'), (0, il_1.bigIntField)('$atom'));
        let { name, keys, keyFields } = this.base;
        parameters.push(...keyFields);
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)('$id'));
        let varAtom = new sql_1.ExpVar('$atom');
        let ret$Id = factory.createReturn();
        ret$Id.returnVar = '$id';
        let entityTable = new statementWithFrom_1.EntityTable(`spec$${name}`, false);
        let selectId = factory.createSelect();
        statements.push(selectId);
        selectId.toVar = true;
        selectId.col('id', '$id');
        selectId.from(entityTable);
        let wheres = [];
        for (let [, value] of keys) {
            let { name } = value;
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(name), new sql_1.ExpVar(name)));
        }
        selectId.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('base'), varAtom), ...wheres));
        let ifNew0 = factory.createIf();
        statements.push(ifNew0);
        ifNew0.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('$new'), sql_1.ExpNum.num0);
        ifNew0.then(ret$Id);
        let if$Id = factory.createIf();
        statements.push(if$Id);
        if$Id.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar('$id'));
        if$Id.then(ret$Id);
        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(name)));
        selectEntity.lock = select_1.LockType.update;
        let set$Id = factory.createSet();
        statements.push(set$Id);
        set$Id.equ('$id', new sql_1.ExpFuncInUq('$IDNU', [new sql_1.ExpSelect(selectEntity)], true));
        let insert = factory.createInsert();
        statements.push(insert);
        insert.table = entityTable;
        insert.cols = [
            { col: 'id', val: new sql_1.ExpVar('$id') },
            { col: 'base', val: varAtom },
        ];
        let { cols } = insert;
        for (let [, value] of keys) {
            let { name: kName } = value;
            cols.push({ col: kName, val: new sql_1.ExpVar(kName) });
        }
        statements.push(ret$Id);
    }
}
exports.BBizSpec = BBizSpec;
//# sourceMappingURL=BizSpec.js.map