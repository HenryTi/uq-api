"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatementInQueryId = void 0;
const sql_1 = require("../../../sql");
const statementWithFrom_1 = require("../../../sql/statementWithFrom");
// import { buildIdPhraseTable, buildPhraseBudTable, buildSelectIdPhrases, buildSelectIxBuds, buildSelectPhraseBud } from "../../tools";
const from_inQuery_1 = require("./from.inQuery");
class BFromStatementInQueryId extends from_inQuery_1.BFromStatementInQuery {
    setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = ids;
        this.showIds = showIds;
    }
    buildFromMain(cmpPage) {
        const { factory } = this.context;
        // let tblPageGroupBy = this.buildTablePage();
        // let tblDetail = this.buildTalbeDetail();
        // let selectPage = this.buildFromSelectPage(cmpPage);
        // let insertPage = factory.createInsert();
        // insertPage.select = selectPage;
        // insertPage.table = new VarTable(pageGroupBy);
        // insertPage.cols = this.buildInsertPageCols();
        // let insertMain = this.buildInsertMain();
        // let insertIdsAtoms = this.buildInsertIdsAtoms(pageGroupBy, this.idsGroupBy);
        // let insertIdsForks = this.buildInsertIdsForks(pageGroupBy, this.idsGroupBy);
        // let insertGroupDetail = this.buildInsertGroupDetail();
        // let insertIdsTable = this.buildInsertIdsToIdTable();
        /*
        return [
            tblPageGroupBy
            , insertPage, insertMain
            , ...insertIdsTable
            // , insertIdsAtoms, insertIdsForks
            // , ...insertGroupDetail
        ];
        */
        // let tblPageGroupBy = this.buildTablePage();
        let tblDetail = this.buildTableDetail();
        // let selectPage = this.buildFromSelectPage(cmpPage);
        let selectDetail = this.buildFromSelectDetail(cmpPage);
        // let insertMain = this.buildInsertMain();
        let insertDetail = this.buildInsertDetail();
        // let insertIdsAtoms = this.buildInsertIdsAtoms(pageGroupBy, this.idsGroupBy);
        // let insertIdsForks = this.buildInsertIdsForks(pageGroupBy, this.idsGroupBy);
        let insertIdsTable = this.buildInsertIdsToIdTable();
        return [
            // tblPageGroupBy
            ,
            tblDetail
            // , selectPage
            ,
            selectDetail
            // , insertMain
            ,
            insertDetail,
            ...insertIdsTable
            // , insertIdsAtoms, insertIdsForks
        ];
    }
    buildDetailWhere(select, cmpPage) {
        this.buildWhereWithPage(select, cmpPage);
    }
    buildDetailJoinPage(select) {
    }
    buildDetailIds(select) {
        const { ids } = this.istatement;
        select.column(sql_1.ExpNum.num0, 'mainId');
        // rowId 自动生成
        ids.forEach((v, index) => v.fromEntity.expIdCol());
    }
    buildFromSelectPage(cmpPage) {
        const { factory } = this.context;
        const { where, fromEntity } = this.istatement;
        const select = factory.createSelect();
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
        return select;
    }
    buildInsertMain() {
        const { factory } = this.context;
        const insertMain = factory.createInsert();
        insertMain.table = new statementWithFrom_1.VarTable(from_inQuery_1.tblMain);
        insertMain.cols = [
            { col: 'id', val: undefined },
            { col: 'ban', val: undefined },
            { col: 'json', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertMain.select = select;
        select.from(new statementWithFrom_1.VarTable(from_inQuery_1.pageGroupBy, from_inQuery_1.pageGroupBy));
        select.column(new sql_1.ExpField('$id', from_inQuery_1.pageGroupBy), 'id');
        select.column(new sql_1.ExpField('ban', from_inQuery_1.pageGroupBy));
        let arr = this.idsGroupBy.map((v, index) => new sql_1.ExpField('id' + index, from_inQuery_1.pageGroupBy));
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), 'json');
        select.column(new sql_1.ExpField('value', from_inQuery_1.pageGroupBy));
        select.order(new sql_1.ExpField('$id', from_inQuery_1.pageGroupBy), 'asc');
        // this.buildSelectRetFrom(select, pageGroupBy);
        return insertMain;
    }
}
exports.BFromStatementInQueryId = BFromStatementInQueryId;
//# sourceMappingURL=from.inQuery.id.js.map