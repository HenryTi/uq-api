"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatementInQuery = exports.pageGroupBy = exports.$tblDetail = exports.tblDetail = exports.tblMain = void 0;
const il_1 = require("../../../../il");
const BizPhraseType_1 = require("../../../../il/Biz/BizPhraseType");
const sql_1 = require("../../../sql");
const select_1 = require("../../../sql/select");
const statementWithFrom_1 = require("../../../sql/statementWithFrom");
const from_1 = require("../from");
const biz_select_1 = require("../biz.select");
exports.tblMain = 'main';
exports.tblDetail = 'detail';
exports.$tblDetail = '$detail';
exports.pageGroupBy = '$pageGroupBy';
const a = 'a', b = 'b', c = 'c';
class BFromStatementInQuery extends from_1.BFromStatement {
    constructor(context, istatement) {
        super(context, istatement);
        this.setIds();
        const [{ asc, fromEntity }] = this.istatement.ids;
        this.asc = asc;
        this.idFromEntity = fromEntity;
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
    buildTablePage() {
        const { factory } = this.context;
        let varTable = factory.createVarTable();
        varTable.name = exports.pageGroupBy;
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
    buildTableDetail() {
        const { factory } = this.context;
        const { ids, cols } = this.istatement;
        let varTable = factory.createVarTable();
        varTable.name = exports.$tblDetail;
        let mainField = (0, il_1.intField)('$main');
        let $idField = (0, il_1.intField)('$id');
        $idField.autoInc = true;
        // let idField = bigIntField('id');
        let banField = (0, il_1.tinyIntField)('ban');
        let valueField = (0, il_1.decField)('value', 18, 6);
        valueField.nullable = true;
        varTable.keys = [mainField, $idField];
        varTable.fields = [
            mainField,
            $idField,
            (0, il_1.bigIntField)('id' + (ids.length - 1)),
            banField,
            valueField,
            ...cols.map(v => { let f = (0, il_1.charField)(String(v.bud.id), 200); f.nullable = true; return f; }),
        ];
        return varTable;
    }
    buildWhereWithPage(select, cmpPage) {
        const { where } = this.istatement;
        const cmpEntityBase = this.buildRootEntityCompare(select);
        let wheres = [
            cmpPage,
            this.context.expCmp(where),
        ];
        if (cmpEntityBase !== undefined)
            wheres.unshift(cmpEntityBase);
        select.where(new sql_1.ExpAnd(...wheres), sql_1.EnumExpOP.and);
        select.limit(new sql_1.ExpVar('$pageSize'));
    }
    buildWhereWithoutPage(select) {
        const { where } = this.istatement;
        const cmpEntityBase = this.buildRootEntityCompare(select);
        let wheres = [
            this.context.expCmp(where),
        ];
        if (cmpEntityBase !== undefined)
            wheres.unshift(cmpEntityBase);
        select.where(new sql_1.ExpAnd(...wheres), sql_1.EnumExpOP.and);
    }
    buildFromSelectDetail(cmpPage) {
        const { factory } = this.context;
        const { ids, cols, fromEntity, where } = this.istatement;
        let insertIdTable = factory.createInsert();
        insertIdTable.ignore = true;
        insertIdTable.table = new statementWithFrom_1.VarTable(exports.$tblDetail);
        insertIdTable.cols = [
            { col: '$main', val: undefined },
            // { col: '$id', val: undefined },
            ...ids.map((v, index) => ({ col: 'id' + index, val: undefined })),
            { col: 'ban', val: undefined },
            { col: 'value', val: undefined },
            ...cols.map(v => ({ col: String(v.bud.id), val: undefined })),
        ];
        let select = factory.createSelect();
        insertIdTable.select = select;
        select.distinct = true;
        this.buildSelectFrom(select, fromEntity);
        this.buildSelectJoin(select, fromEntity, undefined);
        this.buildDetailWhere(select, cmpPage);
        this.buildDetailJoinPage(select);
        // select.where(this.context.expCmp(where), EnumExpOP.and);
        // ids最后一个id，无group by
        //const lastIdAlias = ids[ids.length - 1].fromEntity.alias + $idu;
        this.buildDetailIds(select);
        /*
        select.column(new ExpField('$id', '$ret'), 'mainId');
        //select.column(new ExpField('id', lastIdAlias), 'rowId');
        this.idsGroupBy.forEach((v, index) => {
            select.column(new ExpField('id' + index, '$ret'));
        })
        select.column(ids[ids.length - 1].fromEntity.expIdCol());
        */
        this.buildSelectBan(select);
        this.buildSelectValue(select);
        // let arr = this.buildCols();
        // arr.forEach(v => select.column(v, String(v.)));
        cols.forEach(col => {
            const { name, val, bud } = col;
            // let expBud: ExpVal;
            let alias = (bud !== undefined) ? String(bud.id) : name;
            let expVal = this.context.expVal(val);
            select.column(expVal, alias);
        });
        return insertIdTable;
    }
    /*
    private buildCols() {
        const { cols } = this.istatement;
        const arr: ExpVal[] = cols.map(col => {
            const { name, val, bud } = col;
            let expBud: ExpVal;
            if (bud !== undefined) expBud = new ExpNum(bud.id);
            else expBud = new ExpStr(name);
            return this.context.expVal(val as ValueExpression);
        });
        return arr;
    }
    */
    buildInsertDetail() {
        const { factory } = this.context;
        let memo = factory.createMemo();
        memo.text = 'insert group detail';
        const { ids, cols } = this.istatement;
        let insertIdTable = factory.createInsert();
        insertIdTable.ignore = true;
        insertIdTable.table = new statementWithFrom_1.VarTable(exports.tblDetail);
        insertIdTable.cols = [
            { col: 'mainId', val: undefined },
            { col: 'rowId', val: undefined },
            { col: 'ban', val: undefined },
            { col: 'ids', val: undefined },
            { col: 'values', val: undefined },
            { col: 'cols', val: undefined },
        ];
        let select = factory.createSelect();
        insertIdTable.select = select;
        select.distinct = true;
        select.from(new statementWithFrom_1.VarTable(exports.$tblDetail, a));
        select.col('$main', 'mainId', a);
        select.col('$id', 'rowId', a);
        select.col('ban', undefined, a);
        select.column(new sql_1.ExpFunc('JSON_ARRAY', new sql_1.ExpField('id' + (ids.length - 1), a)));
        select.column(new sql_1.ExpFunc('JSON_ARRAY', new sql_1.ExpField('value', a)), 'values');
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...cols.map(v => {
            const { id } = v.bud;
            return new sql_1.ExpFunc('JSON_ARRAY', new sql_1.ExpNum(id), new sql_1.ExpField(String(id), a));
        })), 'cols');
        select.order(new sql_1.ExpField('$main', a), 'asc');
        select.order(new sql_1.ExpField('$id', a), 'asc');
        return insertIdTable;
    }
    buildExpCmpBase(fromEntity, expField) {
        const { bizEntityArr } = fromEntity;
        const { factory } = this.context;
        if (fromEntity.isExtended() === true) {
            let sel = factory.createSelect();
            sel.lock = select_1.LockType.none;
            let selectCTE = factory.createSelect();
            selectCTE.lock = select_1.LockType.none;
            const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
            sel.cte = { alias: cte, recursive: true, select: selectCTE };
            selectCTE.column(new sql_1.ExpField('x', s), 'phrase');
            selectCTE.column(new sql_1.ExpField('i', s), 'i');
            selectCTE.column(new sql_1.ExpField('x', s), 'x');
            selectCTE.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixPhrase, false, s));
            selectCTE.where(new sql_1.ExpIn(new sql_1.ExpField('x', s), ...bizEntityArr.map(v => new sql_1.ExpNum(v.id))));
            let select1 = factory.createSelect();
            select1.lock = select_1.LockType.none;
            select1.column(new sql_1.ExpField('x', r), 'phrase');
            select1.column(new sql_1.ExpField('i', r));
            select1.column(new sql_1.ExpField('x', r));
            select1.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixPhrase, false, r))
                .join(il_1.JoinType.join, new statementWithFrom_1.NameTable(cte, r0))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('x', r0), new sql_1.ExpField('i', r)));
            selectCTE.unions = [select1];
            selectCTE.unionsAll = true;
            sel.distinct = true;
            sel.column(new sql_1.ExpField('phrase', a));
            sel.from(new statementWithFrom_1.NameTable(cte, a));
            return new sql_1.ExpIn(expField, new sql_1.ExpSelect(sel));
        }
        if (bizEntityArr.length === 1) {
            return new sql_1.ExpEQ(expField, new sql_1.ExpNum(bizEntityArr[0].id));
        }
        return new sql_1.ExpIn(expField, ...bizEntityArr.map(v => new sql_1.ExpNum(v.id)));
    }
    buildRootEntityCompare(select) {
        const { fromEntity } = this.istatement;
        const { bizEntityArr, bizPhraseType, alias } = fromEntity;
        const baseAlias = bizEntityArr.length > 0 ?
            alias + biz_select_1.$idu : alias;
        const expBase = new sql_1.ExpField('base', baseAlias);
        switch (bizPhraseType) {
            default:
                return;
            case BizPhraseType_1.BizPhraseType.atom:
                return this.buildExpCmpBase(fromEntity, expBase);
            case BizPhraseType_1.BizPhraseType.fork:
                let budAlias = alias + '$bud';
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, budAlias))
                    .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', budAlias), expBase), this.buildExpCmpBase(fromEntity, new sql_1.ExpField('ext', budAlias))));
                return;
        }
    }
    buildGroupByIds(select) {
        this.idsGroupBy.forEach((v, index) => {
            let idColumn = v;
            let expField = idColumn.fromEntity.expIdCol(); // new ExpField('id', idColumn.fromEntity.alias);
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
    /*
    protected buildInsertMain() {
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
    */
    buildSelectRetFrom(select, pageAlias) {
        let { length } = this.idsGroupBy;
        for (let i = 0; i < length; i++) {
            let idc = this.idsGroupBy[i];
            const { fromEntity } = idc;
            const { bizEntityTable, alias } = fromEntity;
            select
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(bizEntityTable, false, alias))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', alias), new sql_1.ExpField('id' + i, pageAlias)));
        }
    }
    buildFromEntity(sqls) {
        let { ids } = this.istatement;
        for (let idc of ids) {
            const { fromEntity: { bizEntityArr, bizPhraseType } } = idc;
            if (bizPhraseType !== BizPhraseType_1.BizPhraseType.fork)
                continue;
            if (bizEntityArr.length === 0) {
                this.ixValueArr().forEach(([tbl, val]) => {
                    sqls.push(this.buildInsertBud('forks', tbl, undefined, val));
                });
            }
            else {
                // 暂时只生成第一个spec的atom的所有字段
                for (let bizEntity of bizEntityArr) {
                    let fork = bizEntity;
                    this.buildInsertAtomBuds(sqls, fork.base);
                    const buds = [...fork.keys];
                    for (let [, bud] of fork.props) {
                        buds.push(bud);
                    }
                    let mapBuds = this.buildMapBuds(buds);
                    sqls.push(...this.buildInsertBuds('forks', mapBuds));
                }
            }
        }
        // this.buildIdsProps(sqls);
    }
    buildIdsProps(sqls) {
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
    buildInsertIdsToIdTable() {
        return this.istatement.ids.map((v, index) => {
            return this.buildInsertIdToIdTable(index);
        });
    }
    buildInsertIdToIdTable(idIndex) {
        let insert = this.buildInsertIdTable(sql_1.ExpNum.num1);
        const { select } = insert;
        select.from(new statementWithFrom_1.VarTable(exports.$tblDetail, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('id' + idIndex, a)));
        return insert;
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
            .on(expOn)
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('id', b)));
        ;
        return insert;
    }
    buildInsertIdsForks(tbl, ids) {
        const { factory } = this.context;
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable('forks');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'base', val: undefined },
            { col: 'seed', val: undefined },
        ];
        let select = factory.createSelect();
        insert.select = select;
        select.distinct = true;
        select.column(new sql_1.ExpField('id', c));
        select.column(new sql_1.ExpField('base', c));
        select.column(new sql_1.ExpField('seed', c));
        let expBId = new sql_1.ExpField('id', c);
        let expOn;
        if (this.idsGroupBy.length === 1) {
            expOn = new sql_1.ExpEQ(expBId, new sql_1.ExpField('id0', a));
        }
        else {
            let arrExp = [expBId, ...ids.map((v, index) => new sql_1.ExpField('id' + index, a))];
            expOn = new sql_1.ExpIn(...arrExp);
        }
        select.from(new statementWithFrom_1.VarTable(tbl, a))
            // .join(JoinType.join, new EntityTable(EnumSysTable.fork, false, b))
            // .on(expOn)
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, c))
            .on(expOn);
        select.where(new sql_1.ExpGT(new sql_1.ExpField('seed', c), sql_1.ExpNum.num0));
        return insert;
    }
    buildRetSelectCols(arr) {
        arr.push(...this.buildSelectCols());
    }
}
exports.BFromStatementInQuery = BFromStatementInQuery;
//# sourceMappingURL=from.inQuery.js.map