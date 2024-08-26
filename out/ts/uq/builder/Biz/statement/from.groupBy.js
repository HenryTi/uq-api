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
        insertPage.table = new statementWithFrom_1.VarTable(tools_1.pageGroupBy);
        insertPage.cols = this.buildInsertPageCols();
        let insertRet = this.buildInsertRet();
        let insertIdsAtoms = this.buildInsertIdsAtoms(tools_1.pageGroupBy, this.idsGroupBy);
        let insertIdsSpecs = this.buildInsertIdsSpecs(tools_1.pageGroupBy, this.idsGroupBy);
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
        varTable.name = tools_1.pageGroupBy;
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
        let entityTable = this.buildEntityTable(fromEntity);
        select.from(entityTable);
        this.buildSelectFrom(select, fromEntity);
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
    buildRootEntityCompare(select) {
        const { fromEntity } = this.istatement;
        const { bizEntityArr, bizPhraseType, alias } = fromEntity;
        const expBase = new sql_1.ExpField('base', alias);
        const eqOrIn = (expField) => {
            /*
            if (bizEntityArr.length === 1) {
                return new ExpEQ(expField, new ExpNum(bizEntityArr[0].id));
            }
            else {
            */
            const { factory } = this.context;
            let sel = factory.createSelect();
            sel.lock = select_1.LockType.none;
            let selectCTE = factory.createSelect();
            selectCTE.lock = select_1.LockType.none;
            const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
            sel.cte = { alias: cte, recursive: true, select: selectCTE };
            selectCTE.column(new sql_1.ExpField('x', s), 'phrase');
            selectCTE.column(new sql_1.ExpField('i', s), 'i');
            selectCTE.column(new sql_1.ExpField('x', s), 'x');
            selectCTE.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBizPhrase, false, s));
            selectCTE.where(new sql_1.ExpIn(new sql_1.ExpField('x', s), ...bizEntityArr.map(v => new sql_1.ExpNum(v.id))));
            let select1 = factory.createSelect();
            select1.lock = select_1.LockType.none;
            select1.column(new sql_1.ExpField('x', r), 'phrase');
            select1.column(new sql_1.ExpField('i', r));
            select1.column(new sql_1.ExpField('x', r));
            select1.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBizPhrase, false, r))
                .join(il_1.JoinType.join, new statementWithFrom_1.NameTable(cte, r0))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('x', r0), new sql_1.ExpField('i', r)));
            selectCTE.unions = [select1];
            selectCTE.unionsAll = true;
            sel.distinct = true;
            sel.column(new sql_1.ExpField('phrase', a));
            // sel.column(new ExpField('x', a));
            // sel.column(new ExpField('x', b));
            // sel.column(new ExpField('type', b), 'budtype');
            sel.from(new statementWithFrom_1.NameTable(cte, a));
            //    .join(JoinType.join, new EntityTable(EnumSysTable.bizBudShow, false, b))
            //    .on(new ExpEQ(new ExpField('i', b), new ExpField('x', a)));
            // ...bizEntityArr.map(v => new ExpNum(v.id));
            return new sql_1.ExpIn(expField, new sql_1.ExpSelect(sel));
            //}
        };
        switch (bizPhraseType) {
            default:
                return;
            case BizPhraseType_1.BizPhraseType.atom:
                return eqOrIn(expBase);
            case BizPhraseType_1.BizPhraseType.fork:
                let budAlias = alias + '$bud';
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, budAlias))
                    .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', budAlias), new sql_1.ExpField('base', alias)), eqOrIn(new sql_1.ExpField('ext', budAlias))));
                return;
        }
    }
    buildGroupByIds(select) {
        this.idsGroupBy.forEach((v, index) => {
            let idColumn = v;
            let expField = new sql_1.ExpField('id', idColumn.fromEntity.alias);
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
        select.from(new statementWithFrom_1.VarTable(tools_1.pageGroupBy, tools_1.pageGroupBy));
        select.column(new sql_1.ExpField('$id', tools_1.pageGroupBy), 'id');
        select.column(new sql_1.ExpField('ban', tools_1.pageGroupBy));
        let arr = this.idsGroupBy.map((v, index) => new sql_1.ExpField('id' + index, tools_1.pageGroupBy));
        arr.push(...this.buildSelectCols());
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), 'json');
        select.column(new sql_1.ExpField('value', tools_1.pageGroupBy));
        select.order(new sql_1.ExpField('$id', tools_1.pageGroupBy), 'asc');
        this.buildSelectRetFrom(select, tools_1.pageGroupBy);
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
            const { fromEntity: { bizEntityArr } } = idc;
            // 暂时只生成第一个spec的atom的所有字段
            let [bizEntity] = bizEntityArr;
            if (bizEntity.bizPhraseType === BizPhraseType_1.BizPhraseType.fork) {
                let spec = bizEntity;
                this.buildInsertAtomBuds(sqls, spec.base);
                const buds = [...spec.keys];
                for (let [, bud] of spec.props) {
                    buds.push(bud);
                }
                let mapBuds = this.buildMapBuds(buds);
                sqls.push(...this.buildInsertBuds('specs', mapBuds));
            }
        }
        this.buildIdsProps(sqls);
    }
    buildIdsProps(sqls) {
        const { ids } = this.istatement;
        const { factory } = this.context;
        sqls.push((0, tools_1.buildIdPhraseTable)(this.context));
        sqls.push((0, tools_1.buildPhraseBudTable)(this.context));
        function buildSelectFrom(select) {
            const s0 = 's0', s1 = 's1', colI = 'i';
            const selectIds = factory.createSelect();
            selectIds.lock = select_1.LockType.none;
            selectIds.column(new sql_1.ExpField('id0', s0), colI);
            selectIds.from(new statementWithFrom_1.VarTable(tools_1.pageGroupBy, s0));
            const sels = [];
            for (let i = 1; i < ids.length; i++) {
                const selectIdi = factory.createSelect();
                selectIdi.lock = select_1.LockType.none;
                sels.push(selectIdi);
                const t = '$x' + i;
                selectIds.column(new sql_1.ExpField('id' + i, t), colI);
                selectIds.from(new statementWithFrom_1.VarTable(tools_1.pageGroupBy, t));
            }
            selectIds.unions = sels;
            select.from(new select_1.SelectTable(selectIds, s1));
        }
        sqls.push(...(0, tools_1.buildSelectIdPhrases)(this.context, buildSelectFrom));
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
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, b))
            .on(expOn)
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, c))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('base', b))));
        return insert;
    }
    buildInsertSpec() {
        return [];
    }
}
exports.BFromGroupByStatement = BFromGroupByStatement;
class BFromGroupByBaseStatement extends BFromGroupByStatement {
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
        const entityTable = this.buildEntityTable(fromEntity);
        select.from(entityTable);
        this.buildSelectFrom(select, fromEntity);
        select.join(il_1.JoinType.join, new statementWithFrom_1.VarTable(tools_1.pageGroupBy, '$ret'))
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
    buildSelectCols( /*select: Select, alias: string*/) {
        let arr = super.buildSelectCols();
        if (this.showIds.length > 0) {
            arr.push(new sql_1.ExpFunc('JSON_ARRAY', sql_1.ExpNum.num0, ...this.showIds.map((v, index) => new sql_1.ExpField('id', v.fromEntity.alias))));
        }
        return arr;
        // select.column(new ExpFunc('JSON_ARRAY', ...arr), alias);
    }
}
exports.BFromGroupByBaseStatement = BFromGroupByBaseStatement;
//# sourceMappingURL=from.groupBy.js.map