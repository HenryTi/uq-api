"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInsertIdTable = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const $idu = '$idu';
function buildInsertIdTable(context, expId, show, buildFrom) {
    const { factory } = context;
    const insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new statementWithFrom_1.VarTable('idtable');
    insert.cols = [
        { col: 'id', val: undefined },
        { col: 'phrase', val: undefined },
        { col: 'seed', val: undefined },
        { col: 'show', val: undefined },
    ];
    const select = factory.createSelect();
    insert.select = select;
    select.column(new sql_1.ExpField('id', $idu), 'id');
    select.column(new sql_1.ExpField('base', $idu), 'phrase');
    select.column(new sql_1.ExpField('seed', $idu), 'seed');
    select.column(new sql_1.ExpNum(show ? 1 : 0), 'show');
    buildFrom(select);
    select
        // from(new GlobalSiteTable(this.context.site, this.bizEntity.id, a))
        // .join(JoinType.join, new VarTable('$page', b))
        // .on(new ExpEQ(new ExpField('i', b), new ExpField('id', a)))
        .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, $idu))
        .on(new sql_1.ExpEQ(new sql_1.ExpField('id', $idu), expId));
    return insert;
}
exports.buildInsertIdTable = buildInsertIdTable;
//# sourceMappingURL=buildInsertIdTable.js.map