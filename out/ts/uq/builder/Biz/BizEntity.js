"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizEntity = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a';
const b = 'b';
const c = 'c';
const tempBinTable = 'bin';
class BBizEntity {
    constructor(context, bizEntity) {
        this.context = context;
        this.bizEntity = bizEntity;
    }
    async buildTables() {
    }
    async buildProcedures() {
        this.bizEntity.forEachBud((bud) => {
            const { value } = bud;
            if (value === undefined)
                return;
        });
    }
    async buildBudsValue() {
        this.bizEntity.forEachBud((bud) => {
            if (!bud)
                return;
            let { value } = bud;
            if (value === undefined)
                return;
            let { exp, act } = value;
            let str = this.stringify(exp);
            switch (act) {
                case il_1.BudValueAct.init:
                    str += '\ninit';
                    break;
                case il_1.BudValueAct.equ:
                    str += '\nequ';
                    break;
                case il_1.BudValueAct.show:
                    str += '\nshow';
                    break;
            }
            value.str = str;
        });
    }
    createProcedure(procName) {
        const proc = this.context.createProcedure(procName, true);
        this.context.coreObjs.procedures.push(proc);
        return proc;
    }
    createFunction(name, returnType) {
        const func = this.context.createAppFunc(name, returnType);
        this.context.coreObjs.procedures.push(func);
        return func;
    }
    stringify(value) {
        const exp = this.context.convertExp(value);
        if (exp === undefined)
            return;
        let sb = this.context.createClientBuilder();
        exp.to(sb);
        const { sql } = sb;
        return sql;
    }
    buildGetShowBuds(showBuds, tempTable, tempField) {
        let statements = [];
        let { factory } = this.context;
        for (let i in showBuds) {
            let fieldShow = showBuds[i];
            let select = this.buildSelect(fieldShow, tempTable, tempField);
            let insert = factory.createInsert();
            statements.push(insert);
            insert.table = new statementWithFrom_1.VarTableWithSchema('props');
            insert.cols = [
                { col: 'id', val: undefined },
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
                { col: 'owner', val: undefined },
            ];
            insert.select = select;
        }
        return statements;
    }
    buildSelect(fieldShow, tempTable, tempfield) {
        const { owner, items } = fieldShow;
        const { factory } = this.context;
        const select = factory.createSelect();
        select.column(new sql_1.ExpField(tempfield, a), 'id');
        select.from(new statementWithFrom_1.VarTableWithSchema(tempTable, a));
        let lastT = 't0', lastField;
        let len = items.length - 1;
        let { bizEntity: lastEntity, bizBud: lastBud } = items[0];
        let { name: lastBudName } = lastBud;
        if (lastBudName === 'i' || lastBudName === 'x') {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, lastT))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', lastT), new sql_1.ExpField(tempfield, a)));
            lastField = lastBudName;
        }
        else {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField(tempfield, a)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false, lastT))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', lastT), new sql_1.ExpField('id', b)), new sql_1.ExpEQ(new sql_1.ExpField('x', lastT), new sql_1.ExpNum(lastBud.id))));
            lastField = 'value';
        }
        for (let i = 1; i < len; i++) {
            let { bizEntity, bizBud } = items[i];
            lastEntity = bizEntity;
            lastBud = bizBud;
            const t = 't' + i;
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false, t))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(bizBud.id))));
            lastT = t;
            lastField = 'value';
        }
        let t = 't' + len;
        let { bizEntity, bizBud } = items[len];
        let tblIxBud;
        switch (bizBud.dataType) {
            default:
                tblIxBud = il_1.EnumSysTable.ixBudInt;
                selectValue();
                break;
            case il_1.BudDataType.dec:
                tblIxBud = il_1.EnumSysTable.ixBudDec;
                selectValue();
                break;
            case il_1.BudDataType.str:
            case il_1.BudDataType.char:
                tblIxBud = il_1.EnumSysTable.ixBudStr;
                selectValue();
                break;
            case il_1.BudDataType.radio:
            case il_1.BudDataType.check:
                tblIxBud = il_1.EnumSysTable.ixBud;
                selectCheck();
                break;
        }
        function selectValue() {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxBud, false, t))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(bizBud.id))));
            select.column(new sql_1.ExpNum(bizBud.id), 'phrase');
            select.column(new sql_1.ExpFunc('JSON_ARRAY', new sql_1.ExpField('value', t)));
        }
        function selectCheck() {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxBud, false, t))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, c))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('x', t)));
            select.column(new sql_1.ExpField('base', c), 'phrase');
            select.column(new sql_1.ExpFunc('JSON_ARRAY', sql_1.ExpNum.num0, new sql_1.ExpField('ext', c)));
            select.where(new sql_1.ExpEQ(new sql_1.ExpField('base', c), new sql_1.ExpNum(bizBud.id)));
        }
        let expOwner;
        if (owner === undefined) {
            expOwner = sql_1.ExpNum.num0;
        }
        else {
            expOwner = new sql_1.ExpNum(owner.id);
        }
        select.column(expOwner, 'owner');
        return select;
    }
}
exports.BBizEntity = BBizEntity;
//# sourceMappingURL=BizEntity.js.map