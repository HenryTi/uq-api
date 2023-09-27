"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizSheet = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const dbContext_1 = require("../dbContext");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizSheet extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
    }
    buildSubmitProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { details } = this.bizEntity;
        const site = '$site';
        const cId = '$id';
        parameters.push((0, il_1.bigIntField)(site), userParam, (0, il_1.idField)(cId, 'big'));
        // main
        // details
        let len = details.length;
        for (let i = 0; i < len; i++) {
            let { detail } = details[i];
            this.buildDetail(statements, detail, i + 101);
        }
    }
    buildDetail(statements, detail, loopNo) {
        const { name, id: entityId, acts } = detail;
        const { factory, userParam } = this.context;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `detail ${name}`;
        const sheetId = 'sheetId';
        const target = 'target';
        const pendFrom = '$pendFrom';
        const detailId = 'detailId';
        const item = 'item';
        const itemX = 'itemX';
        const value = 'value';
        const amount = 'amount';
        const price = 'price';
        const pDetailId = '$pDetailId';
        const a = 'a';
        const b = 'b';
        const c = 'c';
        const d = 'd';
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)(sheetId), (0, il_1.bigIntField)(target), (0, il_1.bigIntField)(pendFrom), (0, il_1.bigIntField)(detailId), (0, il_1.bigIntField)(item), (0, il_1.bigIntField)(itemX), (0, il_1.decField)(value, 18, 6), (0, il_1.decField)(amount, 18, 6), (0, il_1.decField)(price, 18, 6), (0, il_1.bigIntField)(pDetailId));
        const setPDetailId0 = factory.createSet();
        statements.push(setPDetailId0);
        setPDetailId0.equ(pDetailId, sql_1.ExpNum.num0);
        const loop = factory.createWhile();
        loop.no = loopNo;
        statements.push(loop);
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
        const select = factory.createSelect();
        loop.statements.add(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id', a), detailId);
        select.column(new sql_1.ExpField('item', a), item);
        select.column(new sql_1.ExpField('itemX', a), itemX);
        select.column(new sql_1.ExpField('value', a), value);
        select.column(new sql_1.ExpField('amount', a), amount);
        select.column(new sql_1.ExpField('price', a), price);
        select.column(new sql_1.ExpField('id', c), sheetId);
        select.column(new sql_1.ExpField('target', c), target);
        select.column(new sql_1.ExpField('pendFrom', d), pendFrom);
        select.from(new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.bizDetail, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.bud, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('base', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.bizSheet, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('base', b)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.detailPend, false, d))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', d), new sql_1.ExpField('id', a)));
        select.where(new sql_1.ExpAnd(new sql_1.ExpGT(new sql_1.ExpField('id', a), new sql_1.ExpVar(pDetailId)), new sql_1.ExpEQ(new sql_1.ExpField('ext', b), new sql_1.ExpNum(entityId)), new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpVar('$id'))));
        select.order(new sql_1.ExpField('id', a), 'asc');
        select.limit(sql_1.ExpNum.num1);
        const iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(detailId));
        const exit = factory.createBreak();
        iffExit.then(exit);
        exit.no = loopNo;
        for (let act of acts) {
            let sqls = new bstatement_1.Sqls(this.context, loop.statements.statements);
            let { statements } = act.statement;
            sqls.head(statements);
            sqls.body(statements);
            sqls.foot(statements);
        }
        const setPDetail = factory.createSet();
        loop.statements.add(setPDetail);
        setPDetail.equ(pDetailId, new sql_1.ExpVar(detailId));
        const setDetailNull = factory.createSet();
        loop.statements.add(setDetailNull);
        setDetailNull.equ(detailId, sql_1.ExpVal.null);
    }
}
exports.BBizSheet = BBizSheet;
//# sourceMappingURL=BizSheet.js.map