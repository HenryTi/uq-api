"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizAssign = void 0;
const il_1 = require("../../il");
const BizEntity_1 = require("./BizEntity");
const il_2 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a';
class BBizAssign extends BizEntity_1.BBizEntity {
    buildProcedures() {
        const _super = Object.create(null, {
            buildProcedures: { get: () => super.buildProcedures }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildProcedures;
            const { id } = this.bizEntity;
            const procGet = this.createProcedure(`${this.context.site}.${id}a`);
            this.buildGetProc(procGet);
        });
    }
    buildGetProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { id, atom, title } = this.bizEntity;
        const site = '$site';
        const params = '$params';
        parameters.push(userParam, (0, il_2.bigIntField)('pageStart'), (0, il_2.bigIntField)('pageSize'), (0, il_2.jsonField)(params));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new sql_1.ExpNum(id));
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
        let expJsonValues = this.buildJsonValues(title);
        selectPage.column(new sql_1.ExpField('id', a));
        selectPage.column(new sql_1.ExpField('no', a));
        selectPage.column(new sql_1.ExpField('ex', a));
        selectPage.column(expJsonValues, 'values');
        selectPage
            .from(new statementWithFrom_1.EntityTable(il_2.EnumSysTable.atom, false, a));
        selectPage.where(new sql_1.ExpAnd(new sql_1.ExpGT(new sql_1.ExpField('id', a), new sql_1.ExpVar('pageStart')), new sql_1.ExpIn(new sql_1.ExpField('base', a), ...atom.map(v => new sql_1.ExpNum(v.id)))));
        selectPage.order(new sql_1.ExpField('id', a), 'asc');
        selectPage.limit(new sql_1.ExpVar('pageSize'));
    }
    buildJsonValues(title) {
        const { factory } = this.context;
        let expValues = title.map(([entity, bud]) => {
            const selectValue = this.buildTitleValueSelect(entity, bud);
            return new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpSelect(selectValue), sql_1.ExpNum.num0);
        });
        const expJsonValues = new sql_1.ExpFunc('JSON_ARRAY', ...expValues);
        return expJsonValues;
    }
    buildTitleValueSelect(entity, bud) {
        const { factory } = this.context;
        const t = 't0';
        let select = factory.createSelect();
        select.col('value', undefined, t);
        select.from(new statementWithFrom_1.EntityTable(il_2.EnumSysTable.ixBudDec, false, t));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(bud.id))));
        return select;
    }
}
exports.BBizAssign = BBizAssign;
//# sourceMappingURL=BizAssign.js.map