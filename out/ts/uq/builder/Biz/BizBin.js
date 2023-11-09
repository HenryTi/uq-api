"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizBin = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
const sheetId = 'sheet';
const s = 's';
const si = 'si';
const sx = 'sx';
const svalue = 'svalue';
const samount = 'samount';
const sprice = 'sprice';
const pendFrom = 'pend';
const i = 'i';
const x = 'x';
const value = 'value';
const amount = 'amount';
const price = 'price';
const binId = 'bin';
const pBinId = '$pBin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const tempBinTable = 'bin';
class BBizBin extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
        const procGet = this.createProcedure(`${this.context.site}.${id}gb`);
        this.buildGetProc(procGet);
    }
    buildSubmitProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam, site } = this.context;
        const { act } = this.bizEntity;
        parameters.push(userParam, (0, il_1.bigIntField)('bin'));
        if (act === undefined) {
            return;
        }
        const declare = factory.createDeclare();
        statements.push(declare);
        const bigint = new il_1.BigInt();
        const decValue = new il_1.Dec(18, 6);
        declare.var(consts_1.$site, bigint);
        declare.var(s, bigint);
        declare.var(si, bigint);
        declare.var(sx, bigint);
        declare.var(svalue, decValue);
        declare.var(samount, decValue);
        declare.var(sprice, decValue);
        declare.var(pendFrom, bigint);
        declare.var(i, bigint);
        declare.var(x, bigint);
        declare.var(value, decValue);
        declare.var(amount, decValue);
        declare.var(price, decValue);
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(site));
        const a1 = 'a1';
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id', a), binId);
        select.column(new sql_1.ExpField('i', a), i);
        select.column(new sql_1.ExpField('x', a), x);
        select.column(new sql_1.ExpField('value', a), value);
        select.column(new sql_1.ExpField('amount', a), amount);
        select.column(new sql_1.ExpField('price', a), price);
        select.column(new sql_1.ExpField('id', c), s);
        select.column(new sql_1.ExpField('i', c), si);
        select.column(new sql_1.ExpField('x', c), sx);
        select.column(new sql_1.ExpField('value', c), svalue);
        select.column(new sql_1.ExpField('price', c), sprice);
        select.column(new sql_1.ExpField('amount', c), samount);
        select.column(new sql_1.ExpField('pendFrom', d), pendFrom);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizDetail, false, a1))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a1), new sql_1.ExpField('id', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('base', a1)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('base', b)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.binPend, false, d))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', d), new sql_1.ExpField('id', a)));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar('bin')));
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);
    }
    buildGetProc(proc) {
        let showBuds = this.bizEntity.allShowBuds();
        if (showBuds === undefined) {
            proc.dropOnly = true;
            return;
        }
        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(consts_1.$site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(site));
        if (showBuds !== undefined) {
            let memo = factory.createMemo();
            statements.push(memo);
            memo.text = this.bizEntity.name + ' show buds';
            statements.push(...this.buildGetShowBuds(showBuds));
        }
    }
    buildGetShowBuds(showBuds) {
        let statements = [];
        let { factory } = this.context;
        for (let i in showBuds) {
            let fieldShow = showBuds[i];
            let select = this.buildSelect(fieldShow);
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
    buildSelect(fieldShow) {
        const { owner, items } = fieldShow;
        const { factory } = this.context;
        const select = factory.createSelect();
        select.column(new sql_1.ExpField('id', a), 'id');
        select.from(new statementWithFrom_1.VarTableWithSchema(tempBinTable, a));
        let lastT = 't0', lastField;
        let len = items.length - 1;
        let { bizEntity: lastEntity, bizBud: lastBud } = items[0];
        let { name: lastBudName } = lastBud;
        if (lastBudName === 'i' || lastBudName === 'x') {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, lastT))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', lastT), new sql_1.ExpField('id', a)));
            lastField = lastBudName;
        }
        else {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('id', a)))
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
exports.BBizBin = BBizBin;
//# sourceMappingURL=BizBin.js.map