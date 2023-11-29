"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBudSelect = void 0;
const il_1 = require("../../il");
const exp_1 = require("./exp");
const statementWithFrom_1 = require("./statementWithFrom");
class BBudSelect {
    constructor(context, bBizExp) {
        this.context = context;
        this.bBizExp = bBizExp;
    }
    build() {
        const { prop, budProp } = this.bBizExp.bizExp;
        if (budProp === undefined) {
            return this.buildSelectField(prop);
        }
        return this.buildSelectBud(budProp);
    }
    buildSelectBud(bud) {
        let { factory } = this.context;
        let select = factory.createSelect();
        switch (bud.dataType) {
            default:
                this.selectValue(select, il_1.EnumSysTable.ixBudInt, bud);
                break;
            case il_1.BudDataType.dec:
                this.selectValue(select, il_1.EnumSysTable.ixBudDec, bud);
                break;
            case il_1.BudDataType.str:
            case il_1.BudDataType.char:
                this.selectValue(select, il_1.EnumSysTable.ixBudStr, bud);
                break;
            case il_1.BudDataType.radio:
            case il_1.BudDataType.check:
                this.selectCheck(select, il_1.EnumSysTable.ixBud, bud);
                break;
        }
        let ret = new exp_1.ExpSelect(select);
        return ret;
    }
    selectValue(select, tblIxBud, bud) {
        const t = this.bBizExp.tt, c = this.bBizExp.tb;
        select.from(new statementWithFrom_1.EntityTable(tblIxBud, false, t));
        select.where(new exp_1.ExpAnd(new exp_1.ExpEQ(new exp_1.ExpField('i', t), this.bBizExp.param), new exp_1.ExpEQ(new exp_1.ExpField('x', t), new exp_1.ExpNum(bud.id))));
        select.column(new exp_1.ExpField('value', t));
    }
    selectCheck(select, tblIxBud, bud) {
        const t = this.bBizExp.tt, c = this.bBizExp.tb;
        select.from(new statementWithFrom_1.EntityTable(tblIxBud, false, t))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, c))
            .on(new exp_1.ExpEQ(new exp_1.ExpField('id', c), new exp_1.ExpField('x', t)));
        select.column(new exp_1.ExpField('ext', c), 'id');
        select.where(new exp_1.ExpAnd(new exp_1.ExpEQ(new exp_1.ExpField('base', c), new exp_1.ExpNum(bud.id)), new exp_1.ExpEQ(new exp_1.ExpField('i', t), this.bBizExp.param)));
    }
    buildSelectField(bud) {
        const { bizExp, param } = this.bBizExp;
        const { bizEntity } = bizExp;
        const { factory } = this.context;
        let select = factory.createSelect();
        select.col(bud);
        let tbl;
        switch (bizEntity.bizPhraseType) {
            default:
                debugger;
                throw new Error('select field must be ATOM or SPEC');
            case il_1.BizPhraseType.atom:
                tbl = il_1.EnumSysTable.atom;
                break;
            case il_1.BizPhraseType.spec:
                tbl = il_1.EnumSysTable.spec;
                break;
        }
        select.from(new statementWithFrom_1.EntityTable(tbl, false));
        select.where(new exp_1.ExpAnd(new exp_1.ExpEQ(new exp_1.ExpField('id'), param), new exp_1.ExpEQ(new exp_1.ExpField('base'), new exp_1.ExpNum(bizEntity.id))));
        return new exp_1.ExpSelect(select);
    }
}
exports.BBudSelect = BBudSelect;
//# sourceMappingURL=BBudSelect.js.map