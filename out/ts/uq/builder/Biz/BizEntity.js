"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizEntity = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a';
const b = 'b';
const c = 'c';
class BBizEntity {
    constructor(context, bizEntity) {
        this.expStringify = (value) => {
            const exp = this.context.convertExp(value);
            if (exp === undefined)
                return;
            let sb = this.context.createClientBuilder();
            exp.to(sb);
            const { sql } = sb;
            return sql;
        };
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
    async buildDirectSqls() { }
    async buildBudsValue() {
        this.bizEntity.forEachBud((bud) => {
            if (!bud)
                return;
            bud.buildBudValue(this.expStringify);
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
        for (let fieldShow of showBuds) {
            let memo = factory.createMemo();
            statements.push(memo);
            memo.text = fieldShow.map(v => { var _a, _b; return (_b = (_a = v.ui) === null || _a === void 0 ? void 0 : _a.caption) !== null && _b !== void 0 ? _b : v.name; }).join('.');
            let select = this.buildSelect(fieldShow, tempTable, tempField);
            let insert = factory.createInsert();
            statements.push(insert);
            insert.ignore = true;
            insert.table = new statementWithFrom_1.VarTableWithSchema('props');
            insert.cols = [
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
                { col: 'id', val: undefined },
            ];
            insert.select = select;
        }
        return statements;
    }
    buildSelect(fieldShow, tempTable, tempfield) {
        const { factory } = this.context;
        const select = factory.createSelect();
        select.from(new statementWithFrom_1.VarTableWithSchema(tempTable, a));
        let lastT = 't0', lastField;
        let len = fieldShow.length - 1;
        let lastBud = fieldShow[0];
        let { name: lastBudName } = lastBud;
        if (lastBudName === 'i' || lastBudName === 'x') {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, lastT))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', lastT), new sql_1.ExpField(tempfield, a)));
            lastField = lastBudName;
        }
        else if (lastBudName[0] === '.') {
            let budName = lastBudName[1];
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField(tempfield, a)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, c))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField(budName, b)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, lastT))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', lastT), new sql_1.ExpField('base', c)));
            lastField = 'base';
        }
        else {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField(tempfield, a)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false, lastT))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', lastT), new sql_1.ExpField('id', b)), new sql_1.ExpEQ(new sql_1.ExpField('x', lastT), new sql_1.ExpNum(lastBud.id))));
            lastField = 'value';
        }
        let t;
        for (let i = 1; i < len; i++) {
            let bizBud = fieldShow[i];
            lastBud = bizBud;
            t = 't' + i;
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false, t))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(bizBud.id))));
            lastT = t;
            lastField = 'value';
        }
        t = 't' + len;
        let bizBud = fieldShow[len];
        let tblIxBud;
        let expFieldValue = new sql_1.ExpField('value', t);
        let colValue = new sql_1.ExpFuncCustom(factory.func_cast, expFieldValue, new sql_1.ExpDatePart('JSON'));
        switch (bizBud.dataType) {
            default:
            case il_1.BudDataType.radio:
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
                colValue = new sql_1.ExpFunc('JSON_QUOTE', expFieldValue);
                selectValue();
                break;
            // case BudDataType.radio:
            case il_1.BudDataType.check:
                tblIxBud = il_1.EnumSysTable.ixBud;
                selectCheck();
                break;
        }
        function selectValue() {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxBud, false, t))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(bizBud.id))));
            select.column(new sql_1.ExpNum(bizBud.id), 'phrase');
            //select.column(new ExpFunc('JSON_ARRAY', new ExpField('value', t)));
            select.column(colValue);
        }
        function selectCheck() {
            const k = 'k';
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxBud, false, t))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, k))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', k), new sql_1.ExpField('x', t)));
            select.column(new sql_1.ExpField('base', k), 'phrase');
            select.column(new sql_1.ExpFunc('JSON_ARRAY', sql_1.ExpNum.num0, new sql_1.ExpField('ext', k)));
            select.where(new sql_1.ExpEQ(new sql_1.ExpField('base', k), new sql_1.ExpNum(bizBud.id)));
        }
        select.column(new sql_1.ExpField('i', t), 'id');
        return select;
    }
}
exports.BBizEntity = BBizEntity;
//# sourceMappingURL=BizEntity.js.map