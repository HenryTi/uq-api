import { EnumExpOP, ExpAnd, ExpCmp, ExpField, ExpFunc, ExpNum, ExpVal, ExpVar, Select, Statement } from "../../../sql";
import { VarTable } from "../../../sql/statementWithFrom";
// import { buildIdPhraseTable, buildPhraseBudTable, buildSelectIdPhrases, buildSelectIxBuds, buildSelectPhraseBud } from "../../tools";
import { BFromStatementInQuery, pageGroupBy, tblMain } from "./from.inQuery";

export class BFromStatementInQueryId extends BFromStatementInQuery {
    protected setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = ids;
        this.showIds = showIds;
    }

    protected override buildFromMain(cmpPage: ExpCmp): Statement[] {
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
            , tblDetail
            // , selectPage
            , selectDetail
            // , insertMain
            , insertDetail
            , ...insertIdsTable
            // , insertIdsAtoms, insertIdsForks
        ];
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
        ids.forEach((v, index) => v.fromEntity.expIdCol());
    }
    /*
        private buildFromSelectPage(cmpPage: ExpCmp): Select {
            const { factory } = this.context;
            const { where, fromEntity } = this.istatement;
            const select = factory.createSelect();
            this.buildGroupByIds(select);
            this.buildSelectBan(select);
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
