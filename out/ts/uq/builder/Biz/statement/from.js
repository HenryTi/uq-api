"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatement = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const biz_select_1 = require("./biz.select");
const a = 'a', b = 'b', c = 'c';
// const t1 = 't1';
const pageStart = '$pageStart';
class BFromStatement extends biz_select_1.BBizSelect {
    body(sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';
        let varStart = new sql_1.ExpVar(pageStart);
        const ifStateNull = factory.createIf();
        sqls.push(ifStateNull);
        ifStateNull.cmp = new sql_1.ExpIsNull(varStart);
        const setPageState = factory.createSet();
        ifStateNull.then(setPageState);
        let expFieldPageId = this.buildExpFieldPageId();
        let expStart, cmpPage;
        if (this.asc === il_1.EnumAsc.asc) {
            expStart = new sql_1.ExpNum(0);
            cmpPage = new sql_1.ExpGT(expFieldPageId, varStart);
        }
        else {
            expStart = new sql_1.ExpStr('9223372036854775807');
            cmpPage = new sql_1.ExpLT(expFieldPageId, varStart);
        }
        setPageState.equ(pageStart, expStart);
        let stat = this.buildFromMain(cmpPage);
        sqls.push(...stat);
        this.buildFromEntity(sqls);
        this.buildInsertColumnsProps(sqls);
    }
    buildInsertColumnsProps(sqls) {
        const { cols } = this.istatement;
        for (let col of cols) {
            if (col.valBud === undefined)
                continue;
            this.buildColumnProps(sqls, col);
        }
    }
    buildColumnProps(sqls, col) {
        const { factory } = this.context;
        /*
        const insert = factory.createInsert();
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'base', val: undefined },
            { col: 'no', val: undefined },
        ];
        */
    }
    foot(sqls) {
        let memo = this.context.factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM foot';
    }
    buildExpFieldPageId() {
        const { fromEntity } = this.istatement;
        let { alias: t1 } = fromEntity;
        return new sql_1.ExpField('id', t1);
    }
    buildSelectBan(select) {
        const { ban } = this.istatement;
        const cBan = 'ban';
        if (ban === undefined) {
            select.column(sql_1.ExpNum.num0, cBan);
        }
        else {
            select.column(this.context.expCmp(ban.val), cBan);
        }
    }
    buildSelectValue(select) {
        this.buildSelectValueBase(select, false);
    }
    buildSelectVallueSum(select) {
        this.buildSelectValueBase(select, true);
    }
    buildSelectValueBase(select, sum) {
        const { factory } = this.context;
        const { value } = this.istatement;
        const cValue = 'value';
        if (value === undefined) {
            select.column(sql_1.ExpNull.null, cValue);
        }
        else {
            let exp = this.context.expVal(value.val);
            if (sum === true)
                exp = new sql_1.ExpFunc(factory.func_sum, exp);
            select.column(exp, cValue);
        }
    }
    buildSelectCols() {
        const { cols } = this.istatement;
        const arr = cols.map(col => {
            const { name, val, bud } = col;
            let expBud;
            if (bud !== undefined)
                expBud = new sql_1.ExpNum(bud.id);
            else
                expBud = new sql_1.ExpStr(name);
            return new sql_1.ExpFunc('JSON_ARRAY', expBud, this.context.expVal(val));
        });
        return arr;
    }
    buildSelect(cmpPage) {
        const { factory } = this.context;
        const { where, fromEntity } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        const select = factory.createSelect();
        select.from(new statementWithFrom_1.EntityTable(bizEntityTable, false, t0));
        this.buildSelectJoin(select, fromEntity);
        let wheres = [
            cmpPage,
            this.context.expCmp(where),
        ];
        select.where(new sql_1.ExpAnd(...wheres));
        select.order(new sql_1.ExpField('id', t0), this.asc === il_1.EnumAsc.asc ? 'asc' : 'desc');
        select.limit(new sql_1.ExpVar('$pageSize'));
        return select;
    }
    buildInsertAtom() {
        const { factory } = this.context;
        let insertAtom = factory.createInsert();
        insertAtom.ignore = true;
        insertAtom.table = new statementWithFrom_1.VarTable('atoms');
        insertAtom.cols = [
            { col: 'id', val: undefined },
            { col: 'base', val: undefined },
            { col: 'no', val: undefined },
            { col: 'ex', val: undefined },
        ];
        let select = factory.createSelect();
        insertAtom.select = select;
        select.distinct = true;
        select.column(new sql_1.ExpField('id', b));
        select.column(new sql_1.ExpField('base', c));
        select.column(new sql_1.ExpField('no', b));
        select.column(new sql_1.ExpField('ex', b));
        return insertAtom;
    }
    buildInsertAtomBuds(sqls, atom) {
        let titlePrimeBuds = atom.getTitlePrimeBuds();
        let mapBuds = this.buildMapBuds(titlePrimeBuds);
        sqls.push(...this.buildInsertBuds('atoms', mapBuds));
    }
    ixValueArr() {
        const { factory } = this.context;
        const valField = new sql_1.ExpField('value', 'b');
        const valNumExp = new sql_1.ExpFuncCustom(factory.func_cast, valField, new sql_1.ExpDatePart('json'));
        const valStrExp = new sql_1.ExpFunc('JSON_QUOTE', valField);
        return [
            [il_1.EnumSysTable.ixInt, valNumExp],
            [il_1.EnumSysTable.ixDec, valNumExp],
            [il_1.EnumSysTable.ixStr, valStrExp],
        ];
    }
    createMapBuds() {
        // const { factory } = this.context;
        const mapBuds = new Map();
        this.ixValueArr().forEach(([tbl, val]) => {
            mapBuds.set(tbl, { buds: [], value: val });
        });
        return mapBuds;
    }
    buildMapBuds(buds) {
        if (buds === undefined)
            return;
        let mapBuds = this.createMapBuds();
        for (let bud of buds) {
            let ixBudTbl = il_1.EnumSysTable.ixInt;
            switch (bud.dataType) {
                default:
                    ixBudTbl = il_1.EnumSysTable.ixInt;
                    break;
                case BizPhraseType_1.BudDataType.dec:
                    ixBudTbl = il_1.EnumSysTable.ixDec;
                    break;
                case BizPhraseType_1.BudDataType.str:
                case BizPhraseType_1.BudDataType.char:
                    ixBudTbl = il_1.EnumSysTable.ixStr;
                    break;
                case BizPhraseType_1.BudDataType.fork:
                    ixBudTbl = il_1.EnumSysTable.ixJson;
                    break;
            }
            let tbl = mapBuds.get(ixBudTbl);
            tbl.buds.push(bud);
        }
        return mapBuds;
    }
    buildInsertBuds(mainTbl, mapBuds) {
        let ret = [];
        for (let [tbl, { buds, value }] of mapBuds) {
            if (buds.length === 0)
                continue;
            ret.push(this.buildInsertBud(mainTbl, tbl, buds, value));
        }
        return ret;
    }
    buildInsertBud(mainTbl, tbl, buds, expVal) {
        const { factory } = this.context;
        let insertBud = factory.createInsert();
        insertBud.ignore = true;
        insertBud.table = new statementWithFrom_1.VarTable('props');
        insertBud.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertBud.select = select;
        let expIdEQ = new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('i', b));
        let expON = buds === undefined || buds.length === 0 ?
            expIdEQ
            :
                new sql_1.ExpAnd(expIdEQ, new sql_1.ExpIn(new sql_1.ExpField('x', b), ...buds.map(v => new sql_1.ExpNum(v.id))));
        select.from(new statementWithFrom_1.VarTable(mainTbl, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, b))
            .on(expON);
        select.column(new sql_1.ExpField('id', a), 'id');
        select.column(new sql_1.ExpField('x', b), 'phrase');
        select.column(expVal, 'value');
        // select.order(new ExpField('x', b), 'asc');
        return insertBud;
    }
}
exports.BFromStatement = BFromStatement;
//# sourceMappingURL=from.js.map