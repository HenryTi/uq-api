import {
    BizBud, BizFork, EnumAsc, EnumSysTable
    , BizFromEntity, FromStatement, IdColumn, JoinType
    , bigIntField, decField, intField, jsonField, tinyIntField,
    OpAnd
} from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { Sqls } from "../../bstatement";
import { DbContext } from "../../dbContext";
import { ColVal, EnumExpOP, ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpGT, ExpIn, ExpNum, ExpSelect, ExpVal, ExpVar, Select, Statement } from "../../sql";
import { LockType, SelectTable } from "../../sql/select";
import { EntityTable, NameTable, VarTable } from "../../sql/statementWithFrom";
import { BFromStatement } from "./from";
// import { buildIdPhraseTable, buildPhraseBudTable, buildSelectIdPhrases, buildSelectIxBuds, buildSelectPhraseBud } from "../../tools";
import { $idu } from "./biz.select";

const a = 'a', b = 'b', c = 'c';
const tblDetail = 'detail';
const pageGroupBy = '$pageGroupBy';

export class BFromGroupByStatement extends BFromStatement<FromStatement> {
    protected readonly idFromEntity: BizFromEntity;
    protected idsGroupBy: IdColumn[];
    protected showIds: IdColumn[];
    constructor(context: DbContext, istatement: FromStatement) {
        super(context, istatement);
        this.setIds();
        const [{ asc, fromEntity }] = this.istatement.ids;
        this.asc = asc;
        this.idFromEntity = fromEntity;
    }

    foot(sqls: Sqls): void {
        // sqls.push(...buildSelectIxBuds(this.context));
    }

    protected setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = ids;
        this.showIds = showIds;
    }

    protected override buildFromMain(cmpPage: ExpCmp): Statement[] {
        const { factory } = this.context;
        let tblPageGroupBy = this.buildTablePageGroupBy();
        let tblDetail = this.buildTalbeDetail();
        let selectPage = this.buildFromSelectPage(cmpPage);
        let insertPage = factory.createInsert();
        insertPage.select = selectPage;
        insertPage.table = new VarTable(pageGroupBy);
        insertPage.cols = this.buildInsertPageCols();
        let insertRet = this.buildInsertRet();
        // let insertIdsAtoms = this.buildInsertIdsAtoms(pageGroupBy, this.idsGroupBy);
        // let insertIdsForks = this.buildInsertIdsForks(pageGroupBy, this.idsGroupBy);
        let insertIdsTable = this.buildInsertIdsToIdTable(pageGroupBy, this.idsGroupBy);
        let insertGroupDetail = this.buildInsertGroupDetail();
        return [
            tblPageGroupBy, tblDetail, insertPage, insertRet
            , insertIdsTable
            // , insertIdsAtoms, insertIdsForks
            , ...insertGroupDetail
        ];
    }

    protected buildInsertPageCols(): ColVal[] {
        let ret = this.idsGroupBy.map((v, index) => ({
            col: 'id' + index,
            val: undefined,
        }));
        ret.push({ col: 'ban', val: undefined });
        ret.push({ col: 'value', val: undefined });
        return ret;
    }

    private buildTablePageGroupBy() {
        const { factory } = this.context;
        let varTable = factory.createVarTable();
        varTable.name = pageGroupBy;
        const ban = tinyIntField('ban');
        ban.nullable = true;
        const value = decField('value', 18, 6);
        value.nullable = true;
        let idField = intField('$id');
        idField.autoInc = true;
        varTable.keys = [idField];
        varTable.fields = [
            idField,
            ...this.idsGroupBy.map((v, index) => bigIntField('id' + index)),
            ban,
            value,
        ];
        return varTable;
    }

    private buildTalbeDetail() {
        if (this.showIds.length === 0) return;
        const { factory } = this.context;
        let varTable = factory.createVarTable();
        varTable.name = tblDetail;
        let $idField = intField('$id');
        $idField.autoInc = true;
        let idField = bigIntField('id');
        let atomField = bigIntField('atom');
        let banField = tinyIntField('ban');
        let jField = jsonField('json');
        let valueField = decField('value', 18, 6);
        varTable.keys = [$idField];
        varTable.fields = [
            $idField,
            idField,
            atomField,
            banField,
            jField,
            valueField,
            ...this.showIds.map((v, index) => bigIntField('id' + index))
        ];
        return varTable;
    }

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

    protected buildExpCmpBase(fromEntity: BizFromEntity, expField: ExpField) {
        const { bizEntityArr } = fromEntity;
        const { factory } = this.context;
        if (fromEntity.isExtended() === true) {
            let sel = factory.createSelect();
            sel.lock = LockType.none;
            let selectCTE = factory.createSelect();
            selectCTE.lock = LockType.none;
            const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
            sel.cte = { alias: cte, recursive: true, select: selectCTE };
            selectCTE.column(new ExpField('x', s), 'phrase')
            selectCTE.column(new ExpField('i', s), 'i');
            selectCTE.column(new ExpField('x', s), 'x');
            selectCTE.from(new EntityTable(EnumSysTable.ixPhrase, false, s));
            selectCTE.where(new ExpIn(new ExpField('x', s), ...bizEntityArr.map(v => new ExpNum(v.id))));
            let select1 = factory.createSelect();
            select1.lock = LockType.none;
            select1.column(new ExpField('x', r), 'phrase');
            select1.column(new ExpField('i', r));
            select1.column(new ExpField('x', r));
            select1.from(new EntityTable(EnumSysTable.ixPhrase, false, r))
                .join(JoinType.join, new NameTable(cte, r0))
                .on(new ExpEQ(new ExpField('x', r0), new ExpField('i', r)));
            selectCTE.unions = [select1];
            selectCTE.unionsAll = true;
            sel.distinct = true;
            sel.column(new ExpField('phrase', a));
            sel.from(new NameTable(cte, a));
            return new ExpIn(
                expField,
                new ExpSelect(sel),
            );
        }
        if (bizEntityArr.length === 1) {
            return new ExpEQ(expField, new ExpNum(bizEntityArr[0].id));
        }
        return new ExpIn(expField, ...bizEntityArr.map(v => new ExpNum(v.id)));
    }

    private buildRootEntityCompare(select: Select): ExpCmp {
        const { fromEntity } = this.istatement;
        const { bizEntityArr, bizPhraseType, alias } = fromEntity;
        const baseAlias = bizEntityArr.length > 0 ?
            alias + $idu : alias;
        const expBase = new ExpField('base', baseAlias);

        switch (bizPhraseType) {
            default:
                return;
            case BizPhraseType.atom:
                return this.buildExpCmpBase(fromEntity, expBase);
            case BizPhraseType.fork:
                let budAlias = alias + '$bud';
                select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, budAlias))
                    .on(new ExpAnd(
                        new ExpEQ(new ExpField('id', budAlias), expBase),
                        this.buildExpCmpBase(fromEntity, new ExpField('ext', budAlias)),
                    ));
                return;
        }
    }

    protected buildGroupByIds(select: Select) {
        this.idsGroupBy.forEach((v, index) => {
            let idColumn = v;
            let expField = idColumn.fromEntity.expIdCol(); // new ExpField('id', idColumn.fromEntity.alias);
            select.column(expField, 'id' + index);
            select.group(expField);
            select.order(expField, this.buildAsc(idColumn));
        });
    }

    private buildAsc(idColumn: IdColumn) {
        return idColumn.asc === EnumAsc.asc ? 'asc' : 'desc';
    }

    protected buildSelectIds(select: Select, alias: string) {
        const arr: ExpVal[] = this.idsGroupBy.map(v => new ExpField('id', v.fromEntity.alias));
        select.column(new ExpFunc('JSON_ARRAY', ...arr), alias);
    }

    private buildInsertRet() {
        const { factory } = this.context;
        const { intoTables, fromEntity, ids } = this.istatement;
        const insertRet = factory.createInsert();
        insertRet.table = new VarTable(intoTables.ret);
        insertRet.cols = [
            { col: 'id', val: undefined },
            { col: 'ban', val: undefined },
            { col: 'json', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertRet.select = select;
        select.from(new VarTable(pageGroupBy, pageGroupBy));
        select.column(new ExpField('$id', pageGroupBy), 'id');
        select.column(new ExpField('ban', pageGroupBy));
        let arr: ExpVal[] = this.idsGroupBy.map((v, index) => new ExpField('id' + index, pageGroupBy));

        //====
        // 之前注释掉，2025-1-12加回来。好像对于QueryAtom这种简单的单id查询是需要的
        // 第三方物流WMS系统: 查询货品
        // 必须加上这一行，才有
        // arr.push(...this.buildSelectCols());
        this.buildRetSelectCols(arr);
        // 查询货品是单id查询，没有用group by，所以在ret.json里面返回所有列。
        // 多id查询，用到了group by，在ret.json里面不返回所有列，在specs.json里面返回所有列
        //====

        select.column(new ExpFunc('JSON_ARRAY', ...arr), 'json');
        select.column(new ExpField('value', pageGroupBy));
        select.order(new ExpField('$id', pageGroupBy), 'asc');
        this.buildSelectRetFrom(select, pageGroupBy);

        const excludeSub = (sub: BizFromEntity): boolean => {
            return ids.findIndex(v => v.fromEntity === sub) >= 0;
        }
        this.buildSelectJoinSubs(select, fromEntity, undefined); // excludeSub);
        return insertRet;
    }

    private buildSelectRetFrom(select: Select, pageAlias: string) {
        let { length } = this.idsGroupBy;
        for (let i = 0; i < length; i++) {
            let idc = this.idsGroupBy[i];
            const { fromEntity } = idc;
            const { bizEntityTable, alias } = fromEntity;
            select
                .join(JoinType.join, new EntityTable(bizEntityTable, false, alias))
                .on(new ExpEQ(new ExpField('id', alias), new ExpField('id' + i, pageAlias)));
        }
    }

    protected override buildFromEntity(sqls: Sqls) {
        let { ids } = this.istatement;
        for (let idc of ids) {
            const { fromEntity: { bizEntityArr, bizPhraseType } } = idc;
            if (bizPhraseType !== BizPhraseType.fork) continue;
            if (bizEntityArr.length === 0) {
                this.ixValueArr().forEach(([tbl, val]) => {
                    sqls.push(this.buildInsertBud('forks', tbl, undefined, val));
                });
            }
            else {
                // 暂时只生成第一个spec的atom的所有字段
                for (let bizEntity of bizEntityArr) {
                    let fork = bizEntity as BizFork;
                    this.buildInsertAtomBuds(sqls, fork.base);

                    const buds: BizBud[] = [...fork.keys];
                    for (let [, bud] of fork.props) {
                        buds.push(bud);
                    }
                    let mapBuds = this.buildMapBuds(buds);
                    sqls.push(...this.buildInsertBuds('forks', mapBuds));
                }
            }
        }
        this.buildIdsProps(sqls);
    }

    private buildIdsProps(sqls: Sqls) {
        const ids = this.idsGroupBy;
        const { factory } = this.context;
        // sqls.push(buildIdPhraseTable(this.context));
        // sqls.push(buildPhraseBudTable(this.context));
        /*
        let { length } = ids;
        for (let i = 0; i < length; i++) {
            function buildSelectId(select: Select) {
                const s = 's', colI = 'i', s1 = 's1';
                const selectId = factory.createSelect();
                selectId.lock = LockType.none;
                selectId.column(new ExpField('id' + i, s), colI);
                selectId.from(new VarTable(pageGroupBy, s));
                select.from(new SelectTable(selectId, s1));
            }
            sqls.push(...buildSelectIdPhrases(this.context, buildSelectId));
        }
        sqls.push(buildSelectPhraseBud(this.context));
        */
    }

    protected buildInsertIdsToIdTable(tbl: string, ids: IdColumn[]) {
        let insert = this.buildInsertIdTable(ExpNum.num1);
        const { select } = insert;
        let expBId = new ExpField('id', b);
        let expOn: ExpCmp;
        if (this.idsGroupBy.length === 1) {
            expOn = new ExpEQ(expBId, new ExpField('id0', a));
        }
        else {
            let arrExp: ExpVal[] = [expBId, ...ids.map((v, index) => new ExpField('id' + index, a))];
            expOn = new ExpIn(...arrExp);
        }
        select.from(new VarTable(tbl, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, b))
            .on(expOn);
        ;
        return insert;
    }

    protected buildInsertIdsAtoms(tbl: string, ids: IdColumn[]) {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        let expBId = new ExpField('id', b);
        let expOn: ExpCmp;
        if (this.idsGroupBy.length === 1) {
            expOn = new ExpEQ(expBId, new ExpField('id0', a));
        }
        else {
            let arrExp: ExpVal[] = [expBId, ...ids.map((v, index) => new ExpField('id' + index, a))];
            expOn = new ExpIn(...arrExp);
        }
        select.from(new VarTable(tbl, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, b))
            .on(expOn)
            .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('id', b)));
        ;
        return insert;
    }

    protected buildInsertIdsForks(tbl: string, ids: IdColumn[]) {
        const { factory } = this.context;
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTable('forks');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'base', val: undefined },
            { col: 'seed', val: undefined },
        ];
        let select = factory.createSelect();
        insert.select = select;
        select.distinct = true;
        select.column(new ExpField('id', c));
        select.column(new ExpField('base', c));
        select.column(new ExpField('seed', c));

        let expBId = new ExpField('id', c);
        let expOn: ExpCmp;
        if (this.idsGroupBy.length === 1) {
            expOn = new ExpEQ(expBId, new ExpField('id0', a));
        }
        else {
            let arrExp: ExpVal[] = [expBId, ...ids.map((v, index) => new ExpField('id' + index, a))];
            expOn = new ExpIn(...arrExp);
        }
        select.from(new VarTable(tbl, a))
            // .join(JoinType.join, new EntityTable(EnumSysTable.fork, false, b))
            // .on(expOn)
            .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, c))
            .on(expOn)
            // .on(new ExpAnd(new ExpEQ(new ExpField('id', c), new ExpField('base', c))))
            ;
        select.where(new ExpGT(new ExpField('seed', c), ExpNum.num0));
        return insert;
    }
    protected buildInsertGroupDetail(): Statement[] {
        return [];
    }
    protected buildRetSelectCols(arr: ExpVal[]) {
        arr.push(...this.buildSelectCols());
    }
}

export class BFromGroupByBaseStatement extends BFromGroupByStatement {
    protected override buildRetSelectCols(arr: ExpVal[]) { }

    protected setIds() {
        const { ids, showIds } = this.istatement;
        this.idsGroupBy = [...ids];
        this.idsGroupBy.pop();
        this.showIds = showIds;
    }

    protected buildExpFieldPageId() {
        // let { alias: t1 } = this.idsGroupBy[this.idsGroupBy.length - 1].fromEntity;
        // return new ExpField('id', t1);
        let idColumn = this.idsGroupBy[this.idsGroupBy.length - 1];
        let expField = idColumn.fromEntity.expIdCol(); // new ExpField('id', idColumn.fromEntity.alias);
        return expField;
    }

    protected override buildInsertGroupDetail() {
        const { factory } = this.context;
        let memo = factory.createMemo();
        memo.text = 'insert group detail';
        const { ids, fromEntity, intoTables, where } = this.istatement;
        let insertIdTable = factory.createInsert();
        insertIdTable.ignore = true;
        insertIdTable.table = new VarTable(intoTables.details);
        insertIdTable.cols = [
            { col: 'id', val: undefined },
            { col: 'atom', val: undefined },
            { col: 'ban', val: undefined },
            { col: 'json', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertIdTable.select = select;
        select.distinct = true;
        this.buildSelectFrom(select, fromEntity);
        this.buildSelectJoin(select, fromEntity, undefined);
        select.join(JoinType.join, new VarTable(pageGroupBy, '$ret'))
            .on(new ExpAnd(
                ...this.idsGroupBy.map((v, index) => (
                    new ExpEQ(new ExpField('id', v.fromEntity.alias + $idu)
                        , new ExpField('id' + index, '$ret')
                    )))
            ));
        // ids最后一个id，无group by
        const lastIdAlias = ids[ids.length - 1].fromEntity.alias + $idu;
        select.column(new ExpField('id', lastIdAlias), 'id');
        select.column(new ExpField('$id', '$ret'), 'atom');
        select.where(this.context.expCmp(where), EnumExpOP.and);
        this.buildSelectBan(select);
        let arr = this.buildSelectCols();
        select.column(new ExpFunc('JSON_ARRAY', ...arr), 'json');
        this.buildSelectValue(select);

        if (this.showIds.length === 0) {
            insertIdTable.table = new VarTable(intoTables.details);
            return [insertIdTable];
        }
        else {
            insertIdTable.table = new VarTable(tblDetail);
            insertIdTable.cols.push(...this.showIds.map((v, index) => ({ col: 'id' + index, val: undefined })));
            for (let id of this.showIds) {
                select.column(new ExpField('id', id.fromEntity.alias));
            }
            return [memo, insertIdTable, ...this.buildFromDetailToIds()];
        }
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
}
