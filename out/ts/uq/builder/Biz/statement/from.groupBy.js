"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromGroupByBaseStatement = exports.BFromGroupByStatement = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const sql_1 = require("../../sql");
const select_1 = require("../../sql/select");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const from_1 = require("./from");
const tools_1 = require("../../tools");
const a = 'a', b = 'b', c = 'c';
const tblDetail = '$detail';
const pageGroupBy = '$pageGroupBy';
class BFromGroupByStatement extends from_1.BFromStatement {
    constructor(context, istatement) {
        super(context, istatement);
        this.setIds();
        const [{ asc, fromEntity }] = this.istatement.ids;
        this.asc = asc;
        this.idFromEntity = fromEntity;
    }
    setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = ids;
        this.showIds = showIds;
    }
    buildFromMain(cmpPage) {
        const { factory } = this.context;
        let tblPageGroupBy = this.buildTablePageGroupBy();
        let tblDetail = this.buildTalbeDetail();
        let selectPage = this.buildFromSelectPage(cmpPage);
        let insertPage = factory.createInsert();
        insertPage.select = selectPage;
        insertPage.table = new statementWithFrom_1.VarTable(pageGroupBy);
        insertPage.cols = this.buildInsertPageCols();
        let insertRet = this.buildInsertRet();
        let insertIdsAtoms = this.buildInsertIdsAtoms(pageGroupBy, this.idsGroupBy);
        let insertIdsSpecs = this.buildInsertIdsSpecs(pageGroupBy, this.idsGroupBy);
        let insertSpec = this.buildInsertSpec();
        return [tblPageGroupBy, tblDetail, insertPage, insertRet, insertIdsAtoms, insertIdsSpecs, ...insertSpec];
    }
    buildInsertPageCols() {
        let ret = this.idsGroupBy.map((v, index) => ({
            col: 'id' + index,
            val: undefined,
        }));
        ret.push({ col: 'ban', val: undefined });
        ret.push({ col: 'value', val: undefined });
        return ret;
    }
    buildTablePageGroupBy() {
        const { factory } = this.context;
        let varTable = factory.createVarTable();
        varTable.name = pageGroupBy;
        const ban = (0, il_1.tinyIntField)('ban');
        ban.nullable = true;
        const value = (0, il_1.decField)('value', 18, 6);
        value.nullable = true;
        let idField = (0, il_1.intField)('$id');
        idField.autoInc = true;
        varTable.keys = [idField];
        varTable.fields = [
            idField,
            ...this.idsGroupBy.map((v, index) => (0, il_1.bigIntField)('id' + index)),
            ban,
            value,
        ];
        return varTable;
    }
    buildTalbeDetail() {
        if (this.showIds.length === 0)
            return;
        const { factory } = this.context;
        let varTable = factory.createVarTable();
        varTable.name = tblDetail;
        let $idField = (0, il_1.intField)('$id');
        $idField.autoInc = true;
        let idField = (0, il_1.bigIntField)('id');
        let atomField = (0, il_1.bigIntField)('atom');
        let banField = (0, il_1.tinyIntField)('ban');
        let jField = (0, il_1.jsonField)('json');
        let valueField = (0, il_1.decField)('value', 18, 6);
        varTable.keys = [$idField];
        varTable.fields = [
            $idField,
            idField,
            atomField,
            banField,
            jField,
            valueField,
            ...this.showIds.map((v, index) => (0, il_1.bigIntField)('id' + index))
        ];
        return varTable;
    }
    buildFromSelectPage(cmpPage) {
        const { factory } = this.context;
        const { where, fromEntity } = this.istatement;
        const select = factory.createSelect();
        this.buildGroupByIds(select);
        this.buildSelectBan(select);
        this.buildSelectVallueSum(select);
        this.buildSelectFrom(select, fromEntity);
        this.buildSelectJoin(select, fromEntity);
        const cmpEntityBase = this.buildRootEntityCompare(select);
        let wheres = [
            cmpPage,
            this.context.expCmp(where),
        ];
        if (cmpEntityBase !== undefined)
            wheres.unshift(cmpEntityBase);
        select.where(new sql_1.ExpAnd(...wheres));
        select.limit(new sql_1.ExpVar('$pageSize'));
        return select;
    }
    buildExpCmpBase(fromEntity, expField) {
        const { bizEntityArr } = fromEntity;
        const { factory } = this.context;
        if (fromEntity.isExtended() === true) {
            let sel = factory.createSelect();
            sel.lock = select_1.LockType.none;
            let selectCTE = factory.createSelect();
            selectCTE.lock = select_1.LockType.none;
            const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
            sel.cte = { alias: cte, recursive: true, select: selectCTE };
            selectCTE.column(new sql_1.ExpField('x', s), 'phrase');
            selectCTE.column(new sql_1.ExpField('i', s), 'i');
            selectCTE.column(new sql_1.ExpField('x', s), 'x');
            selectCTE.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixPhrase, false, s));
            selectCTE.where(new sql_1.ExpIn(new sql_1.ExpField('x', s), ...bizEntityArr.map(v => new sql_1.ExpNum(v.id))));
            let select1 = factory.createSelect();
            select1.lock = select_1.LockType.none;
            select1.column(new sql_1.ExpField('x', r), 'phrase');
            select1.column(new sql_1.ExpField('i', r));
            select1.column(new sql_1.ExpField('x', r));
            select1.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixPhrase, false, r))
                .join(il_1.JoinType.join, new statementWithFrom_1.NameTable(cte, r0))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('x', r0), new sql_1.ExpField('i', r)));
            selectCTE.unions = [select1];
            selectCTE.unionsAll = true;
            sel.distinct = true;
            sel.column(new sql_1.ExpField('phrase', a));
            sel.from(new statementWithFrom_1.NameTable(cte, a));
            return new sql_1.ExpIn(expField, new sql_1.ExpSelect(sel));
        }
        if (bizEntityArr.length === 1) {
            return new sql_1.ExpEQ(expField, new sql_1.ExpNum(bizEntityArr[0].id));
        }
        return new sql_1.ExpIn(expField, ...bizEntityArr.map(v => new sql_1.ExpNum(v.id)));
    }
    buildRootEntityCompare(select) {
        const { fromEntity } = this.istatement;
        const { bizEntityArr, bizPhraseType, alias } = fromEntity;
        const baseAlias = bizEntityArr.length > 0 ?
            alias + '$idu' : alias;
        const expBase = new sql_1.ExpField('base', baseAlias);
        switch (bizPhraseType) {
            default:
                return;
            case BizPhraseType_1.BizPhraseType.atom:
                return this.buildExpCmpBase(fromEntity, expBase);
            case BizPhraseType_1.BizPhraseType.fork:
                let budAlias = alias + '$bud';
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, budAlias))
                    .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', budAlias), expBase), this.buildExpCmpBase(fromEntity, new sql_1.ExpField('ext', budAlias))));
                return;
        }
    }
    buildGroupByIds(select) {
        this.idsGroupBy.forEach((v, index) => {
            let idColumn = v;
            let expField = idColumn.fromEntity.expIdCol(); // new ExpField('id', idColumn.fromEntity.alias);
            select.column(expField, 'id' + index);
            select.group(expField);
            select.order(expField, this.buildAsc(idColumn));
        });
    }
    buildAsc(idColumn) {
        return idColumn.asc === il_1.EnumAsc.asc ? 'asc' : 'desc';
    }
    buildSelectIds(select, alias) {
        const arr = this.idsGroupBy.map(v => new sql_1.ExpField('id', v.fromEntity.alias));
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), alias);
    }
    buildInsertRet() {
        const { factory } = this.context;
        const { intoTables, fromEntity, ids } = this.istatement;
        const insertRet = factory.createInsert();
        insertRet.table = new statementWithFrom_1.VarTable(intoTables.ret);
        insertRet.cols = [
            { col: 'id', val: undefined },
            { col: 'ban', val: undefined },
            { col: 'json', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertRet.select = select;
        select.from(new statementWithFrom_1.VarTable(pageGroupBy, pageGroupBy));
        select.column(new sql_1.ExpField('$id', pageGroupBy), 'id');
        select.column(new sql_1.ExpField('ban', pageGroupBy));
        let arr = this.idsGroupBy.map((v, index) => new sql_1.ExpField('id' + index, pageGroupBy));
        //====
        // 之前注释掉，2025-1-12加回来。好像对于QueryAtom这种简单的单id查询是需要的
        // 第三方物流WMS系统: 查询货品
        // 必须加上这一行，才有
        // arr.push(...this.buildSelectCols());
        this.buildRetSelectCols(arr);
        // 查询货品是单id查询，没有用group by，所以在ret.json里面返回所有列。
        // 多id查询，用到了group by，在ret.json里面不返回所有列，在specs.json里面返回所有列
        //====
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), 'json');
        select.column(new sql_1.ExpField('value', pageGroupBy));
        select.order(new sql_1.ExpField('$id', pageGroupBy), 'asc');
        this.buildSelectRetFrom(select, pageGroupBy);
        return insertRet;
    }
    buildSelectRetFrom(select, pageAlias) {
        let { length } = this.idsGroupBy;
        for (let i = 0; i < length; i++) {
            let idc = this.idsGroupBy[i];
            const { fromEntity } = idc;
            const { bizEntityTable, alias } = fromEntity;
            select
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(bizEntityTable, false, alias))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', alias), new sql_1.ExpField('id' + i, pageAlias)));
        }
    }
    buildFromEntity(sqls) {
        let { ids } = this.istatement;
        for (let idc of ids) {
            const { fromEntity: { bizEntityArr, bizPhraseType } } = idc;
            if (bizPhraseType !== BizPhraseType_1.BizPhraseType.fork)
                continue;
            if (bizEntityArr.length === 0) {
                this.ixValueArr().forEach(([tbl, val]) => {
                    sqls.push(this.buildInsertBud('specs', tbl, undefined, val));
                });
            }
            else {
                // 暂时只生成第一个spec的atom的所有字段
                for (let bizEntity of bizEntityArr) {
                    let fork = bizEntity;
                    this.buildInsertAtomBuds(sqls, fork.base);
                    const buds = [...fork.keys];
                    for (let [, bud] of fork.props) {
                        buds.push(bud);
                    }
                    let mapBuds = this.buildMapBuds(buds);
                    sqls.push(...this.buildInsertBuds('specs', mapBuds));
                }
            }
        }
        this.buildIdsProps(sqls);
    }
    buildIdsProps(sqls) {
        const ids = this.idsGroupBy;
        const { factory } = this.context;
        sqls.push((0, tools_1.buildIdPhraseTable)(this.context));
        sqls.push((0, tools_1.buildPhraseBudTable)(this.context));
        let { length } = ids;
        for (let i = 0; i < length; i++) {
            function buildSelectId(select) {
                const s = 's', colI = 'i', s1 = 's1';
                const selectId = factory.createSelect();
                selectId.lock = select_1.LockType.none;
                selectId.column(new sql_1.ExpField('id' + i, s), colI);
                selectId.from(new statementWithFrom_1.VarTable(pageGroupBy, s));
                select.from(new select_1.SelectTable(selectId, s1));
            }
            sqls.push(...(0, tools_1.buildSelectIdPhrases)(this.context, buildSelectId));
        }
        sqls.push((0, tools_1.buildSelectPhraseBud)(this.context));
        sqls.push(...(0, tools_1.buildSelectIxBuds)(this.context));
    }
    buildInsertIdsAtoms(tbl, ids) {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        let expBId = new sql_1.ExpField('id', b);
        let expOn;
        if (this.idsGroupBy.length === 1) {
            expOn = new sql_1.ExpEQ(expBId, new sql_1.ExpField('id0', a));
        }
        else {
            let arrExp = [expBId, ...ids.map((v, index) => new sql_1.ExpField('id' + index, a))];
            expOn = new sql_1.ExpIn(...arrExp);
        }
        select.from(new statementWithFrom_1.VarTable(tbl, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, b))
            .on(expOn);
        return insert;
    }
    buildInsertIdsSpecs(tbl, ids) {
        const { factory } = this.context;
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable('atoms');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'base', val: undefined },
        ];
        let select = factory.createSelect();
        insert.select = select;
        select.distinct = true;
        select.column(new sql_1.ExpField('id', b));
        select.column(new sql_1.ExpField('base', c));
        let expBId = new sql_1.ExpField('id', b);
        let expOn;
        if (this.idsGroupBy.length === 1) {
            expOn = new sql_1.ExpEQ(expBId, new sql_1.ExpField('id0', a));
        }
        else {
            let arrExp = [expBId, ...ids.map((v, index) => new sql_1.ExpField('id' + index, a))];
            expOn = new sql_1.ExpIn(...arrExp);
        }
        select.from(new statementWithFrom_1.VarTable(tbl, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.fork, false, b))
            .on(expOn)
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, c))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('base', c))));
        return insert;
    }
    buildInsertSpec() {
        return [];
    }
    buildRetSelectCols(arr) {
        arr.push(...this.buildSelectCols());
    }
}
exports.BFromGroupByStatement = BFromGroupByStatement;
class BFromGroupByBaseStatement extends BFromGroupByStatement {
    buildRetSelectCols(arr) { }
    setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = [...ids];
        this.idsGroupBy.pop();
        this.showIds = showIds;
    }
    buildExpFieldPageId() {
        let { alias: t1 } = this.idsGroupBy[this.idsGroupBy.length - 1].fromEntity;
        return new sql_1.ExpField('id', t1);
    }
    buildInsertSpec() {
        const { factory } = this.context;
        let memo = factory.createMemo();
        memo.text = 'insert spec';
        const { fromEntity, intoTables, where } = this.istatement;
        let insertSpec = factory.createInsert();
        insertSpec.ignore = true;
        insertSpec.table = new statementWithFrom_1.VarTable(intoTables.specs);
        insertSpec.cols = [
            { col: 'id', val: undefined },
            { col: 'atom', val: undefined },
            { col: 'ban', val: undefined },
            { col: 'json', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertSpec.select = select;
        select.distinct = true;
        this.buildSelectFrom(select, fromEntity);
        this.buildSelectJoin(select, fromEntity);
        select.join(il_1.JoinType.join, new statementWithFrom_1.VarTable(pageGroupBy, '$ret'))
            .on(new sql_1.ExpAnd(...this.idsGroupBy.map((v, index) => new sql_1.ExpEQ(new sql_1.ExpField('id', v.fromEntity.alias), new sql_1.ExpField('id' + index, '$ret')))));
        select.column(new sql_1.ExpField('id', b), 'id');
        select.column(new sql_1.ExpField('$id', '$ret'), 'atom');
        select.where(this.context.expCmp(where));
        this.buildSelectBan(select);
        let arr = this.buildSelectCols();
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), 'json');
        this.buildSelectValue(select);
        if (this.showIds.length === 0) {
            insertSpec.table = new statementWithFrom_1.VarTable(intoTables.specs);
            return [insertSpec];
        }
        else {
            insertSpec.table = new statementWithFrom_1.VarTable(tblDetail);
            insertSpec.cols.push(...this.showIds.map((v, index) => ({ col: 'id' + index, val: undefined })));
            for (let id of this.showIds) {
                select.column(new sql_1.ExpField('id', id.fromEntity.alias));
            }
            return [insertSpec, ...this.buildFromDetailToSpecs()];
        }
    }
    buildFromDetailToSpecs() {
        const { factory } = this.context;
        const { intoTables } = this.istatement;
        let ret = [];
        let insertSpec = factory.createInsert();
        ret.push(insertSpec);
        insertSpec.ignore = true;
        insertSpec.table = new statementWithFrom_1.VarTable(intoTables.specs);
        insertSpec.cols = [
            { col: 'id', val: undefined },
            { col: 'atom', val: undefined },
            { col: 'ban', val: undefined },
            { col: 'json', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertSpec.select = select;
        select.from(new statementWithFrom_1.VarTable(tblDetail, a));
        select.column(new sql_1.ExpField('id', a));
        select.column(new sql_1.ExpField('atom', a));
        select.column(new sql_1.ExpField('ban', a));
        select.column(new sql_1.ExpField('json', a));
        select.column(new sql_1.ExpField('value', a));
        ret.push(this.buildInsertIdsAtoms(tblDetail, this.showIds));
        ret.push(this.buildInsertIdsSpecs(tblDetail, this.showIds));
        return ret;
    }
    buildSelectCols() {
        let arr = super.buildSelectCols();
        if (this.showIds.length > 0) {
            arr.push(new sql_1.ExpFunc('JSON_ARRAY', sql_1.ExpNum.num0, ...this.showIds.map((v, index) => new sql_1.ExpField('id', v.fromEntity.alias))));
        }
        return arr;
    }
}
exports.BFromGroupByBaseStatement = BFromGroupByBaseStatement;
//# sourceMappingURL=from.groupBy.js.map