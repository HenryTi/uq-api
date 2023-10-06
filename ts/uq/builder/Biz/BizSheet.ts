import { BigInt, BizBin, BizSheet, JoinType, bigIntField, decField, idField } from "../../il";
import { Sqls } from "../bstatement";
import { EnumSysTable, sysTable } from "../dbContext";
import { ExpAnd, ExpAtVar, ExpEQ, ExpField, ExpGT, ExpIsNull, ExpNull, ExpNum, ExpVal, ExpVar, Procedure, Statement } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizSheet extends BBizEntity<BizSheet> {
    override async buildProcedures(): Promise<void> {
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
    }

    private buildSubmitProc(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { details } = this.bizEntity;

        const site = '$site';
        const cId = '$id';

        parameters.push(
            bigIntField(site),
            userParam,
            idField(cId, 'big'),
        );

        // main

        // details
        let len = details.length;
        for (let i = 0; i < len; i++) {
            let { detail } = details[i];
            this.buildDetail(statements, detail, i + 101);
        }
    }

    private buildDetail(statements: Statement[], detail: BizBin, loopNo: number) {
        const { name, id: entityId, act } = detail;
        const { factory, userParam } = this.context;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `detail ${name}`;

        const sheetId = 'sheet';
        const pendFrom = 'pend';
        const detailId = 'detail';
        const si = 'si';
        const sx = 'sx';
        const svalue = 'svalue';
        const samount = 'samount';
        const sprice = 'sprice';
        const i = 'i';
        const x = 'x';
        const value = 'value';
        const amount = 'amount';
        const price = 'price';
        const pDetailId = '$pDetail';
        const a = 'a';
        const b = 'b';
        const c = 'c';
        const d = 'd';
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            bigIntField(sheetId),
            bigIntField(si),
            bigIntField(sx),
            decField(svalue, 18, 6),
            decField(samount, 18, 6),
            decField(sprice, 18, 6),
            bigIntField(pendFrom),
            bigIntField(detailId),
            bigIntField(i),
            bigIntField(x),
            decField(value, 18, 6),
            decField(amount, 18, 6),
            decField(price, 18, 6),
            bigIntField(pDetailId),
        );

        const setPDetailId0 = factory.createSet();
        statements.push(setPDetailId0);
        setPDetailId0.equ(pDetailId, ExpNum.num0);
        const loop = factory.createWhile();
        loop.no = loopNo;
        statements.push(loop);
        loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);

        const select = factory.createSelect();
        loop.statements.add(select);
        select.toVar = true;
        select.column(new ExpField('id', a), detailId);
        select.column(new ExpField('i', a), i);
        select.column(new ExpField('x', a), x);
        select.column(new ExpField('value', a), value);
        select.column(new ExpField('amount', a), amount);
        select.column(new ExpField('price', a), price);
        select.column(new ExpField('id', c), sheetId);
        select.column(new ExpField('i', c), si);
        select.column(new ExpField('x', c), sx);
        select.column(new ExpField('value', c), svalue);
        select.column(new ExpField('price', c), sprice);
        select.column(new ExpField('amount', c), samount);
        select.column(new ExpField('pendFrom', d), pendFrom);

        select.from(new EntityTable(EnumSysTable.bizBin, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('base', b)))
            .join(JoinType.left, new EntityTable(EnumSysTable.binPend, false, d))
            .on(new ExpEQ(new ExpField('id', d), new ExpField('id', a)))
            ;
        select.where(new ExpAnd(
            new ExpGT(new ExpField('id', a), new ExpVar(pDetailId)),
            new ExpEQ(new ExpField('ext', b), new ExpNum(entityId)),
            new ExpEQ(new ExpField('id', c), new ExpVar('$id')),
        ));
        select.order(new ExpField('id', a), 'asc');
        select.limit(ExpNum.num1);

        const iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new ExpIsNull(new ExpVar(detailId));
        const exit = factory.createBreak();
        iffExit.then(exit);
        exit.no = loopNo;

        const del = factory.createDelete();
        loop.statements.add(del);
        del.tables = [a];
        del.from(new EntityTable(EnumSysTable.binPend, false, a));
        del.where(new ExpEQ(new ExpField('id', a), new ExpVar(detailId)));

        if (act !== undefined) {
            let sqls = new Sqls(this.context, loop.statements.statements);
            let { statements } = act.statement;
            sqls.head(statements);
            sqls.body(statements);
            sqls.foot(statements);
        }

        const setPDetail = factory.createSet();
        loop.statements.add(setPDetail);
        setPDetail.equ(pDetailId, new ExpVar(detailId));

        const setDetailNull = factory.createSet();
        loop.statements.add(setDetailNull);
        setDetailNull.equ(detailId, ExpVal.null);
    }
}
