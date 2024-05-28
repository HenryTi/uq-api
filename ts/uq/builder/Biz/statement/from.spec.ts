import { BizBud, BizSpec, EnumSysTable, FromStatement, JoinType } from "../../../il";
import { Sqls } from "../../bstatement";
import { ExpAnd, ExpCmp, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpNum, ExpVal, ExpVar, Select } from "../../sql";
import { EntityTable, VarTable } from "../../sql/statementWithFrom";
import { BFromStatement, BudsValue } from "./from.atom";

const a = 'a', b = 'b';
export class BFromSpecStatement extends BFromStatement<FromStatement> {
    protected override buildFromMain(cmpPage: ExpCmp) {
        const { factory } = this.context;
        const { intoTables } = this.istatement;
        let selectPage = this.buildFromSelectPage(cmpPage);
        if (intoTables !== undefined) {
            let insertPage = factory.createInsert();
            insertPage.select = selectPage;
            insertPage.table = new VarTable(intoTables.ret);
            insertPage.cols = [
                { col: 'id', val: undefined },
                { col: 'ban', val: undefined },
                // { col: 'json', val: undefined },
            ];
            let insertSpec = this.buildInsertSpec();
            return [insertPage, insertSpec];
        }
        else {
            return [selectPage];
        }
    }

    private buildFromSelectPage(cmpPage: ExpCmp): Select {
        let select = this.buildSelect(cmpPage);
        return select;
    }

    protected buildSelect(cmpPage: ExpCmp) {
        const { factory } = this.context;
        const { asc, where, fromEntity, idFromEntity } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        const select = factory.createSelect();
        const specBase = '$specBase';
        const specBud = '$specBud';
        select.column(new ExpField('id', specBase), 'id');
        select.column(ExpNum.num0, 'ban');
        select.from(new EntityTable(bizEntityTable, false, t0));
        this.buildSelectFrom(select, fromEntity);
        select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, specBud))
            .on(new ExpEQ(new ExpField('id', specBud), new ExpField('base', idFromEntity.alias)))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, specBase))
            .on(new ExpEQ(new ExpField('id', specBase), new ExpField('base', specBud)));
        let wheres: ExpCmp[] = [
            cmpPage,
            this.context.expCmp(where),
        ];
        select.where(new ExpAnd(...wheres));
        select.group(new ExpField('id', specBase));
        select.order(new ExpField('id', specBase), asc);
        select.limit(new ExpVar('$pageSize'));
        return select;
    }

    protected override buildFromEntity(sqls: Sqls) {
        let { bizEntityArr } = this.istatement.idFromEntity;
        let entityArr: BizSpec[] = bizEntityArr as BizSpec[];

        let insertAtomOfSpec = this.buildInsertAtomOfSpec();
        sqls.push(insertAtomOfSpec);

        // 暂时只生成第一个spec的atom的所有字段
        let [spec] = entityArr;
        this.buildInsertAtomBuds(sqls, spec.base);

        for (let spec of entityArr) {
            const buds: BizBud[] = [...spec.keys];
            for (let [, bud] of spec.props) {
                buds.push(bud);
            }
            let mapBuds = this.createMapBuds();
            this.buildMapBuds(mapBuds, buds);
            this.buildInsertBuds(sqls, 'specs', mapBuds);
        }
    }

    protected buildInsertAtomOfSpec() {
        const { intoTables } = this.istatement;
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new VarTable(intoTables.ret, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('id', a)));
        return insert;
    }

    private buildInsertSpec() {
        const { fromEntity, intoTables, idFromEntity, where } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        const { factory } = this.context;
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
        select.from(new EntityTable(bizEntityTable, false, t0));
        this.buildSelectFrom(select, fromEntity);
        const specBud = '$specBud';
        select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, specBud))
            .on(new ExpEQ(new ExpField('id', specBud), new ExpField('base', idFromEntity.alias)))
            .join(JoinType.join, new VarTable(intoTables.ret, '$ret'))
            .on(new ExpEQ(new ExpField('id', '$ret'), new ExpField('base', specBud)));
        select.column(new ExpField('id', b), 'id');
        select.column(new ExpField('id', '$ret'), 'atom');
        select.where(this.context.expCmp(where));

        this.buildSelectBan(select);
        this.buildSelectCols(select, 'json');
        this.buildSelectVallue(select);
        return insertSpec;
    }
}
