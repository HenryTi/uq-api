import { BizBud, BizSpec, EnumAsc, EnumSysTable, FromStatement, JoinType, bigIntField } from "../../../il";
import { Sqls } from "../../bstatement";
import { ExpAnd, ExpCmp, ExpEQ, ExpField, ExpNum, ExpVar, Select, Statement } from "../../sql";
import { EntityTable, VarTable } from "../../sql/statementWithFrom";
import { BFromStatement } from "./from.atom";

const a = 'a', b = 'b';
const pageSpec = '$pageSpec';
export class BFromSpecStatement extends BFromStatement<FromStatement> {
    protected override buildFromMain(cmpPage: ExpCmp): Statement[] {
        const { factory } = this.context;
        const { intoTables, ids } = this.istatement;
        let tblPageSpec = this.buildTablePageSpec();
        let selectPage = this.buildFromSelectPage(cmpPage);
        let insertPage = factory.createInsert();
        insertPage.select = selectPage;
        insertPage.table = new VarTable(intoTables.ret);
        insertPage.cols = ids.map((v, index) => ({
            col: 'id' + index,
            val: undefined,
        }));
        let insertSpec = this.buildInsertSpec();
        return [tblPageSpec, insertPage, insertSpec];
    }

    private buildTablePageSpec() {
        const { factory } = this.context;
        let tblPageSpec = factory.createVarTable();
        tblPageSpec.name = pageSpec;
        const { ids } = this.istatement;
        tblPageSpec.keys = ids.map((v, index) => bigIntField('id' + index));
        return tblPageSpec;
    }

    private buildFromSelectPage(cmpPage: ExpCmp): Select {
        const { factory } = this.context;
        const { ids, where, fromEntity } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        const select = factory.createSelect();
        const specBase = '$specBase';
        const specBud = '$specBud';
        ids.forEach((v, index) => {
            let expField = new ExpField('id', v.fromEntity.alias);
            select.column(expField, 'id' + index);
            select.group(expField);
            select.order(expField, v.asc === EnumAsc.asc ? 'asc' : 'desc');
        });
        // select.column(new ExpField('id', specBase), 'id');
        // select.column(ExpNum.num0, 'ban');
        select.from(new EntityTable(bizEntityTable, false, t0));
        this.buildSelectFrom(select, fromEntity);
        /*
        select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, specBud))
            .on(new ExpEQ(new ExpField('id', specBud), new ExpField('base', idFromEntity.alias)))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, specBase))
            .on(new ExpEQ(new ExpField('id', specBase), new ExpField('base', specBud)));
        */
        let wheres: ExpCmp[] = [
            cmpPage,
            this.context.expCmp(where),
        ];
        select.where(new ExpAnd(...wheres));
        // select.group(new ExpField('id', specBase));
        // select.order(new ExpField('id', specBase), asc);
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
