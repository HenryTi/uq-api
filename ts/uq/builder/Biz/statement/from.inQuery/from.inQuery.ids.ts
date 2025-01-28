import { JoinType } from "../../../../il";
import { BizPhraseType } from "../../../../il/Biz/BizPhraseType";
import {
    EnumExpOP, ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc,
    ExpVal, ExpVar, Select, Statement
} from "../../../sql";
import { VarTable } from "../../../sql/statementWithFrom";
import { BFromStatementInQuery, tblMain } from "./from.inQuery";

const pageGroupBy = '$pageGroupBy';

export class BFromStatementInQueryIds extends BFromStatementInQuery {
    protected override buildFromMain(cmpPage: ExpCmp): Statement[] {
        let tblPageGroupBy = this.buildTablePage();
        let tblDetail = this.buildTableDetail();
        let selectPage = this.buildFromSelectPage(cmpPage);
        let selectDetail = this.buildFromSelectDetail(cmpPage);
        let insertMain = this.buildInsertMain();
        let insertDetail = this.buildInsertDetail();
        let insertIdsTable = this.buildInsertIdsToIdTable();
        let ret = [
            tblPageGroupBy, tblDetail, selectPage, selectDetail
            , insertMain
            , insertDetail
            , ...insertIdsTable
        ];
        this.buildInsertSheetToProps(ret);
        return ret;
    }

    protected override buildRetSelectCols(arr: ExpVal[]) { }

    protected setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = [...ids];
        this.idsGroupBy.pop();
        this.showIds = showIds;
    }

    protected get sheetTable(): string {
        const { fromEntity } = this.istatement;
        if (fromEntity.bizEntityArr[0].bizPhraseType === BizPhraseType.sheet) {
            return pageGroupBy;
        }
    }

    private buildFromSelectPage(cmpPage: ExpCmp) {
        const { factory } = this.context;
        const { where, fromEntity } = this.istatement;
        const select = factory.createSelect();
        let insertPage = factory.createInsert();
        insertPage.select = select;
        insertPage.table = new VarTable(pageGroupBy);
        insertPage.cols = this.buildInsertPageCols();
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
        return insertPage;
    }

    protected buildDetailJoinPage(select: Select) {
        select.join(JoinType.join, new VarTable(pageGroupBy, '$ret'))
            .on(new ExpAnd(
                ...this.idsGroupBy.map((v, index) => {
                    let expField = v.fromEntity.expIdCol();
                    return new ExpEQ(expField, new ExpField('id' + index, '$ret'));
                })
            ));
    }

    protected buildDetailWhere(select: Select, cmpPage: ExpCmp) {
        this.buildWhereWithoutPage(select);
    }

    // query branch
    protected buildDetailIds(select: Select): void {
        const { ids } = this.istatement;
        select.column(new ExpField('$id', '$ret'), 'mainId');
        // rowId 自动生成
        /*
        this.idsGroupBy.forEach((v, index) => {
            select.column(new ExpField('id' + index, '$ret'));
        });
        */
        select.column(ids[ids.length - 1].fromEntity.expIdCol());
    }

    private buildInsertMain() {
        const p = 'p';
        const { factory } = this.context;
        const insertMain = factory.createInsert();
        insertMain.table = new VarTable(tblMain);
        insertMain.cols = [
            { col: 'rowId', val: undefined },
            { col: 'ban', val: undefined },
            { col: 'ids', val: undefined },
            { col: 'values', val: undefined },
        ];
        let select = factory.createSelect();
        insertMain.select = select;
        select.from(new VarTable(pageGroupBy, p));
        select.column(new ExpField('$id', p), 'id');
        select.column(new ExpField('ban', p));
        let arr: ExpVal[] = this.idsGroupBy.map((v, index) => new ExpField('id' + index, p));
        select.column(new ExpFunc('JSON_ARRAY', ...arr), 'ids');
        select.column(new ExpFunc('JSON_ARRAY', new ExpField('value', p)), 'values');
        select.order(new ExpField('$id', p), 'asc');
        // this.buildSelectRetFrom(select, pageGroupBy);
        return insertMain;
    }
    /*
        protected buildExpFieldPageId() {
            // let { alias: t1 } = this.idsGroupBy[this.idsGroupBy.length - 1].fromEntity;
            // return new ExpField('id', t1);
            let idColumn = this.idsGroupBy[this.idsGroupBy.length - 1];
            let expField = idColumn.fromEntity.expIdCol(); // new ExpField('id', idColumn.fromEntity.alias);
            return expField;
        }
    
        private buildFromDetailToIds(): Statement[] {
            const { factory } = this.context;
            const { intoTables } = this.istatement;
            let ret: Statement[] = [];
            let insertSpec = factory.createInsert();
            ret.push(insertSpec);
            insertSpec.ignore = true;
            insertSpec.table = new VarTable(intoTables.details);
            insertSpec.cols = [
                { col: 'id', val: undefined },
                { col: 'atom', val: undefined },
                { col: 'ban', val: undefined },
                { col: 'json', val: undefined },
                { col: 'value', val: undefined },
            ];
            let select = factory.createSelect();
            insertSpec.select = select;
            select.from(new VarTable(tblDetail, a));
            select.column(new ExpField('id', a));
            select.column(new ExpField('atom', a));
            select.column(new ExpField('ban', a));
            select.column(new ExpField('json', a));
            select.column(new ExpField('value', a));
    
            ret.push(this.buildInsertIdsAtoms(tblDetail, this.showIds));
            ret.push(this.buildInsertIdsForks(tblDetail, this.showIds));
            return ret;
        }
    
        protected buildSelectCols() {
            let arr = super.buildSelectCols();
            if (this.showIds.length > 0) {
                arr.push(new ExpFunc('JSON_ARRAY'
                    , ExpNum.num0,
                    ...this.showIds.map((v, index) => new ExpField('id', v.fromEntity.alias + $idu))
                ));
            }
            return arr;
        }
    */
}
