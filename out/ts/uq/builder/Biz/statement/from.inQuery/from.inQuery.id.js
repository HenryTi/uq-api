"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatementInQueryId = void 0;
const BizPhraseType_1 = require("../../../../il/Biz/BizPhraseType");
const sql_1 = require("../../../sql");
// import { buildIdPhraseTable, buildPhraseBudTable, buildSelectIdPhrases, buildSelectIxBuds, buildSelectPhraseBud } from "../../tools";
const from_inQuery_1 = require("./from.inQuery");
class BFromStatementInQueryId extends from_inQuery_1.BFromStatementInQuery {
    setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = [...ids];
        this.idsGroupBy.pop();
        this.showIds = showIds;
    }
    get sheetTable() {
        const { ids } = this.istatement;
        if (ids[0].fromEntity.bizEntityArr[0].bizPhraseType === BizPhraseType_1.BizPhraseType.sheet) {
            return from_inQuery_1.$tblDetail;
        }
    }
    buildFromMain(cmpPage) {
        let tblDetail = this.buildTableDetail();
        let selectDetail = this.buildFromSelectDetail(cmpPage);
        let insertDetail = this.buildInsertDetail();
        let insertIdsTable = this.buildInsertIdsToIdTable();
        let ret = [
            ,
            tblDetail,
            selectDetail,
            insertDetail,
            ...insertIdsTable
        ];
        this.buildInsertSheetToProps(ret);
        return ret;
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