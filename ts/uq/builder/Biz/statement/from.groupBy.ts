import { BizBud, BizSpec, EnumAsc, EnumSysTable, FromEntity, FromStatement, IdColumn, JoinType, bigIntField, decField, jsonField, tinyIntField } from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { Sqls } from "../../bstatement";
import { DbContext } from "../../dbContext";
import { ColVal, ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpIn, ExpStr, ExpVal, ExpVar, Select, Statement } from "../../sql";
import { EntityTable, VarTable } from "../../sql/statementWithFrom";
import { BFromStatement } from "./from";

const a = 'a', b = 'b';
const pageGroupBy = '$pageGroupBy';
export class BFromGroupByStatement extends BFromStatement<FromStatement> {
    protected readonly idFromEntity: FromEntity;
    protected idsGroupBy: IdColumn[];
    protected idsAll: IdColumn[];
    constructor(context: DbContext, istatement: FromStatement) {
        super(context, istatement);
        this.setIds();
        const [{ asc, fromEntity }] = this.istatement.ids;
        this.asc = asc;
        this.idFromEntity = fromEntity;
    }

    protected setIds() {
        this.idsAll = this.istatement.ids;
        this.idsGroupBy = this.idsAll;
    }

    protected override buildFromMain(cmpPage: ExpCmp): Statement[] {
        const { factory } = this.context;
        let tblPageGroupBy = this.buildTablePageGroupBy();
        let selectPage = this.buildFromSelectPage(cmpPage);
        let insertPage = factory.createInsert();
        insertPage.select = selectPage;
        insertPage.table = new VarTable(pageGroupBy);
        insertPage.cols = this.buildInsertPageCols();
        let insertRet = this.buildInsertRet();
        let insertAtomOfSpec = this.buildInsertAtomOfSpec();
        let insertSpec = this.buildInsertSpec();
        return [tblPageGroupBy, insertPage, insertRet, insertAtomOfSpec, insertSpec];
    }

    protected buildInsertPageCols(): ColVal[] {
        let ret = this.idsGroupBy.map((v, index) => ({
            col: 'id' + index,
            val: undefined,
        }));
        ret.push({ col: 'ban', val: undefined });
        ret.push({ col: 'json', val: undefined });
        ret.push({ col: 'value', val: undefined });
        return ret;
    }

    private buildTablePageGroupBy() {
        const { factory } = this.context;
        let varTable = factory.createVarTable();
        varTable.name = pageGroupBy;
        let keys = this.buildTablePageKeys();
        varTable.keys = keys;
        const ban = tinyIntField('ban');
        ban.nullable = true;
        const json = jsonField('json');
        json.nullable = true;
        const value = decField('value', 18, 6);
        value.nullable = true;
        varTable.fields = [
            ...keys,
            ban,
            json,
            value,
        ];
        return varTable;
    }

    protected buildTablePageKeys() {
        return this.idsGroupBy.map((v, index) => bigIntField('id' + index));
    }

    private buildFromSelectPage(cmpPage: ExpCmp): Select {
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
        let wheres: ExpCmp[] = [
            cmpPage,
            this.context.expCmp(where),
        ];
        select.where(new ExpAnd(...wheres));
        select.limit(new ExpVar('$pageSize'));
        return select;
    }

    protected buildGroupByIds(select: Select) {
        let expField: ExpField;
        let idColumn: IdColumn;
        this.idsGroupBy.forEach((v, index) => {
            idColumn = v;
            expField = new ExpField('id', idColumn.fromEntity.alias);
            select.column(expField, 'id' + index);
            select.group(expField);
        });
        select.order(expField, this.buildAsc(idColumn));
    }

    private buildAsc(idColumn: IdColumn) {
        return idColumn.asc === EnumAsc.asc ? 'asc' : 'desc';
    }

    protected buildSelectIds(select: Select, alias: string) {
        const arr: ExpVal[] = [
            new ExpFunc('JSON_ARRAY', new ExpStr('$ids'), ...this.idsGroupBy.map(v => new ExpField('id', v.fromEntity.alias))),
        ];
        select.column(new ExpFunc('JSON_ARRAY', ...arr), alias);
    }

    private buildInsertRet() {
        const { factory } = this.context;
        const { intoTables } = this.istatement;
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
        select.from(new VarTable(pageGroupBy, a));
        let expId = new ExpField('id' + (this.idsGroupBy.length - 1), a);
        select.column(expId);
        select.column(new ExpField('ban', a));
        select.column(new ExpField('json', a));
        select.column(new ExpField('value', a));
        select.order(expId, this.buildAsc(this.idsGroupBy[this.idsGroupBy.length - 1]));
        return insertRet;
    }

    protected override buildFromEntity(sqls: Sqls) {
        let { ids } = this.istatement;
        for (let idc of ids) {
            const { fromEntity: { bizEntityArr } } = idc;
            // 暂时只生成第一个spec的atom的所有字段
            let [bizEntity] = bizEntityArr;
            if (bizEntity.bizPhraseType === BizPhraseType.spec) {
                let spec = bizEntity as BizSpec;
                this.buildInsertAtomBuds(sqls, spec.base);

                const buds: BizBud[] = [...spec.keys];
                for (let [, bud] of spec.props) {
                    buds.push(bud);
                }
                let mapBuds = this.createMapBuds();
                this.buildMapBuds(mapBuds, buds);
                this.buildInsertBuds(sqls, 'specs', mapBuds);
            }
        }
    }

    protected buildInsertAtomOfSpec() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        let expBId = new ExpField('id', b);
        let expOn: ExpCmp;
        if (this.idsGroupBy.length === 1) {
            expOn = new ExpEQ(expBId, new ExpField('id0', a));
        }
        else {
            let arrExp: ExpVal[] = [expBId, ...this.idsGroupBy.map((v, index) => new ExpField('id' + index, a))];
            expOn = new ExpIn(...arrExp);
        }
        select.from(new VarTable(pageGroupBy, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, b))
            .on(expOn);
        return insert;
    }

    protected buildInsertSpec(): Statement {
        return undefined;
    }
}

export class BFromGroupByBaseStatement extends BFromGroupByStatement {
    protected setIds() {
        this.idsAll = this.istatement.ids;
        this.idsGroupBy = [...this.idsAll];
        let idLast = this.idsGroupBy.pop();
        this.idsGroupBy.push({
            asc: idLast.asc,
            fromEntity: idLast.fromEntity.subs[0].fromEntity,
        });
    }

    protected buildExpFieldPageId() {
        let { alias: t1 } = this.idsGroupBy[this.idsGroupBy.length - 1].fromEntity;
        return new ExpField('id', t1);
    }

    protected override buildInsertSpec() {
        const { factory } = this.context;
        let memo = factory.createMemo();
        memo.text = 'insert spec';
        const { fromEntity, intoTables, where } = this.istatement;
        let insertSpec = factory.createInsert();
        insertSpec.ignore = true;
        insertSpec.table = new VarTable('specs');
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
        select.join(JoinType.join, new VarTable(intoTables.ret, '$ret'))
            .on(new ExpEQ(new ExpField('id', '$ret'), new ExpField('id', this.idsGroupBy[this.idsGroupBy.length - 1].fromEntity.alias)));
        select.column(new ExpField('id', b), 'id');
        select.column(new ExpField('id', '$ret'), 'atom');
        select.where(this.context.expCmp(where));
        this.buildSelectBan(select);
        this.buildSelectCols(select, 'json');
        this.buildSelectVallue(select);
        return insertSpec;
    }
}
