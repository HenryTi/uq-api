"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromGroupByBaseStatement = exports.BFromGroupByStatement = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const from_1 = require("./from");
const a = 'a', b = 'b', c = 'c';
const pageGroupBy = '$pageGroupBy';
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
        function eqOrIn(expField) {
            if (bizEntityArr.length === 1) {
                return new sql_1.ExpEQ(expField, new sql_1.ExpNum(bizEntityArr[0].id));
            }
            else {
                return new sql_1.ExpIn(expField, ...bizEntityArr.map(v => new sql_1.ExpNum(v.id)));
            }
        }
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
        const { intoTables, fromEntity } = this.istatement;
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
        select.from(new statementWithFrom_1.VarTable(pageGroupBy, a));
        let entityTable = this.buildEntityTable(fromEntity);
        select.join(il_1.JoinType.join, entityTable)
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', entityTable.alias), new sql_1.ExpField('id0', a)));
        select.column(new sql_1.ExpField('$id', a), 'id');
        select.column(new sql_1.ExpField('ban', a));
        let arr = this.idsGroupBy.map((v, index) => new sql_1.ExpField('id' + index, a));
        arr.push(...this.buildSelectCols());
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), 'json');
        select.column(new sql_1.ExpField('value', a));
        select.order(new sql_1.ExpField('$id', a), 'asc');
        this.buildSelectFrom(select, fromEntity);
        return insertRet;
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
                // let mapBuds = this.createMapBuds();
                let mapBuds = this.buildMapBuds(buds);
                sqls.push(...this.buildInsertBuds('specs', mapBuds));
            }
        }
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