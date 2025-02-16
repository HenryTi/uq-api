import {
    BizBud, JoinType, EnumSysTable,
    BizExpIDType,
    EnumEntitySys
} from "../../il";
import {
    ExpAnd, ExpEQ, ExpField, ExpNum, ExpVal, ExpSelect,
    ExpCmp
} from "../sql/exp";
import { DbContext } from "../dbContext";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizExp } from "./BizExp";
import { Select } from "../sql/select";
import { BizPhraseType, BudDataType } from "../../il/Biz/BizPhraseType";

export class BBudSelect {
    protected readonly context: DbContext;
    private readonly bBizExp: BBizExp;
    constructor(context: DbContext, bBizExp: BBizExp) {
        this.context = context;
        this.bBizExp = bBizExp;
    }

    build(): ExpVal {
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

    private buildEntitySys() {
        const a = 'a', b = 'b', c = 'c';
        let { params, bizExp: { bizEntitySys, props } } = this.bBizExp;
        const { prop } = props[0];
        let { factory } = this.context;
        let select = factory.createSelect();
        let t: string;
        switch (bizEntitySys) {
            case EnumEntitySys.fork:
                select.from(new EntityTable(EnumSysTable.idu, false, a));
                if (prop === 'id') {
                    t = a;
                }
                else {
                    t = b;
                    select.join(JoinType.join, new EntityTable(EnumSysTable.atom, false, b))
                        .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)));
                }
                break;
            case EnumEntitySys.bin:
                t = c;
                /*
                select.from(new EntityTable(EnumSysTable.bizDetail, false, a))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
                    .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bizSheet, false, c))
                    .on(new ExpEQ(new ExpField('id', c), new ExpField('base', b)));
                */
                select.from(new EntityTable(EnumSysTable.bizBin, false, a))
                    .join(JoinType.join, new EntityTable(EnumSysTable.sheet, false, c))
                    .on(new ExpEQ(new ExpField('id', c), new ExpField('sheet', a)));
                break;
        }
        select.col(prop, undefined, t);
        select.where(new ExpEQ(new ExpField('id', a), params[0]))
        let ret = new ExpSelect(select);
        return ret;
    }

    private buildSelectBase() {
        let { params } = this.bBizExp;
        let { factory } = this.context;
        let select = factory.createSelect();
        select.col('base');
        select.from(new EntityTable(EnumSysTable.idu, false));
        select.where(new ExpEQ(new ExpField('id'), params[0]))
        let ret = new ExpSelect(select);
        return ret;
    }

    private buildSelectBud(bud: BizBud) {
        let { factory } = this.context;
        let select = factory.createSelect();
        switch (bud.dataType) {
            default:
            case BudDataType.radio:
                this.selectValue(select, EnumSysTable.ixInt, bud);
                break;
            case BudDataType.dec:
                this.selectValue(select, EnumSysTable.ixDec, bud);
                break;
            case BudDataType.fork:
                this.selectValue(select, EnumSysTable.ixJson, bud);
                break;
            case BudDataType.str:
            case BudDataType.char:
                this.selectValue(select, EnumSysTable.ixStr, bud);
                break;
            case BudDataType.check:
                this.selectCheck(select, /*EnumSysTable.ix, */bud);
                break;
        }
        let ret = new ExpSelect(select);
        return ret;
    }

    private selectValue(select: Select, tblIxBud: EnumSysTable, bud: BizBud) {
        const t = this.bBizExp.tt, c = this.bBizExp.tb;
        select.from(new EntityTable(tblIxBud, false, t));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('i', t), this.bBizExp.params[0]),
            new ExpEQ(new ExpField('x', t), new ExpNum(bud.id)),
        ));
        select.column(new ExpField('value', t));
    }
    private selectCheck(select: Select, bud: BizBud) {
        const t = this.bBizExp.tt, c = this.bBizExp.tb;
        select.column(new ExpField('x', t), 'value');
        select.from(new EntityTable(EnumSysTable.ixCheck, false, t));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('ii', t), this.bBizExp.params[0]),
            new ExpEQ(new ExpField('i', t), new ExpNum(bud.id)),
        ));
    }

    private buildSelectField(bud: string) {
        const { bizExp, params } = this.bBizExp;
        const { bizEntity, expIDType } = bizExp;
        const { factory } = this.context;
        let select = factory.createSelect();
        select.col(bud);
        let tbl: EnumSysTable;
        let wheres: ExpCmp, expId = new ExpEQ(new ExpField('id'), params[0]);
        if (bizEntity !== undefined) {
            switch (bizEntity.bizPhraseType) {
                default: debugger; throw new Error('select field must be ATOM or SPEC');
                case BizPhraseType.atom: tbl = EnumSysTable.atom; break;
                case BizPhraseType.fork: tbl = EnumSysTable.idu; break;
            }
            wheres = new ExpAnd(
                new ExpEQ(new ExpField('id'), params[0]),
                new ExpEQ(new ExpField('base'), new ExpNum(bizEntity.id)),
            );
        }
        else {
            switch (expIDType) {
                default: debugger; throw new Error('select field must be ATOM or SPEC');
                case BizExpIDType.atom: tbl = EnumSysTable.atom; break;
                case BizExpIDType.fork: tbl = EnumSysTable.idu; break;
            }
            wheres = expId;
        }
        select.from(new EntityTable(tbl, false));
        select.where(wheres);
        return new ExpSelect(select);
    }
}
