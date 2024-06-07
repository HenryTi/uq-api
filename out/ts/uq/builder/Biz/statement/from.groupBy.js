"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromGroupByBaseStatement = exports.BFromGroupByStatement = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const from_1 = require("./from");
const a = 'a', b = 'b';
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
        this.idsAll = this.istatement.ids;
        this.idsGroupBy = this.idsAll;
    }
    buildFromMain(cmpPage) {
        const { factory } = this.context;
        let tblPageGroupBy = this.buildTablePageGroupBy();
        let selectPage = this.buildFromSelectPage(cmpPage);
        let insertPage = factory.createInsert();
        insertPage.select = selectPage;
        insertPage.table = new statementWithFrom_1.VarTable(pageGroupBy);
        insertPage.cols = this.buildInsertPageCols();
        let insertRet = this.buildInsertRet();
        let insertAtomOfSpec = this.buildInsertAtomOfSpec();
        let insertSpec = this.buildInsertSpec();
        return [tblPageGroupBy, insertPage, insertRet, insertAtomOfSpec, insertSpec];
    }
    buildInsertPageCols() {
        let ret = this.idsGroupBy.map((v, index) => ({
            col: 'id' + index,
            val: undefined,
        }));
        ret.push({ col: 'ban', val: undefined });
        ret.push({ col: 'json', val: undefined });
        ret.push({ col: 'value', val: undefined });
        return ret;
    }
    buildTablePageGroupBy() {
        const { factory } = this.context;
        let varTable = factory.createVarTable();
        varTable.name = pageGroupBy;
        let keys = this.buildTablePageKeys();
        varTable.keys = keys;
        const ban = (0, il_1.tinyIntField)('ban');
        ban.nullable = true;
        const json = (0, il_1.jsonField)('json');
        json.nullable = true;
        const value = (0, il_1.decField)('value', 18, 6);
        value.nullable = true;
        varTable.fields = [
            ...keys,
            ban,
            json,
            value,
        ];
        return varTable;
    }
    buildTablePageKeys() {
        return this.idsGroupBy.map((v, index) => (0, il_1.bigIntField)('id' + index));
    }
    buildFromSelectPage(cmpPage) {
        const { factory } = this.context;
        const { where, fromEntity } = this.istatement;
        const select = factory.createSelect();
        this.buildGroupByIds(select);
        this.buildSelectBan(select);
        this.buildSelectIds(select, 'json');
        this.buildSelectVallueSum(select);
        let entityTable = this.buildEntityTable(fromEntity);
        select.from(entityTable);
        this.buildSelectFrom(select, fromEntity);
        let wheres = [
            cmpPage,
            this.context.expCmp(where),
        ];
        select.where(new sql_1.ExpAnd(...wheres));
        select.limit(new sql_1.ExpVar('$pageSize'));
        return select;
    }
    buildGroupByIds(select) {
        let expField;
        let idColumn;
        this.idsGroupBy.forEach((v, index) => {
            idColumn = v;
            expField = new sql_1.ExpField('id', idColumn.fromEntity.alias);
            select.column(expField, 'id' + index);
            select.group(expField);
        });
        select.order(expField, this.buildAsc(idColumn));
    }
    buildAsc(idColumn) {
        return idColumn.asc === il_1.EnumAsc.asc ? 'asc' : 'desc';
    }
    buildSelectIds(select, alias) {
        const arr = [
            new sql_1.ExpFunc('JSON_ARRAY', new sql_1.ExpStr('$ids'), ...this.idsGroupBy.map(v => new sql_1.ExpField('id', v.fromEntity.alias))),
        ];
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), alias);
    }
    buildInsertRet() {
        const { factory } = this.context;
        const { intoTables } = this.istatement;
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
        let expId = new sql_1.ExpField('id' + (this.idsGroupBy.length - 1), a);
        select.column(expId);
        select.column(new sql_1.ExpField('ban', a));
        select.column(new sql_1.ExpField('json', a));
        select.column(new sql_1.ExpField('value', a));
        select.order(expId, this.buildAsc(this.idsGroupBy[this.idsGroupBy.length - 1]));
        return insertRet;
    }
    buildFromEntity(sqls) {
        let { ids } = this.istatement;
        for (let idc of ids) {
            const { fromEntity: { bizEntityArr } } = idc;
            // 暂时只生成第一个spec的atom的所有字段
            let [bizEntity] = bizEntityArr;
            if (bizEntity.bizPhraseType === BizPhraseType_1.BizPhraseType.spec) {
                let spec = bizEntity;
                this.buildInsertAtomBuds(sqls, spec.base);
                const buds = [...spec.keys];
                for (let [, bud] of spec.props) {
                    buds.push(bud);
                }
                let mapBuds = this.createMapBuds();
                this.buildMapBuds(mapBuds, buds);
                this.buildInsertBuds(sqls, 'specs', mapBuds);
            }
        }
    }
    buildInsertAtomOfSpec() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        let expBId = new sql_1.ExpField('id', b);
        let expOn;
        if (this.idsGroupBy.length === 1) {
            expOn = new sql_1.ExpEQ(expBId, new sql_1.ExpField('id0', a));
        }
        else {
            let arrExp = [expBId, ...this.idsGroupBy.map((v, index) => new sql_1.ExpField('id' + index, a))];
            expOn = new sql_1.ExpIn(...arrExp);
        }
        select.from(new statementWithFrom_1.VarTable(pageGroupBy, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, b))
            .on(expOn);
        return insert;
    }
    buildInsertSpec() {
        return undefined;
    }
}
exports.BFromGroupByStatement = BFromGroupByStatement;
class BFromGroupByBaseStatement extends BFromGroupByStatement {
    setIds() {
        this.idsAll = this.istatement.ids;
        this.idsGroupBy = [...this.idsAll];
        let idLast = this.idsGroupBy.pop();
        this.idsGroupBy.push({
            asc: idLast.asc,
            fromEntity: idLast.fromEntity.subs[0].fromEntity,
        });
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
        insertSpec.table = new statementWithFrom_1.VarTable('specs');
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
        select.join(il_1.JoinType.join, new statementWithFrom_1.VarTable(intoTables.ret, '$ret'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', '$ret'), new sql_1.ExpField('id', this.idsGroupBy[this.idsGroupBy.length - 1].fromEntity.alias)));
        select.column(new sql_1.ExpField('id', b), 'id');
        select.column(new sql_1.ExpField('id', '$ret'), 'atom');
        select.where(this.context.expCmp(where));
        this.buildSelectBan(select);
        this.buildSelectCols(select, 'json');
        this.buildSelectVallue(select);
        return insertSpec;
    }
}
exports.BFromGroupByBaseStatement = BFromGroupByBaseStatement;
//# sourceMappingURL=from.groupBy.js.map