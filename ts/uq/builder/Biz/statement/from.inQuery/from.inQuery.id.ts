import { BizPhraseType } from "../../../../il/Biz/BizPhraseType";
import { ExpCmp, ExpNum, Select, Statement } from "../../../sql";
// import { buildIdPhraseTable, buildPhraseBudTable, buildSelectIdPhrases, buildSelectIxBuds, buildSelectPhraseBud } from "../../tools";
import { $tblDetail, BFromStatementInQuery } from "./from.inQuery";

export class BFromStatementInQueryId extends BFromStatementInQuery {
    protected setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = [...ids];
        this.idsGroupBy.pop();
        this.showIds = showIds;
    }

    protected get sheetTable(): string {
        const { ids } = this.istatement;
        if (ids[0].fromEntity.bizEntityArr[0].bizPhraseType === BizPhraseType.sheet) {
            return $tblDetail;
        }
    }

    protected override buildFromMain(cmpPage: ExpCmp): Statement[] {
        let tblDetail = this.buildTableDetail();
        let selectDetail = this.buildFromSelectDetail(cmpPage);
        let insertDetail = this.buildInsertDetail();
        let insertIdsTable = this.buildInsertIdsToIdTable();
        let ret = [
            , tblDetail
            , selectDetail
            , insertDetail
            , ...insertIdsTable
        ];
        this.buildInsertSheetToProps(ret);
        return ret;
    }

    protected buildDetailWhere(select: Select, cmpPage: ExpCmp) {
        this.buildWhereWithPage(select, cmpPage);
    }

    protected buildDetailJoinPage(select: Select) {
    }

    protected buildDetailIds(select: Select): void {
        const { ids } = this.istatement;
        select.column(ExpNum.num0, 'mainId');
        // rowId 自动生成
        ids.forEach((v, index) => select.column(v.fromEntity.expIdCol(), 'id' + index));
    }
    /*
        private buildFromSelectPage(cmpPage: ExpCmp): Select {
            const { factory } = this.context;
            const { where, fromEntity } = this.istatement;
            const select = factory.createSelect();
            this.buildGroupByIds(select);
            this.buildSelectBan(select)-;
            this.buildSelectValueSum(select);
            this.buildSelectFrom(select, fromEntity);
            this.buildSelectJoin(select, fromEntity, undefined);
            const cmpEntityBase = this.buildRootEntityCompare(select);
            let wheres: ExpCmp[] = [
                cmpPage,
                this.context.expCmp(where),
            ];
            if (cmpEntityBase !== undefined) wheres.unshift(cmpEntityBase);
            select.where(new ExpAnd(...wheres), EnumExpOP.and);
            select.limit(new ExpVar('$pageSize'));
            return select;
        }
    
        private buildInsertMain() {
            const { factory } = this.context;
            const insertMain = factory.createInsert();
            insertMain.table = new VarTable(tblMain);
            insertMain.cols = [
                { col: 'id', val: undefined },
                { col: 'ban', val: undefined },
                { col: 'json', val: undefined },
                { col: 'value', val: undefined },
            ];
            let select = factory.createSelect();
            insertMain.select = select;
            select.from(new VarTable(pageGroupBy, pageGroupBy));
            select.column(new ExpField('$id', pageGroupBy), 'id');
            select.column(new ExpField('ban', pageGroupBy));
            let arr: ExpVal[] = this.idsGroupBy.map((v, index) => new ExpField('id' + index, pageGroupBy));
            select.column(new ExpFunc('JSON_ARRAY', ...arr), 'json');
            select.column(new ExpField('value', pageGroupBy));
            select.order(new ExpField('$id', pageGroupBy), 'asc');
            // this.buildSelectRetFrom(select, pageGroupBy);
            return insertMain;
        }
    */
}
