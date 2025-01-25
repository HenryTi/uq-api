"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatementInQueryId = void 0;
const sql_1 = require("../../../sql");
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
        ids.forEach((v, index) => select.column(v.fromEntity.expIdCol(), 'id' + index));
    }
}
exports.BFromStatementInQueryId = BFromStatementInQueryId;
//# sourceMappingURL=from.inQuery.id.js.map