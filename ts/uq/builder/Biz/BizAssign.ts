import { BigInt, BizAssign, BizBud, BizEntity } from "../../il";
import { BBizEntity } from "./BizEntity";
import { bigIntField, jsonField, EnumSysTable } from "../../il";
import {
    ExpAnd, ExpEQ, ExpField, ExpFunc
    , ExpGT, ExpIn, ExpNum, ExpSelect, ExpVal
    , ExpVar, Procedure
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";

const a = 'a';

export class BBizAssign extends BBizEntity<BizAssign> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures
        const { id } = this.bizEntity;
        const procGet = this.createSiteEntityProcedure('a');
        this.buildGetProc(procGet);
    }

    private buildGetProc(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { id, atom, title } = this.bizEntity;

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
        let expJsonValues = this.buildJsonValues(title);
        selectPage.column(new ExpField('id', a));
        selectPage.column(new ExpField('no', a));
        selectPage.column(new ExpField('ex', a));
        selectPage.column(expJsonValues, 'values');
        selectPage
            .from(new EntityTable(EnumSysTable.atom, false, a))
        selectPage.where(new ExpAnd(
            new ExpGT(new ExpField('id', a), new ExpVar('pageStart')),
            new ExpIn(new ExpField('base', a), ...atom.map(v => new ExpNum(v.id))),
        ));
        selectPage.order(new ExpField('id', a), 'asc');
        selectPage.limit(new ExpVar('pageSize'));
    }

    private buildJsonValues(title: [BizEntity, BizBud][]) {
        const { factory } = this.context;
        let expValues: ExpVal[] = title.map(([entity, bud]) => {
            const selectValue = this.buildTitleValueSelect(entity, bud);
            return new ExpFunc(
                factory.func_ifnull,
                new ExpSelect(selectValue),
                ExpNum.num0,
            );
        });
        const expJsonValues = new ExpFunc('JSON_ARRAY', ...expValues);
        return expJsonValues;
    }

    private buildTitleValueSelect(entity: BizEntity, bud: BizBud) {
        const { factory } = this.context;
        const t = 't0';
        let select = factory.createSelect();
        select.col('value', undefined, t);
        select.from(new EntityTable(EnumSysTable.ixBudDec, false, t));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('i', t), new ExpField('id', a)),
            new ExpEQ(new ExpField('x', t), new ExpNum(bud.id)),
        ));
        return select;
    }
}
