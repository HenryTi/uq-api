"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BIX = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const entity_1 = require("./entity");
class BIX extends entity_1.BEntity {
    constructor(context, entity) {
        super(context, entity);
        this.entity = entity;
        this.init();
    }
    init() {
        let { ixx, i, x } = this.entity;
        const vI = i.name, vX = x.name;
        this.params = [
            (0, il_1.bigIntField)(vI),
            (0, il_1.bigIntField)(vX)
        ];
        this.cols = [
            { col: vI, val: new sql_1.ExpVar(vI) },
            { col: vX, val: new sql_1.ExpVar(vX) },
        ];
        this.andCmps = [
            new sql_1.ExpEQ(new sql_1.ExpField(vI, 'a'), new sql_1.ExpVar(vI)),
            new sql_1.ExpEQ(new sql_1.ExpField(vX, 'a'), new sql_1.ExpVar(vX)),
        ];
        if (ixx) {
            const vIxx = 'ixx';
            this.params.unshift((0, il_1.bigIntField)(vIxx));
            this.cols.unshift({ col: vIxx, val: new sql_1.ExpVar(vIxx) });
            this.andCmps.unshift(new sql_1.ExpEQ(new sql_1.ExpField(vIxx, 'a'), new sql_1.ExpVar(vIxx)));
        }
    }
    buildTables() {
        let { name, twoWayIndex, ixx, i, x, indexes, prev, fieldsValuesList, stampCreate, stampUpdate, isConst, onlyForSyntax } = this.entity;
        if (onlyForSyntax === true)
            return;
        let table = this.context.createTable(name);
        table.hasUnit = false;
        table.keys = this.entity.getKeys();
        table.fields = [...this.entity.getFields()];
        if (isConst === true) {
            let validField = (0, il_1.tinyIntField)('$valid');
            validField.defaultValue = 2;
            table.fields.push(validField);
        }
        if (indexes) {
            table.indexes.push(...indexes);
        }
        if (twoWayIndex === true) {
            let index = new il_1.Index(`${x.name}_${i.name}`);
            index.unique = true;
            let arr = [x, i];
            if (ixx)
                arr.unshift(ixx);
            index.fields = arr;
            table.indexes.push(index);
        }
        if (prev !== undefined) {
            let index = new il_1.Index('ix_seq');
            index.unique = true;
            index.fields = [i, prev];
            table.indexes.push(index);
        }
        table.fieldsValuesList = this.convertTableFieldsValuesList(fieldsValuesList);
        this.buildSysFields(table, stampCreate, stampUpdate);
        this.context.appObjs.tables.push(table);
    }
    buildProcedures() {
        let { onlyForSyntax, name, prev } = this.entity;
        if (onlyForSyntax === true)
            return;
        this.buildAct(this.context.createAppProc(name + '$act', true));
        if (prev !== undefined) {
            //let returnType = new BigInt();
            //let p = this.context.createAppFunc(`${name}$sort`, returnType);
            //this.buildSort(p);
        }
    }
    buildAct(p) {
        let { name } = this.entity;
        let { factory } = this.context;
        p.parameters.push((0, il_1.tinyIntField)('act'));
        p.parameters.push(...this.params);
        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('act'), sql_1.ExpNum.num1);
        let insert = factory.createInsert();
        iff.then(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.EntityTable(name, false);
        insert.cols = [...this.cols];
        let elseStats = new sql_1.Statements();
        iff.elseIf(new sql_1.ExpEQ(new sql_1.ExpVar('act'), sql_1.ExpNum.num2), elseStats);
        let del = factory.createDelete();
        elseStats.add(del);
        del.tables = ['a'];
        del.from(new statementWithFrom_1.EntityTable(name, false, 'a'));
        del.where(new sql_1.ExpAnd(...this.andCmps));
    }
}
exports.BIX = BIX;
//# sourceMappingURL=IX.js.map