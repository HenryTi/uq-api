"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatementInQueryIds = void 0;
const il_1 = require("../../../../il");
const sql_1 = require("../../../sql");
const statementWithFrom_1 = require("../../../sql/statementWithFrom");
// import { buildIdPhraseTable, buildPhraseBudTable, buildSelectIdPhrases, buildSelectIxBuds, buildSelectPhraseBud } from "../../tools";
const biz_select_1 = require("../biz.select");
const from_inQuery_1 = require("./from.inQuery");
const a = 'a', b = 'b', c = 'c';
const tblDetail = 'detail';
const pageGroupBy = '$pageGroupBy';
class BFromStatementInQueryIds extends from_inQuery_1.BFromStatementInQuery {
    buildFromMain(cmpPage) {
        let tblPageGroupBy = this.buildTablePage();
        let tblDetail = this.buildTableDetail();
        let selectPage = this.buildFromSelectPage(cmpPage);
        let selectDetail = this.buildFromSelectDetail(cmpPage);
        let insertMain = this.buildInsertMain();
        let insertDetail = this.buildInsertDetail();
        // let insertIdsAtoms = this.buildInsertIdsAtoms(pageGroupBy, this.idsGroupBy);
        // let insertIdsForks = this.buildInsertIdsForks(pageGroupBy, this.idsGroupBy);
        let insertIdsTable = this.buildInsertIdsToIdTable();
        return [
            tblPageGroupBy, tblDetail, selectPage, selectDetail,
            insertMain,
            insertDetail,
            ...insertIdsTable
            // , insertIdsAtoms, insertIdsForks
        ];
    }
    buildRetSelectCols(arr) { }
    setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = [...ids];
        this.idsGroupBy.pop();
        this.showIds = showIds;
    }
    buildFromSelectPage(cmpPage) {
        const { factory } = this.context;
        const { where, fromEntity } = this.istatement;
        const select = factory.createSelect();
        let insertPage = factory.createInsert();
        insertPage.select = select;
        insertPage.table = new statementWithFrom_1.VarTable(pageGroupBy);
        insertPage.cols = this.buildInsertPageCols();
        this.buildGroupByIds(select);
        this.buildSelectBan(select);
        this.buildSelectValueSum(select);
        this.buildSelectFrom(select, fromEntity);
        this.buildSelectJoin(select, fromEntity, undefined);
        const cmpEntityBase = this.buildRootEntityCompare(select);
        let wheres = [
            cmpPage,
            this.context.expCmp(where),
        ];
        if (cmpEntityBase !== undefined)
            wheres.unshift(cmpEntityBase);
        select.where(new sql_1.ExpAnd(...wheres), sql_1.EnumExpOP.and);
        select.limit(new sql_1.ExpVar('$pageSize'));
        return insertPage;
    }
    buildDetailJoinPage(select) {
        select.join(il_1.JoinType.join, new statementWithFrom_1.VarTable(pageGroupBy, '$ret'))
            .on(new sql_1.ExpAnd(...this.idsGroupBy.map((v, index) => {
            let expField = v.fromEntity.expIdCol();
            return new sql_1.ExpEQ(expField, new sql_1.ExpField('id' + index, '$ret'));
        })));
    }
    buildDetailWhere(select, cmpPage) {
        this.buildWhereWithoutPage(select);
    }
    buildDetailIds(select) {
        const { ids } = this.istatement;
        select.column(new sql_1.ExpField('$id', '$ret'), 'mainId');
        // rowId 自动生成
        this.idsGroupBy.forEach((v, index) => {
            select.column(new sql_1.ExpField('id' + index, '$ret'));
        });
        select.column(ids[ids.length - 1].fromEntity.expIdCol());
    }
    buildInsertMain() {
        const p = 'p';
        const { factory } = this.context;
        const insertMain = factory.createInsert();
        insertMain.table = new statementWithFrom_1.VarTable(from_inQuery_1.tblMain);
        insertMain.cols = [
            { col: 'rowId', val: undefined },
            { col: 'ban', val: undefined },
            { col: 'ids', val: undefined },
            { col: 'values', val: undefined },
        ];
        let select = factory.createSelect();
        insertMain.select = select;
        select.from(new statementWithFrom_1.VarTable(pageGroupBy, p));
        select.column(new sql_1.ExpField('$id', p), 'id');
        select.column(new sql_1.ExpField('ban', p));
        let arr = this.idsGroupBy.map((v, index) => new sql_1.ExpField('id' + index, p));
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), 'ids');
        select.column(new sql_1.ExpFunc('JSON_ARRAY', new sql_1.ExpField('value', p)), 'values');
        select.order(new sql_1.ExpField('$id', p), 'asc');
        // this.buildSelectRetFrom(select, pageGroupBy);
        return insertMain;
    }
    buildExpFieldPageId() {
        // let { alias: t1 } = this.idsGroupBy[this.idsGroupBy.length - 1].fromEntity;
        // return new ExpField('id', t1);
        let idColumn = this.idsGroupBy[this.idsGroupBy.length - 1];
        let expField = idColumn.fromEntity.expIdCol(); // new ExpField('id', idColumn.fromEntity.alias);
        return expField;
    }
    buildFromDetailToIds() {
        const { factory } = this.context;
        const { intoTables } = this.istatement;
        let ret = [];
        let insertSpec = factory.createInsert();
        ret.push(insertSpec);
        insertSpec.ignore = true;
        insertSpec.table = new statementWithFrom_1.VarTable(intoTables.details);
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
        ret.push(this.buildInsertIdsForks(tblDetail, this.showIds));
        return ret;
    }
    buildSelectCols() {
        let arr = super.buildSelectCols();
        if (this.showIds.length > 0) {
            arr.push(new sql_1.ExpFunc('JSON_ARRAY', sql_1.ExpNum.num0, ...this.showIds.map((v, index) => new sql_1.ExpField('id', v.fromEntity.alias + biz_select_1.$idu))));
        }
        return arr;
    }
}
exports.BFromStatementInQueryIds = BFromStatementInQueryIds;
//# sourceMappingURL=from.inQuery.ids.js.map