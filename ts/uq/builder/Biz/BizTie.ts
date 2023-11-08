import { BigInt, BizBud, BizEntity, BizTie, JoinType } from "../../il";
import { BBizEntity } from "./BizEntity";
import { bigIntField, jsonField, EnumSysTable } from "../../il";
import {
    ExpAnd, ExpEQ, ExpField, ExpFunc
    , ExpGT, ExpIn, ExpNum, ExpSelect, ExpVal
    , ExpVar, Procedure
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";

const a = 'a';
const b = 'b';
const c = 'c';

export class BBizTie extends BBizEntity<BizTie> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures
        const { id } = this.bizEntity;
        const procGet = this.createProcedure(`${this.context.site}.${id}t`);
        this.buildGetProc(procGet);
    }

    private buildGetProc(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { id, i, x } = this.bizEntity;

        const site = '$site';
        const params = '$params';
        parameters.push(
            userParam,
            bigIntField('pageStart'),
            bigIntField('pageSize'),
            jsonField(params),
        );

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new BigInt());

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new ExpNum(id));


        const insert = factory.createInsert();
        statements.push(insert);
        insert.table = new EntityTable('_$page', false);
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'no', val: undefined },
            { col: 'ex', val: undefined },
            { col: 'values', val: undefined },
        ];

        const selectPage = factory.createSelect();
        insert.select = selectPage;
        let expJsonValues = this.buildJsonValues();
        selectPage.column(new ExpField('id', a));
        selectPage.column(new ExpField('no', a));
        selectPage.column(new ExpField('ex', a));
        selectPage.column(expJsonValues, 'values');
        selectPage
            .from(new EntityTable(EnumSysTable.atom, false, a))
            .join(JoinType.left, new EntityTable(EnumSysTable.bud, false, b))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('base', b), new ExpNum(id)),
                new ExpEQ(new ExpField('ext', b), new ExpField('id', a))
            ));
        selectPage.where(new ExpAnd(
            new ExpGT(new ExpField('id', a), new ExpVar('pageStart')),
            new ExpIn(new ExpField('base', a), ...i.atoms.map(v => new ExpNum(v.id))),
        ));
        selectPage.order(new ExpField('id', a), 'asc');
        selectPage.limit(new ExpVar('pageSize'));
    }

    private buildJsonValues() {
        const selectValue = this.buildTitleValueSelect();
        let expValues: ExpVal = new ExpSelect(selectValue);
        return expValues;
    }

    private buildTitleValueSelect() {
        //.join(JoinType.join, new EntityTable(EnumSysTable.ixBud, false, c))
        //.on(new ExpAnd(
        //    new ExpEQ(new ExpField('i', c), new ExpField('id', b))
        // ));
        const { factory } = this.context;
        const t = 't0', ta = 'ta';
        let select = factory.createSelect();
        select.column(new ExpFunc(
            'JSON_ARRAYAGG', new ExpFunc(
                'JSON_ARRAY', new ExpField('id', ta), new ExpField('no', ta), new ExpField('ex', ta)
            )
        ), 'value');
        select.from(new EntityTable(EnumSysTable.ixBud, false, t))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, ta))
            .on(new ExpEQ(new ExpField('id', ta), new ExpField('x', t)));
        select.where(new ExpEQ(new ExpField('i', t), new ExpField('id', b)));
        return select;
    }
}
