"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromSpecStatement = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const from_atom_1 = require("./from.atom");
const a = 'a', b = 'b';
class BFromSpecStatement extends from_atom_1.BFromStatement {
    buildFromMain(cmpPage) {
        const { factory } = this.context;
        const { intoTables } = this.istatement;
        let selectPage = this.buildFromSelectPage(cmpPage);
        if (intoTables !== undefined) {
            let insertPage = factory.createInsert();
            insertPage.select = selectPage;
            insertPage.table = new statementWithFrom_1.VarTable(intoTables.ret);
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
    buildFromSelectPage(cmpPage) {
        let select = this.buildSelect(cmpPage);
        return select;
    }
    buildSelect(cmpPage) {
        const { factory } = this.context;
        const { asc, where, fromEntity, idFromEntity } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        const select = factory.createSelect();
        const specBase = '$specBase';
        const specBud = '$specBud';
        select.column(new sql_1.ExpField('id', specBase), 'id');
        select.column(sql_1.ExpNum.num0, 'ban');
        select.from(new statementWithFrom_1.EntityTable(bizEntityTable, false, t0));
        this.buildSelectFrom(select, fromEntity);
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, specBud))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', specBud), new sql_1.ExpField('base', idFromEntity.alias)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, specBase))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', specBase), new sql_1.ExpField('base', specBud)));
        let wheres = [
            cmpPage,
            this.context.expCmp(where),
        ];
        select.where(new sql_1.ExpAnd(...wheres));
        select.group(new sql_1.ExpField('id', specBase));
        select.order(new sql_1.ExpField('id', specBase), asc);
        select.limit(new sql_1.ExpVar('$pageSize'));
        return select;
    }
    buildFromEntity(sqls) {
        let { bizEntityArr } = this.istatement.idFromEntity;
        let entityArr = bizEntityArr;
        let insertAtomOfSpec = this.buildInsertAtomOfSpec();
        sqls.push(insertAtomOfSpec);
        // 暂时只生成第一个spec的atom的所有字段
        let [spec] = entityArr;
        this.buildInsertAtomBuds(sqls, spec.base);
        for (let spec of entityArr) {
            const buds = [...spec.keys];
            for (let [, bud] of spec.props) {
                buds.push(bud);
            }
            let mapBuds = this.createMapBuds();
            this.buildMapBuds(mapBuds, buds);
            this.buildInsertBuds(sqls, 'specs', mapBuds);
        }
    }
    buildInsertAtomOfSpec() {
        const { intoTables } = this.istatement;
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new statementWithFrom_1.VarTable(intoTables.ret, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('id', a)));
        return insert;
    }
    buildInsertSpec() {
        const { fromEntity, intoTables, idFromEntity, where } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        const { factory } = this.context;
        let insertSpec = factory.createInsert();
        insertSpec.ignore = true;
        insertSpec.table = new statementWithFrom_1.VarTable('specs');
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
        select.from(new statementWithFrom_1.EntityTable(bizEntityTable, false, t0));
        this.buildSelectFrom(select, fromEntity);
        const specBud = '$specBud';
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, specBud))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', specBud), new sql_1.ExpField('base', idFromEntity.alias)))
            .join(il_1.JoinType.join, new statementWithFrom_1.VarTable(intoTables.ret, '$ret'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', '$ret'), new sql_1.ExpField('base', specBud)));
        select.column(new sql_1.ExpField('id', b), 'id');
        select.column(new sql_1.ExpField('id', '$ret'), 'atom');
        select.where(this.context.expCmp(where));
        this.buildSelectBan(select);
        this.buildSelectCols(select, 'json');
        this.buildSelectVallue(select);
        return insertSpec;
    }
}
exports.BFromSpecStatement = BFromSpecStatement;
//# sourceMappingURL=from.spec.js.map