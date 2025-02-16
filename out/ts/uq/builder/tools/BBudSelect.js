"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBudSelect = void 0;
const il_1 = require("../../il");
const exp_1 = require("../sql/exp");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
class BBudSelect {
    constructor(context, bBizExp) {
        this.context = context;
        this.bBizExp = bBizExp;
    }
    build() {
        const { props, isParent, bizEntitySys } = this.bBizExp.bizExp;
        const { prop, budProp } = props[0];
        if (bizEntitySys !== undefined) {
            return this.buildEntitySys();
        }
        if (isParent === true) {
            return this.buildSelectBase();
        }
        if (budProp === undefined) {
            return this.buildSelectField(prop);
        }
        return this.buildSelectBud(budProp);
    }
    buildEntitySys() {
        const a = 'a', b = 'b', c = 'c';
        let { params, bizExp: { bizEntitySys, props } } = this.bBizExp;
        const { prop } = props[0];
        let { factory } = this.context;
        let select = factory.createSelect();
        let t;
        switch (bizEntitySys) {
            case il_1.EnumEntitySys.fork:
                select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, a));
                if (prop === 'id') {
                    t = a;
                }
                else {
                    t = b;
                    select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, b))
                        .on(new exp_1.ExpEQ(new exp_1.ExpField('id', b), new exp_1.ExpField('base', a)));
                }
                break;
            case il_1.EnumEntitySys.bin:
                t = c;
                /*
                select.from(new EntityTable(EnumSysTable.bizDetail, false, a))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
                    .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bizSheet, false, c))
                    .on(new ExpEQ(new ExpField('id', c), new ExpField('base', b)));
                */
                select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, a))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.sheet, false, c))
                    .on(new exp_1.ExpEQ(new exp_1.ExpField('id', c), new exp_1.ExpField('sheet', a)));
                break;
        }
        select.col(prop, undefined, t);
        select.where(new exp_1.ExpEQ(new exp_1.ExpField('id', a), params[0]));
        let ret = new exp_1.ExpSelect(select);
        return ret;
    }
    buildSelectBase() {
        let { params } = this.bBizExp;
        let { factory } = this.context;
        let select = factory.createSelect();
        select.col('base');
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false));
        select.where(new exp_1.ExpEQ(new exp_1.ExpField('id'), params[0]));
        let ret = new exp_1.ExpSelect(select);
        return ret;
    }
    buildSelectBud(bud) {
        let { factory } = this.context;
        let select = factory.createSelect();
        switch (bud.dataType) {
            default:
            case BizPhraseType_1.BudDataType.radio:
                this.selectValue(select, il_1.EnumSysTable.ixInt, bud);
                break;
            case BizPhraseType_1.BudDataType.dec:
                this.selectValue(select, il_1.EnumSysTable.ixDec, bud);
                break;
            case BizPhraseType_1.BudDataType.fork:
                this.selectValue(select, il_1.EnumSysTable.ixJson, bud);
                break;
            case BizPhraseType_1.BudDataType.str:
            case BizPhraseType_1.BudDataType.char:
                this.selectValue(select, il_1.EnumSysTable.ixStr, bud);
                break;
            case BizPhraseType_1.BudDataType.check:
                this.selectCheck(select, /*EnumSysTable.ix, */ bud);
                break;
        }
        let ret = new exp_1.ExpSelect(select);
        return ret;
    }
    selectValue(select, tblIxBud, bud) {
        const t = this.bBizExp.tt, c = this.bBizExp.tb;
        select.from(new statementWithFrom_1.EntityTable(tblIxBud, false, t));
        select.where(new exp_1.ExpAnd(new exp_1.ExpEQ(new exp_1.ExpField('i', t), this.bBizExp.params[0]), new exp_1.ExpEQ(new exp_1.ExpField('x', t), new exp_1.ExpNum(bud.id))));
        select.column(new exp_1.ExpField('value', t));
    }
    selectCheck(select, bud) {
        const t = this.bBizExp.tt, c = this.bBizExp.tb;
        select.column(new exp_1.ExpField('x', t), 'value');
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixCheck, false, t));
        select.where(new exp_1.ExpAnd(new exp_1.ExpEQ(new exp_1.ExpField('ii', t), this.bBizExp.params[0]), new exp_1.ExpEQ(new exp_1.ExpField('i', t), new exp_1.ExpNum(bud.id))));
    }
    buildSelectField(bud) {
        const { bizExp, params } = this.bBizExp;
        const { bizEntity, expIDType } = bizExp;
        const { factory } = this.context;
        let select = factory.createSelect();
        select.col(bud);
        let tbl;
        let wheres, expId = new exp_1.ExpEQ(new exp_1.ExpField('id'), params[0]);
        if (bizEntity !== undefined) {
            switch (bizEntity.bizPhraseType) {
                default:
                    debugger;
                    throw new Error('select field must be ATOM or SPEC');
                case BizPhraseType_1.BizPhraseType.atom:
                    tbl = il_1.EnumSysTable.atom;
                    break;
                case BizPhraseType_1.BizPhraseType.fork:
                    tbl = il_1.EnumSysTable.idu;
                    break;
            }
            wheres = new exp_1.ExpAnd(new exp_1.ExpEQ(new exp_1.ExpField('id'), params[0]), new exp_1.ExpEQ(new exp_1.ExpField('base'), new exp_1.ExpNum(bizEntity.id)));
        }
        else {
            switch (expIDType) {
                default:
                    debugger;
                    throw new Error('select field must be ATOM or SPEC');
                case il_1.BizExpIDType.atom:
                    tbl = il_1.EnumSysTable.atom;
                    break;
                case il_1.BizExpIDType.fork:
                    tbl = il_1.EnumSysTable.idu;
                    break;
            }
            wheres = expId;
        }
        select.from(new statementWithFrom_1.EntityTable(tbl, false));
        select.where(wheres);
        return new exp_1.ExpSelect(select);
    }
}
exports.BBudSelect = BBudSelect;
//# sourceMappingURL=BBudSelect.js.map