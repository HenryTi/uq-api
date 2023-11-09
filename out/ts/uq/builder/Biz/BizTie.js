"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizTie = void 0;
const il_1 = require("../../il");
const BizEntity_1 = require("./BizEntity");
const il_2 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a';
const b = 'b';
const c = 'c';
class BBizTie extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures;
        const { id } = this.bizEntity;
        const procGet = this.createProcedure(`${this.context.site}.${id}t`);
        this.buildGetProc(procGet);
    }
    buildGetProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam, site: siteId } = this.context;
        const { id, i, x } = this.bizEntity;
        const site = '$site';
        const params = '$params';
        parameters.push(userParam, (0, il_2.bigIntField)('pageStart'), (0, il_2.bigIntField)('pageSize'), (0, il_2.jsonField)(params));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new sql_1.ExpNum(siteId));
        const insert = factory.createInsert();
        statements.push(insert);
        insert.table = new statementWithFrom_1.EntityTable('_$page', false);
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'no', val: undefined },
            { col: 'ex', val: undefined },
            { col: 'values', val: undefined },
        ];
        const selectPage = factory.createSelect();
        insert.select = selectPage;
        let expJsonValues = this.buildJsonValues();
        let expBaseCmp;
        let { atoms: iAtoms } = i;
        selectPage.column(new sql_1.ExpField('id', a));
        if (iAtoms === undefined) {
            selectPage.column(new sql_1.ExpField('name', c), 'no');
            selectPage.column(new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpField('assigned', a), sql_1.ExpStr.empty), new sql_1.ExpStr('|'), new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpField('nick', c), sql_1.ExpStr.empty)), 'ex');
            selectPage
                .from(new statementWithFrom_1.EntityTable(il_2.EnumSysTable.userSite, false, a))
                .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_2.EnumSysTable.user, false, c))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('user', a)));
            expBaseCmp = new sql_1.ExpEQ(new sql_1.ExpField('site', a), new sql_1.ExpVar('$site'));
        }
        else {
            selectPage.column(new sql_1.ExpField('no', a));
            selectPage.column(new sql_1.ExpField('ex', a));
            selectPage
                .from(new statementWithFrom_1.EntityTable(il_2.EnumSysTable.atom, false, a));
            expBaseCmp = new sql_1.ExpIn(new sql_1.ExpField('base', a), ...iAtoms.map(v => new sql_1.ExpNum(v.id)));
        }
        selectPage.column(expJsonValues, 'values');
        selectPage.join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_2.EnumSysTable.bud, false, b))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('base', b), new sql_1.ExpNum(id)), new sql_1.ExpEQ(new sql_1.ExpField('ext', b), new sql_1.ExpField('id', a))));
        selectPage.where(new sql_1.ExpAnd(new sql_1.ExpGT(new sql_1.ExpField('id', a), new sql_1.ExpVar('pageStart')), expBaseCmp));
        selectPage.order(new sql_1.ExpField('id', a), 'asc');
        selectPage.limit(new sql_1.ExpVar('pageSize'));
    }
    buildJsonValues() {
        const selectValue = this.buildTitleValueSelect();
        let expValues = new sql_1.ExpSelect(selectValue);
        return expValues;
    }
    buildTitleValueSelect() {
        const { factory } = this.context;
        const t = 't0', ta = 'ta';
        let select = factory.createSelect();
        select.column(new sql_1.ExpFunc('JSON_ARRAYAGG', new sql_1.ExpFunc('JSON_ARRAY', new sql_1.ExpField('id', ta), new sql_1.ExpField('no', ta), new sql_1.ExpField('ex', ta))), 'value');
        select.from(new statementWithFrom_1.EntityTable(il_2.EnumSysTable.ixBud, false, t))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_2.EnumSysTable.atom, false, ta))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', ta), new sql_1.ExpField('x', t)));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField('id', b)));
        return select;
    }
}
exports.BBizTie = BBizTie;
//# sourceMappingURL=BizTie.js.map