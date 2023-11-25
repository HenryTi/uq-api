import {
    BigInt, BizReport, BudDataType, JoinType, ReportTitle
    , SetType, bigIntField, dateField, intField, jsonField
    , EnumSysTable
} from "../../il";
import {
    ExpAnd, ExpAtVar, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq
    , ExpGE, ExpGT, ExpIsNull, ExpLT, ExpNum, ExpSelect, ExpStr, ExpVal
    , ExpVar, Procedure, Statement
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizReport extends BBizEntity<BizReport> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procGet = this.createProcedure(`${this.context.site}.${id}`);
        this.buildGetProc(procGet);
    }

    private buildGetProc(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { titles, from, joins } = this.bizEntity;

        const site = '$site';
        const params = '$params';
        const phrase = 'phrase';
        const atomId = 'atomId';
        parameters.push(
            bigIntField(site),
            userParam,
            bigIntField('pageStart'),
            bigIntField('pageSize'),
            bigIntField(phrase),
            bigIntField(atomId),
            dateField('dateStart'),
            dateField('dateEnd'),
            jsonField(params),
        );

        const declare = factory.createDeclare();
        statements.push(declare);
        const s0 = 's0';
        const s1 = 's1';
        const timeZone = 'timeZone';
        const a = 'a', b = 'b', h = 'h', hb = 'hb';

        declare.vars(
            bigIntField(s0), bigIntField(s1), intField(timeZone),
        );

        const varS0 = new ExpVar(s0);
        const varS1 = new ExpVar(s1);
        const varTimeZone = new ExpVar(timeZone);
        const varSite = new ExpVar(site);
        const varPhrase = new ExpVar(phrase);

        const setTimeZone = factory.createSet();
        statements.push(setTimeZone);
        const selectTimeZone = factory.createSelect();
        selectTimeZone.col('timezone');
        selectTimeZone.from(new EntityTable('$site', false));
        selectTimeZone.where(new ExpEQ(new ExpField('id'), varSite));
        setTimeZone.equ(timeZone, new ExpSelect(selectTimeZone));

        const setS0 = factory.createSet();
        statements.push(setS0);
        setS0.equ(s0, new ExpFuncInUq('$uminute_from_time', [
            new ExpVar('dateStart'), varTimeZone
        ], true));

        const setS1 = factory.createSet();
        statements.push(setS1);
        setS1.equ(s1, new ExpFuncInUq('$uminute_from_time', [
            new ExpVar('dateEnd'), varTimeZone
        ], true));

        const insert = factory.createInsert();
        statements.push(insert);
        insert.table = new EntityTable('_$page', false);
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'no', val: undefined },
            { col: 'ex', val: undefined },
            { col: 'value', val: undefined },
            { col: 'phrase', val: undefined },
        ];

        const selectPage = factory.createSelect();
        insert.select = selectPage;
        let expJsonValues = this.buildSumJsonValues(titles, varS0, varS1);
        selectPage.column(new ExpField('id', a));
        selectPage.column(new ExpField('no', a));
        selectPage.column(new ExpField('ex', a));
        selectPage.column(expJsonValues, 'value');
        selectPage.column(new ExpField('base', a), 'phrase');
        selectPage
            .from(new EntityTable(EnumSysTable.atom, false, a))
        selectPage.where(new ExpAnd(
            new ExpEQ(new ExpField('base', a), varPhrase),
            new ExpGT(new ExpField('id', a), new ExpVar('pageStart'))
        ));
        selectPage.order(new ExpField('id', a), 'asc');
        selectPage.limit(new ExpVar('pageSize'));

        let ret = this.buildSelectSpecs(titles, varS0, varS1);
        statements.push(...ret);
    }

    private buildSumJsonValues(titles: ReportTitle[], varS0: ExpVal, varS1: ExpVal) {
        const { factory } = this.context;
        let expValues: ExpVal[] = titles.map(title => {
            const selectValue = this.buildTitleValueSelect(title, varS0, varS1);
            return new ExpFunc(
                factory.func_ifnull,
                new ExpSelect(selectValue),
                ExpNum.num0,
            );
        });
        const expJsonValues = new ExpFunc('JSON_ARRAY', ...expValues);
        return expJsonValues;
    }

    private buildTitleValueSelect(reportTitle: ReportTitle, varS0: ExpVal, varS1: ExpVal) {
        const { factory } = this.context;
        const a = 'a', hb = 'hb', h = 'h';
        const select = factory.createSelect();
        const { bud } = reportTitle;
        const { hasHistory, dataType, setType } = bud;
        if (hasHistory !== true || setType === SetType.assign || setType === SetType.balance) {
            select.column(new ExpField('value', h));
            let tbl: EnumSysTable;
            switch (dataType) {
                default: tbl = EnumSysTable.ixBudInt; break;
                case BudDataType.dec: tbl = EnumSysTable.ixBudDec; break;
            }
            select.from(new EntityTable(tbl, false, h));
            select.where(new ExpAnd(
                new ExpEQ(new ExpField('i', h), new ExpField('id', a)),
                new ExpEQ(new ExpField('x', h), new ExpNum(bud.id)),
            ));
        }
        else {
            select.from(new EntityTable(EnumSysTable.history, false, h))
                .join(JoinType.inner, new EntityTable(EnumSysTable.bud, false, hb))
                .on(new ExpEQ(new ExpField('id', hb), new ExpField('bud', h)));
            const wheres: ExpCmp[] = [
                new ExpLT(new ExpField('id', h), varS1),
                new ExpEQ(new ExpField('base', hb), new ExpField('id', a)),
                new ExpEQ(new ExpField('ext', hb), new ExpNum(bud.id)),
            ];
            select.column(new ExpFunc(factory.func_sum, new ExpField('value', h)));
            wheres.push(new ExpGE(new ExpField('id', h), varS0));
            select.where(new ExpAnd(...wheres));
        }
        return select;
    }

    private buildSelectSpecs(titles: ReportTitle[], varS0: ExpVal, varS1: ExpVal) {
        const { factory } = this.context;
        let ret: Statement[] = [];

        const a = 'a', b = 'b', d = 'd', hb = 'hb', h = 'h';
        let insert = factory.createInsert();
        ret.push(insert);
        insert.table = new EntityTable('_specs', false);
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'base', val: undefined },
            { col: 'value', val: undefined },
        ];
        let selectPhrase = factory.createSelect();
        selectPhrase.column(new ExpField('ext', 'x'));
        selectPhrase.from(new EntityTable(EnumSysTable.bud, false, 'x'));
        selectPhrase.where(new ExpEQ(new ExpField('id', 'x'), new ExpField('id', 'b')));
        let expJsonValues = this.buildSumJsonValues(titles, varS0, varS1);
        let select = factory.createSelect();
        insert.select = select;
        select.column(new ExpField('id', a));
        select.column(new ExpSelect(selectPhrase));
        select.column(new ExpField('base', b));
        select.column(expJsonValues);
        select.from(new EntityTable(EnumSysTable.spec, false, a))
            .join(JoinType.inner, new EntityTable(EnumSysTable.bud, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)))
            .join(JoinType.inner, new EntityTable('_$page', false, d))
            .on(new ExpEQ(new ExpField('id', d), new ExpField('base', b)))
            .join(JoinType.inner, new EntityTable(EnumSysTable.bud, false, hb))
            .on(new ExpEQ(new ExpField('base', hb), new ExpField('id', a)))
            .join(JoinType.inner, new EntityTable(EnumSysTable.history, false, h))
            .on(new ExpEQ(new ExpField('bud', h), new ExpField('id', hb)))
            ;
        select.where(new ExpAnd(
            new ExpGE(new ExpField('id', h), varS0),
            new ExpLT(new ExpField('id', h), varS1),
            new ExpEQ(new ExpField('base', hb), new ExpField('id', a)),
        ));
        select.having(new ExpGT(new ExpFunc(factory.func_count, new ExpField('id', h)), ExpNum.num0));
        select.order(new ExpField('id', a), 'asc');
        select.group(new ExpField('base', b));
        select.group(new ExpField('id', a));

        let declare = factory.createDeclare();
        ret.push(declare);
        declare.var('p', new BigInt());
        declare.var('specPhrase', new BigInt());
        let setP0 = factory.createSet();
        ret.push(setP0);
        setP0.equ('p', ExpNum.num0);

        let loop = factory.createWhile();
        ret.push(loop);
        loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
        loop.no = 99;

        let selectP = factory.createSelect();
        selectP.column(new ExpField('id'));
        selectP.from(new EntityTable('_specs', false));
        selectP.where(new ExpGT(new ExpField('id'), new ExpVar('p')));
        selectP.order(new ExpField('id'), 'asc');
        selectP.limit(ExpNum.num1);
        let setP = factory.createSet();
        loop.statements.add(setP);
        setP.equ('p', new ExpSelect(selectP));

        let ifPNull = factory.createIf();
        loop.statements.add(ifPNull);
        ifPNull.cmp = new ExpIsNull(new ExpVar('p'));
        let leave = factory.createBreak();
        ifPNull.then(leave);
        leave.no = loop.no;

        let selectPhraseId = factory.createSelect();
        loop.statements.add(selectPhraseId);
        selectPhraseId.toVar = true;
        selectPhraseId.column(new ExpField('phrase'), 'specPhrase');
        selectPhraseId.from(new EntityTable('_specs', false));
        selectPhraseId.where(new ExpEQ(new ExpField('id'), new ExpVar('p')));

        let execSql = factory.createExecSql();
        execSql.no = loop.no;
        loop.statements.add(execSql);
        execSql.sql = new ExpFunc(
            factory.func_concat,
            new ExpStr('SET @props:=$site.`'),
            new ExpNum(this.context.site),
            new ExpStr('.'),
            new ExpVar('specPhrase'),
            new ExpStr('`('),
            new ExpVar('$site'),
            new ExpStr(','),
            new ExpVar('$user'),
            new ExpStr(','),
            new ExpVar('p'),
            new ExpStr(');'),
        );

        let update = factory.createUpdate();
        loop.statements.add(update);
        update.cols = [
            { col: 'props', val: new ExpAtVar('props') }
        ];
        update.table = new EntityTable('_specs', false);
        update.where = new ExpEQ(new ExpField('id'), new ExpVar('p'));
        return ret;
    }
}
