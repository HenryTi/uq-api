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
        declare.var(sheetId, bigint);
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
        select.column(new sql_1.ExpField('id', c), sheetId);
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
            statements.push(...this.buildGetShowBuds(showBuds, tempBinTable, 'id'));
        }
    }
}
exports.BBizBin = BBizBin;
//# sourceMappingURL=BizBin.js.map