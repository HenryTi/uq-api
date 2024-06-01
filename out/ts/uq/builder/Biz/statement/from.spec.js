"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromSpecStatement = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const from_atom_1 = require("./from.atom");
const a = 'a', b = 'b';
const pageSpec = '$pageSpec';
class BFromSpecStatement extends from_atom_1.BFromStatement {
    buildFromMain(cmpPage) {
        const { factory } = this.context;
        const { intoTables, ids } = this.istatement;
        let tblPageSpec = this.buildTablePageSpec();
        let selectPage = this.buildFromSelectPage(cmpPage);
        let insertPage = factory.createInsert();
        insertPage.select = selectPage;
        insertPage.table = new statementWithFrom_1.VarTable(pageSpec);
        insertPage.cols = ids.map((v, index) => ({
            col: 'id' + index,
            val: undefined,
        }));
        let insertRet = this.buildInsertRet();
        let insertSpec = this.buildInsertSpec();
        return [tblPageSpec, insertPage, insertRet, insertSpec];
    }
    buildTablePageSpec() {
        const { factory } = this.context;
        let tblPageSpec = factory.createVarTable();
        tblPageSpec.name = pageSpec;
        const { ids } = this.istatement;
        let fields = ids.map((v, index) => (0, il_1.bigIntField)('id' + index));
        tblPageSpec.keys = fields;
        tblPageSpec.fields = fields;
        return tblPageSpec;
    }
    buildFromSelectPage(cmpPage) {
        const { factory } = this.context;
        const { ids, where, fromEntity } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        const select = factory.createSelect();
        const specBase = '$specBase';
        const specBud = '$specBud';
        ids.forEach((v, index) => {
            let expField = new sql_1.ExpField('id', v.fromEntity.alias);
            select.column(expField, 'id' + index);
            select.group(expField);
            select.order(expField, v.asc === il_1.EnumAsc.asc ? 'asc' : 'desc');
        });
        // select.column(new ExpField('id', specBase), 'id');
        // select.column(ExpNum.num0, 'ban');
        select.from(new statementWithFrom_1.EntityTable(bizEntityTable, false, t0));
        this.buildSelectFrom(select, fromEntity);
        /*
        select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, specBud))
            .on(new ExpEQ(new ExpField('id', specBud), new ExpField('base', idFromEntity.alias)))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, specBase))
            .on(new ExpEQ(new ExpField('id', specBase), new ExpField('base', specBud)));
        */
        let wheres = [
            cmpPage,
            this.context.expCmp(where),
        ];
        select.where(new sql_1.ExpAnd(...wheres));
        // select.group(new ExpField('id', specBase));
        // select.order(new ExpField('id', specBase), asc);
        select.limit(new sql_1.ExpVar('$pageSize'));
        return select;
    }
    buildInsertRet() {
        const { factory } = this.context;
        const { intoTables } = this.istatement;
        const insertRet = factory.createInsert();
        insertRet.table = new statementWithFrom_1.VarTable(intoTables.ret);
        return insertRet;
    }
    buildFromEntity(sqls) {
        let { ids } = this.istatement;
        for (let idc of ids) {
            const { fromEntity: { bizEntityArr } } = idc;
            let insertAtomOfSpec = this.buildInsertAtomOfSpec();
            sqls.push(insertAtomOfSpec);
            // 暂时只生成第一个spec的atom的所有字段
            let [bizEntity] = bizEntityArr;
            if (bizEntity.bizPhraseType === BizPhraseType_1.BizPhraseType.spec) {
                let spec = bizEntity;
                this.buildInsertAtomBuds(sqls, spec.base);
                const buds = [...spec.keys];
                for (let [, bud] of spec.props) {
                    buds.push(bud);
                }
                let mapBuds = this.createMapBuds();
                this.buildMapBuds(mapBuds, buds);
                this.buildInsertBuds(sqls, 'specs', mapBuds);
            }
            /*
            for (let spec of bizEntityArr) {
                const buds: BizBud[] = [...spec.keys];
                for (let [, bud] of spec.props) {
                    buds.push(bud);
                }
                let mapBuds = this.createMapBuds();
                this.buildMapBuds(mapBuds, buds);
                this.buildInsertBuds(sqls, 'specs', mapBuds);
            }
            */
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
        const { factory } = this.context;
        let memo = factory.createMemo();
        memo.text = 'insert spec';
        return memo;
        /*
        const { fromEntity, intoTables, idFromEntity, where } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
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
        */
    }
}
exports.BFromSpecStatement = BFromSpecStatement;
//# sourceMappingURL=from.spec.js.map