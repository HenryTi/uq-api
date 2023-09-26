import { BigInt, BizDetail, BizSheet, JoinType, bigIntField, decField, idField } from "../../il";
import { ExpAnd, ExpAtVar, ExpEQ, ExpField, ExpGT, ExpIsNull, ExpNull, ExpNum, ExpVar, Procedure, Statement } from "../sql";
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

    private buildDetail(statements: Statement[], detail: BizDetail, loopNo: number) {
        const { name, id: entityId } = detail;
        const { factory, userParam } = this.context;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `detail ${name}`;

        const item = '$item';
        const itemX = '$itemX';
        const value = '$value';
        const amount = '$amount';
        const price = '$price';
        const detailId = '$detailId';
        const pDetailId = '$pDetailId';
        const a = 'a';
        const b = 'b';
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            bigIntField(detailId),
            bigIntField(item),
            bigIntField(itemX),
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
        select.column(new ExpField('item', a), item);
        select.column(new ExpField('itemX', a), itemX);
        select.column(new ExpField('value', a), value);
        select.column(new ExpField('amount', a), amount);
        select.column(new ExpField('price', a), price);

        select.from(new EntityTable('detail', false, a))
            .join(JoinType.join, new EntityTable('bud', false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)));
        select.where(new ExpAnd(
            new ExpGT(new ExpField('id', a), new ExpVar(pDetailId)),
            new ExpEQ(new ExpField('base', b), new ExpVar('$id')),
        ));
        select.order(new ExpField('id', a), 'asc');
        select.limit(ExpNum.num1);

        const iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new ExpIsNull(new ExpVar(detailId));
        const exit = factory.createBreak();
        iffExit.then(exit);
        exit.no = loopNo;

        const setPDetail = factory.createSet();
        loop.statements.add(setPDetail);
        setPDetail.equ(pDetailId, new ExpVar(detailId));

        const setDetailNull = factory.createSet();
        loop.statements.add(setDetailNull);
        setDetailNull.equ(detailId, new ExpNull());
    }
}
