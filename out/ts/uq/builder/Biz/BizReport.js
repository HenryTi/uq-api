"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizReport = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizReport extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procGet = this.createProcedure(`${this.context.site}.${id}`);
        this.buildGetProc(procGet);
    }
    buildGetProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { titles, from, joins } = this.bizEntity;
        const site = '$site';
        const params = '$params';
        const phrase = 'phrase';
        const atomId = 'atomId';
        parameters.push((0, il_1.bigIntField)(site), userParam, (0, il_1.bigIntField)('pageStart'), (0, il_1.bigIntField)('pageSize'), (0, il_1.bigIntField)(phrase), (0, il_1.bigIntField)(atomId), (0, il_1.dateField)('dateStart'), (0, il_1.dateField)('dateEnd'), (0, il_1.jsonField)(params));
        const declare = factory.createDeclare();
        statements.push(declare);
        const s0 = 's0';
        const s1 = 's1';
        const timeZone = 'timeZone';
        const a = 'a', b = 'b', h = 'h', hb = 'hb';
        declare.vars((0, il_1.bigIntField)(s0), (0, il_1.bigIntField)(s1), (0, il_1.intField)(timeZone));
        const varS0 = new sql_1.ExpVar(s0);
        const varS1 = new sql_1.ExpVar(s1);
        const varTimeZone = new sql_1.ExpVar(timeZone);
        const varSite = new sql_1.ExpVar(site);
        const varPhrase = new sql_1.ExpVar(phrase);
        const setTimeZone = factory.createSet();
        statements.push(setTimeZone);
        const selectTimeZone = factory.createSelect();
        selectTimeZone.col('timezone');
        selectTimeZone.from(new statementWithFrom_1.EntityTable('$site', false));
        selectTimeZone.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), varSite));
        setTimeZone.equ(timeZone, new sql_1.ExpSelect(selectTimeZone));
        const setS0 = factory.createSet();
        statements.push(setS0);
        setS0.equ(s0, new sql_1.ExpFuncInUq('$uminute_from_time', [
            new sql_1.ExpVar('dateStart'), varTimeZone
        ], true));
        const setS1 = factory.createSet();
        statements.push(setS1);
        setS1.equ(s1, new sql_1.ExpFuncInUq('$uminute_from_time', [
            new sql_1.ExpVar('dateEnd'), varTimeZone
        ], true));
        // setS1.equ(s1, new ExpAdd(varS0, new ExpNum(24 * 3600 * 1024 * 1024)));
        const insert = factory.createInsert();
        statements.push(insert);
        insert.table = new statementWithFrom_1.EntityTable('_$page', false);
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
        selectPage.column(new sql_1.ExpField('id', a));
        selectPage.column(new sql_1.ExpField('no', a));
        selectPage.column(new sql_1.ExpField('ex', a));
        selectPage.column(expJsonValues, 'value');
        selectPage.column(new sql_1.ExpField('base', a), 'phrase');
        selectPage
            .from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, a));
        selectPage.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('base', a), varPhrase), new sql_1.ExpGT(new sql_1.ExpField('id', a), new sql_1.ExpVar('pageStart'))));
        selectPage.order(new sql_1.ExpField('id', a), 'asc');
        selectPage.limit(new sql_1.ExpVar('pageSize'));
        let ret = this.buildSelectSpecs(titles, varS0, varS1);
        statements.push(...ret);
    }
    buildSumJsonValues(titles, varS0, varS1) {
        const { factory } = this.context;
        let expValues = titles.map(title => {
            const selectValue = this.buildTitleValueSelect(title, varS0, varS1);
            return new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpSelect(selectValue), sql_1.ExpNum.num0);
        });
        const expJsonValues = new sql_1.ExpFunc('JSON_ARRAY', ...expValues);
        return expJsonValues;
    }
    buildTitleValueSelect(reportTitle, varS0, varS1) {
        const { factory } = this.context;
        const a = 'a', hb = 'hb', h = 'h';
        const select = factory.createSelect();
        const { bud } = reportTitle;
        const { hasHistory, dataType, setType } = bud;
        if (hasHistory !== true || setType === il_1.SetType.assign || setType === il_1.SetType.balance) {
            select.column(new sql_1.ExpField('value', h));
            let tbl;
            switch (dataType) {
                default:
                    tbl = il_1.EnumSysTable.ixBudInt;
                    break;
                case il_1.BudDataType.dec:
                    tbl = il_1.EnumSysTable.ixBudDec;
                    break;
            }
            select.from(new statementWithFrom_1.EntityTable(tbl, false, h));
            select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', h), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', h), new sql_1.ExpNum(bud.id))));
        }
        else {
            select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.history, false, h))
                .join(il_1.JoinType.inner, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, hb))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', hb), new sql_1.ExpField('bud', h)));
            const wheres = [
                new sql_1.ExpLT(new sql_1.ExpField('id', h), varS1),
                new sql_1.ExpEQ(new sql_1.ExpField('base', hb), new sql_1.ExpField('id', a)),
                new sql_1.ExpEQ(new sql_1.ExpField('ext', hb), new sql_1.ExpNum(bud.id)),
            ];
            select.column(new sql_1.ExpFunc(factory.func_sum, new sql_1.ExpField('value', h)));
            wheres.push(new sql_1.ExpGE(new sql_1.ExpField('id', h), varS0));
            select.where(new sql_1.ExpAnd(...wheres));
        }
        return select;
    }
    buildSelectSpecs(titles, varS0, varS1) {
        const { factory } = this.context;
        let ret = [];
        const a = 'a', b = 'b', d = 'd', hb = 'hb', h = 'h';
        let insert = factory.createInsert();
        ret.push(insert);
        insert.table = new statementWithFrom_1.EntityTable('_specs', false);
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'base', val: undefined },
            { col: 'value', val: undefined },
        ];
        let selectPhrase = factory.createSelect();
        selectPhrase.column(new sql_1.ExpField('ext', 'x'));
        selectPhrase.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, 'x'));
        selectPhrase.where(new sql_1.ExpEQ(new sql_1.ExpField('id', 'x'), new sql_1.ExpField('id', 'b')));
        let expJsonValues = this.buildSumJsonValues(titles, varS0, varS1);
        let select = factory.createSelect();
        insert.select = select;
        select.column(new sql_1.ExpField('id', a));
        select.column(new sql_1.ExpSelect(selectPhrase));
        select.column(new sql_1.ExpField('base', b));
        select.column(expJsonValues);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, a))
            .join(il_1.JoinType.inner, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('base', a)))
            .join(il_1.JoinType.inner, new statementWithFrom_1.EntityTable('_$page', false, d))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', d), new sql_1.ExpField('base', b)))
            .join(il_1.JoinType.inner, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, hb))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('base', hb), new sql_1.ExpField('id', a)))
            .join(il_1.JoinType.inner, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.history, false, h))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('bud', h), new sql_1.ExpField('id', hb)));
        select.where(new sql_1.ExpAnd(new sql_1.ExpGE(new sql_1.ExpField('id', h), varS0), new sql_1.ExpLT(new sql_1.ExpField('id', h), varS1), new sql_1.ExpEQ(new sql_1.ExpField('base', hb), new sql_1.ExpField('id', a))));
        select.having(new sql_1.ExpGT(new sql_1.ExpFunc(factory.func_count, new sql_1.ExpField('id', h)), sql_1.ExpNum.num0));
        select.order(new sql_1.ExpField('id', a), 'asc');
        select.group(new sql_1.ExpField('base', b));
        select.group(new sql_1.ExpField('id', a));
        let declare = factory.createDeclare();
        ret.push(declare);
        declare.var('p', new il_1.BigInt());
        declare.var('specPhrase', new il_1.BigInt());
        let setP0 = factory.createSet();
        ret.push(setP0);
        setP0.equ('p', sql_1.ExpNum.num0);
        let loop = factory.createWhile();
        ret.push(loop);
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
        loop.no = 99;
        let selectP = factory.createSelect();
        selectP.column(new sql_1.ExpField('id'));
        selectP.from(new statementWithFrom_1.EntityTable('_specs', false));
        selectP.where(new sql_1.ExpGT(new sql_1.ExpField('id'), new sql_1.ExpVar('p')));
        selectP.order(new sql_1.ExpField('id'), 'asc');
        selectP.limit(sql_1.ExpNum.num1);
        let setP = factory.createSet();
        loop.statements.add(setP);
        setP.equ('p', new sql_1.ExpSelect(selectP));
        let ifPNull = factory.createIf();
        loop.statements.add(ifPNull);
        ifPNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('p'));
        let leave = factory.createBreak();
        ifPNull.then(leave);
        leave.no = loop.no;
        let selectPhraseId = factory.createSelect();
        loop.statements.add(selectPhraseId);
        selectPhraseId.toVar = true;
        selectPhraseId.column(new sql_1.ExpField('phrase'), 'specPhrase');
        selectPhraseId.from(new statementWithFrom_1.EntityTable('_specs', false));
        selectPhraseId.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('p')));
        let execSql = factory.createExecSql();
        loop.statements.add(execSql);
        execSql.sql = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('SET @props:=$site.`'), new sql_1.ExpNum(this.context.site), new sql_1.ExpStr('.'), new sql_1.ExpVar('specPhrase'), new sql_1.ExpStr('`('), new sql_1.ExpVar('$site'), new sql_1.ExpStr(','), new sql_1.ExpVar('$user'), new sql_1.ExpStr(','), new sql_1.ExpVar('p'), new sql_1.ExpStr(');'));
        let update = factory.createUpdate();
        loop.statements.add(update);
        update.cols = [
            { col: 'props', val: new sql_1.ExpAtVar('props') }
        ];
        update.table = new statementWithFrom_1.EntityTable('_specs', false);
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('p'));
        return ret;
    }
}
exports.BBizReport = BBizReport;
//# sourceMappingURL=BizReport.js.map