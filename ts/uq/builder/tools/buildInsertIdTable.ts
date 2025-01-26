import { EnumSysTable, JoinType } from "../../il";
import { ExpEQ, ExpField, ExpNum, ExpVal, Select } from "../sql";
import { EntityTable, VarTable } from "../sql/statementWithFrom";
import { DbContext } from "../dbContext";

const $idu = '$idu';
export function buildInsertIdTable(context: DbContext, expId: ExpVal, show: boolean, buildFrom: (select: Select) => void) {
    const { factory } = context;
    const insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new VarTable('idtable');
    insert.cols = [
        { col: 'id', val: undefined },
        { col: 'phrase', val: undefined },
        { col: 'seed', val: undefined },
        { col: 'show', val: undefined },
    ]
    const select = factory.createSelect();
    insert.select = select;
    select.column(new ExpField('id', $idu), 'id');
    select.column(new ExpField('base', $idu), 'phrase');
    select.column(new ExpField('seed', $idu), 'seed');
    select.column(new ExpNum(show ? 1 : 0), 'show');
    buildFrom(select);
    select
        // from(new GlobalSiteTable(this.context.site, this.bizEntity.id, a))
        // .join(JoinType.join, new VarTable('$page', b))
        // .on(new ExpEQ(new ExpField('i', b), new ExpField('id', a)))
        .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, $idu))
        .on(new ExpEQ(new ExpField('id', $idu), expId));
    return insert;
}
