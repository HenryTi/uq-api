"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatement = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const bstatement_1 = require("../../bstatement/bstatement");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const a = 'a', b = 'b';
// const t1 = 't1';
const pageStart = '$pageStart';
class BFromStatement extends bstatement_1.BStatement {
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
    buildSelectVallueBase(select, sum) {
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
    buildSelectVallue(select) {
        this.buildSelectVallueBase(select, false);
    }
    buildSelectVallueSum(select) {
        this.buildSelectVallueBase(select, true);
    }
    buildSelectCols(select, alias) {
        const { cols } = this.istatement;
        const arr = [];
        for (let col of cols) {
            const { name, val, bud } = col;
            let expName;
            if (bud !== undefined)
                expName = new sql_1.ExpNum(bud.id);
            else
                expName = new sql_1.ExpStr(name);
            arr.push(new sql_1.ExpFunc('JSON_ARRAY', expName, this.context.expVal(val)));
        }
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), alias);
    }
    buildSelectFrom(select, fromEntity) {
        const { bizEntityArr, bizPhraseType, ofIXs, ofOn, alias, subs } = fromEntity;
        function eqOrIn(expField) {
            if (bizEntityArr.length === 1) {
                return new sql_1.ExpEQ(expField, new sql_1.ExpNum(bizEntityArr[0].id));
            }
            else {
                return new sql_1.ExpIn(expField, ...bizEntityArr.map(v => new sql_1.ExpNum(v.id)));
            }
        }
        const $bzp = `${alias}$bzp`;
        switch (bizPhraseType) {
            default:
                debugger;
                break;
            case BizPhraseType_1.BizPhraseType.atom:
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizPhrase, false, $bzp))
                    .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', $bzp), new sql_1.ExpField('base', alias)), eqOrIn(new sql_1.ExpField('id', $bzp))));
                break;
            case BizPhraseType_1.BizPhraseType.spec:
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, $bzp))
                    .on(eqOrIn(new sql_1.ExpField('ext', $bzp)));
                break;
            case BizPhraseType_1.BizPhraseType.combo:
                break;
        }
        let expPrev = new sql_1.ExpField('id', alias);
        if (ofIXs !== undefined) {
            let len = ofIXs.length;
            for (let i = 0; i < len; i++) {
                let ix = ofIXs[i];
                let tOf = 'of' + i;
                let tBud = 'bud' + i;
                let fieldBase = new sql_1.ExpField('base', alias);
                let expBase = bizEntityArr.length === 1 ?
                    new sql_1.ExpEQ(fieldBase, new sql_1.ExpNum(bizEntityArr[0].id))
                    :
                        new sql_1.ExpIn(fieldBase, ...bizEntityArr.map(v => new sql_1.ExpNum(v.id)));
                let wheres = [
                    expBase,
                    new sql_1.ExpEQ(new sql_1.ExpField('id', tBud), new sql_1.ExpField('i', tOf)),
                    new sql_1.ExpEQ(new sql_1.ExpField('base', tBud), new sql_1.ExpNum(ix.id)),
                ];
                if (ofOn !== undefined) {
                    wheres.push(new sql_1.ExpEQ(expPrev, this.context.expVal(ofOn)));
                }
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false, tOf))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('x', tOf), expPrev))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, tBud))
                    .on(new sql_1.ExpAnd(...wheres));
                expPrev = new sql_1.ExpField('ext', tBud);
            }
        }
        if (subs !== undefined) {
            for (let sub of subs) {
                const { field, fromEntity: subFromEntity, isSpecBase } = sub;
                const { alias: subAlias } = subFromEntity;
                const entityTable = this.buildEntityTable(subFromEntity);
                if (isSpecBase === true) {
                    let budAlias = subAlias + '$bud';
                    select
                        .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, budAlias))
                        .on(new sql_1.ExpEQ(new sql_1.ExpField('id', budAlias), new sql_1.ExpField(field, alias)))
                        .join(il_1.JoinType.join, entityTable)
                        .on(new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField('base', budAlias)));
                }
                else {
                    select
                        .join(il_1.JoinType.join, entityTable)
                        .on(new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField(field, alias)));
                }
                this.buildSelectFrom(select, subFromEntity);
            }
        }
    }
    buildEntityTable(fromEntity) {
        const { bizEntityArr, bizEntityTable, alias: t0 } = fromEntity;
        if (bizEntityTable !== undefined) {
            let ret = new statementWithFrom_1.EntityTable(bizEntityTable, false, t0);
            return ret;
        }
        else {
            let ret = new statementWithFrom_1.GlobalTable('$site', `${this.context.site}.${bizEntityArr[0].id}`, t0);
            return ret;
        }
    }
    buildSelect(cmpPage) {
        const { factory } = this.context;
        const { where, fromEntity } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        // const bizEntity0 = bizEntityArr[0];
        const select = factory.createSelect();
        select.from(new statementWithFrom_1.EntityTable(bizEntityTable, false, t0));
        this.buildSelectFrom(select, fromEntity);
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
        select.column(new sql_1.ExpField('base', b));
        select.column(new sql_1.ExpField('no', b));
        select.column(new sql_1.ExpField('ex', b));
        return insertAtom;
    }
    buildInsertAtomBuds(sqls, atom) {
        let titlePrimeBuds = atom.getTitlePrimeBuds();
        let mapBuds = this.createMapBuds();
        this.buildMapBuds(mapBuds, titlePrimeBuds);
        this.buildInsertBuds(sqls, 'atoms', mapBuds);
    }
    createMapBuds() {
        const { factory } = this.context;
        const mapBuds = new Map();
        const valField = new sql_1.ExpField('value', 'b');
        const valNumExp = new sql_1.ExpFuncCustom(factory.func_cast, valField, new sql_1.ExpDatePart('json'));
        const valStrExp = new sql_1.ExpFunc('JSON_QUOTE', valField);
        mapBuds.set(il_1.EnumSysTable.ixBudInt, { buds: [], value: valNumExp });
        mapBuds.set(il_1.EnumSysTable.ixBudDec, { buds: [], value: valNumExp });
        mapBuds.set(il_1.EnumSysTable.ixBudStr, { buds: [], value: valStrExp });
        return mapBuds;
    }
    buildMapBuds(mapBuds, buds) {
        if (buds === undefined)
            return;
        for (let bud of buds) {
            let ixBudTbl = il_1.EnumSysTable.ixBudInt;
            switch (bud.dataType) {
                default:
                    ixBudTbl = il_1.EnumSysTable.ixBudInt;
                    break;
                case BizPhraseType_1.BudDataType.dec:
                    ixBudTbl = il_1.EnumSysTable.ixBudDec;
                    break;
                case BizPhraseType_1.BudDataType.str:
                case BizPhraseType_1.BudDataType.char:
                    ixBudTbl = il_1.EnumSysTable.ixBudStr;
                    break;
            }
            let tbl = mapBuds.get(ixBudTbl);
            tbl.buds.push(bud);
        }
    }
    buildInsertBuds(sqls, mainTbl, mapBuds) {
        for (let [tbl, { buds, value }] of mapBuds) {
            if (buds.length === 0)
                continue;
            this.buildInsertBud(sqls, mainTbl, tbl, buds, value);
        }
    }
    buildInsertBud(sqls, mainTbl, tbl, buds, expVal) {
        const { factory } = this.context;
        let insertBud = factory.createInsert();
        sqls.push(insertBud);
        insertBud.ignore = true;
        insertBud.table = new statementWithFrom_1.VarTable('props');
        insertBud.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertBud.select = select;
        select.from(new statementWithFrom_1.VarTable(mainTbl, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, b))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('i', b)), new sql_1.ExpIn(new sql_1.ExpField('x', b), ...buds.map(v => new sql_1.ExpNum(v.id)))));
        select.column(new sql_1.ExpField('id', a), 'id');
        select.column(new sql_1.ExpField('x', b), 'phrase');
        select.column(expVal, 'value');
    }
}
exports.BFromStatement = BFromStatement;
//# sourceMappingURL=from.js.map