"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatementInPend = exports.BFromStatement = void 0;
const consts_1 = require("../../../consts");
const il_1 = require("../../../il");
const __1 = require("..");
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
        const { fromEntity, asc } = this.istatement;
        let { alias: t1 } = fromEntity;
        const ifStateNull = factory.createIf();
        sqls.push(ifStateNull);
        ifStateNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(pageStart));
        const setPageState = factory.createSet();
        ifStateNull.then(setPageState);
        let expStart, cmpPage;
        let varStart = new sql_1.ExpVar(pageStart);
        if (asc === 'asc') {
            expStart = new sql_1.ExpNum(0);
            cmpPage = new sql_1.ExpGT(new sql_1.ExpField('id', t1), varStart);
        }
        else {
            expStart = new sql_1.ExpStr('9223372036854775807');
            cmpPage = new sql_1.ExpLT(new sql_1.ExpField('id', t1), varStart);
        }
        setPageState.equ(pageStart, expStart);
        let stat = this.buildFromMain(cmpPage);
        sqls.push(stat);
        this.buildFromEntity(sqls);
    }
    buildFromMain(cmpPage) {
        const { factory } = this.context;
        const { intoTables } = this.istatement;
        let select = this.buildFromSelect(cmpPage);
        if (intoTables !== undefined) {
            let insert = factory.createInsert();
            insert.select = select;
            insert.table = new statementWithFrom_1.VarTable(intoTables.ret);
            insert.cols = [
                { col: 'id', val: undefined },
                { col: 'ban', val: undefined },
                { col: 'json', val: undefined },
            ];
            return insert;
        }
        else {
            return select;
        }
    }
    buildFromSelect(cmpPage) {
        const { ban, idFromEntity } = this.istatement;
        let select = this.buildSelect(cmpPage);
        select.column(new sql_1.ExpField('id', idFromEntity.alias), 'id');
        if (ban === undefined) {
            select.column(sql_1.ExpNum.num0, 'ban');
        }
        else {
            select.column(this.context.expCmp(ban.val), 'ban');
        }
        this.buildSelectCols(select, 'json');
        return select;
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
        const { bizEntityArr, ofIXs, ofOn, alias, subs } = fromEntity;
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
                const { field, fromEntity: subFromEntity } = sub;
                const { bizEntityTable, alias: subAlias } = subFromEntity;
                select
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(bizEntityTable, false, subAlias))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField(field, alias)));
                this.buildSelectFrom(select, subFromEntity);
            }
        }
    }
    buildSelect(cmpPage) {
        const { factory } = this.context;
        const { asc, where, fromEntity } = this.istatement;
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
        select.order(new sql_1.ExpField('id', t0), asc);
        select.limit(new sql_1.ExpVar('$pageSize'));
        return select;
    }
    buildFromEntity(sqls) {
        let { bizPhraseType, bizEntityArr } = this.istatement.idFromEntity;
        switch (bizPhraseType) {
            default: break;
            case BizPhraseType_1.BizPhraseType.atom:
                this.buildFromAtom(sqls, bizEntityArr);
                break;
            case BizPhraseType_1.BizPhraseType.spec:
                this.buildFromSpec(sqls, bizEntityArr);
                break;
        }
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
    buildInsertAtomDirect() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new statementWithFrom_1.VarTable('ret', a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('id', b)));
        return insert;
    }
    buildInsertAtomOfSpec() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new statementWithFrom_1.VarTable('specs', a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('base', a), new sql_1.ExpField('id', b)));
        return insert;
    }
    buildFromAtom(sqls, entityArr) {
        let insertAtom = this.buildInsertAtomDirect();
        sqls.push(insertAtom);
        let entity = entityArr[0];
        this.buildInsertAtomBuds(sqls, entity);
    }
    buildFromSpec(sqls, entityArr) {
        const { factory } = this.context;
        let insertSpec = factory.createInsert();
        sqls.push(insertSpec);
        insertSpec.ignore = true;
        insertSpec.table = new statementWithFrom_1.VarTable('specs');
        insertSpec.cols = [
            { col: 'spec', val: undefined },
            { col: 'atom', val: undefined },
        ];
        let select = factory.createSelect();
        insertSpec.select = select;
        select.distinct = true;
        select.from(new statementWithFrom_1.VarTable('ret', a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('id', b)));
        select.column(new sql_1.ExpField('id', b), 'spec');
        select.column(new sql_1.ExpField('base', b), 'atom');
        for (let spec of entityArr) {
            const mapBuds = new Map();
            const buds = [];
            for (let [, bud] of spec.props) {
                buds.push(bud);
            }
            this.buildMapBuds(mapBuds, buds);
            this.buildInsertBuds(sqls, 'specs', mapBuds);
        }
        let insertAtomOfSpec = this.buildInsertAtomOfSpec();
        sqls.push(insertAtomOfSpec);
        // 暂时只生成第一个spec的atom的所有字段
        let [spec] = entityArr;
        this.buildInsertAtomBuds(sqls, spec.base);
    }
    buildInsertAtomBuds(sqls, atom) {
        const { factory } = this.context;
        const { titleBuds, primeBuds } = atom;
        const mapBuds = new Map();
        const valField = new sql_1.ExpField('value', 'b');
        const valNumExp = new sql_1.ExpFuncCustom(factory.func_cast, valField, new sql_1.ExpDatePart('json'));
        const valStrExp = new sql_1.ExpFunc('JSON_QUOTE', valField);
        mapBuds.set(il_1.EnumSysTable.ixBudInt, { buds: [], value: valNumExp });
        mapBuds.set(il_1.EnumSysTable.ixBudDec, { buds: [], value: valNumExp });
        mapBuds.set(il_1.EnumSysTable.ixBudStr, { buds: [], value: valStrExp });
        this.buildMapBuds(mapBuds, titleBuds);
        this.buildMapBuds(mapBuds, primeBuds);
        this.buildInsertBuds(sqls, 'atoms', mapBuds);
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
class BFromStatementInPend extends BFromStatement {
    buildFromMain(cmpStart) {
        const { factory } = this.context;
        let select = super.buildSelect(cmpStart);
        let tblA = 'pend';
        let tblB = 'bin';
        let tblSheet = 'sheet';
        let tblSheetBin = 'sheetBin';
        const a = __1.MapFieldTable[tblA], b = __1.MapFieldTable[tblB], b1 = 'b1', c = 'c', d = 'd';
        const sheet = __1.MapFieldTable[tblSheet];
        const sheetBin = __1.MapFieldTable[tblSheetBin];
        select.column(new sql_1.ExpField('id', a), 'pend');
        select.column(new sql_1.ExpField('id', sheetBin), 'sheet');
        select.column(new sql_1.ExpField('bin', a), 'id');
        select.column(new sql_1.ExpField('i', b), 'i');
        select.column(new sql_1.ExpField('x', b), 'x');
        select.column(new sql_1.ExpField(consts_1.binValue, b), consts_1.binValue);
        select.column(new sql_1.ExpField(consts_1.binPrice, b), consts_1.binPrice);
        select.column(new sql_1.ExpField(consts_1.binAmount, b), consts_1.binAmount);
        select.column(new sql_1.ExpField('value', a), 'pendvalue');
        select.column(new sql_1.ExpField('mid', a), 'mid');
        this.buildSelectCols(select, 'cols');
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('bin', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizPhrase, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('base', a)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizDetail, false, b1))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b1), new sql_1.ExpField('id', b)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, d))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', d), new sql_1.ExpField('base', b1)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, sheetBin))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', sheetBin), new sql_1.ExpField('base', d)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizSheet, false, sheet))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', sheet), new sql_1.ExpField('id', sheetBin)));
        let insert = factory.createInsert();
        insert.table = new statementWithFrom_1.VarTableWithSchema('$page');
        insert.cols = [
            { col: 'pend', val: undefined },
            { col: 'sheet', val: undefined },
            { col: 'id', val: undefined },
            { col: 'i', val: undefined },
            { col: 'x', val: undefined },
            { col: consts_1.binValue, val: undefined },
            { col: consts_1.binPrice, val: undefined },
            { col: consts_1.binAmount, val: undefined },
            { col: 'pendvalue', val: undefined },
            { col: 'mid', val: undefined },
            { col: 'cols', val: undefined },
        ];
        insert.select = select;
        return insert;
    }
}
exports.BFromStatementInPend = BFromStatementInPend;
//# sourceMappingURL=from.js.map