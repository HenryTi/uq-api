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
        const { prop, budProp, isParent, bizEntitySys } = this.bBizExp.bizExp;
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
        const a = 'a', b = 'b';
        let { params, bizExp: { bizEntitySys } } = this.bBizExp;
        let { factory } = this.context;
        let select = factory.createSelect();
        select.col('base', a);
        switch (bizEntitySys) {
            case EnumEntitySys.fork:
                select.from(new EntityTable(EnumSysTable.fork, false, a));
                break;
            case EnumEntitySys.bin:
                select.from(new EntityTable(EnumSysTable.bizDetail, false, b))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, a))
                    .on(new ExpEQ(new ExpField('id', a), new ExpField('base', b)));
                break;
        }

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
                this.selectValue(select, EnumSysTable.ixBudInt, bud);
                break;
            case BudDataType.dec:
                this.selectValue(select, EnumSysTable.ixBudDec, bud);
                break;
            case BudDataType.fork:
                this.selectValue(select, EnumSysTable.ixBudJson, bud);
                break;
            case BudDataType.str:
            case BudDataType.char:
                this.selectValue(select, EnumSysTable.ixBudStr, bud);
                break;
            case BudDataType.check:
                this.selectCheck(select, /*EnumSysTable.ixBud, */bud);
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
        select.from(new EntityTable(EnumSysTable.ixBudCheck, false, t));
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
                case BizPhraseType.fork: tbl = EnumSysTable.fork; break;
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
                case BizExpIDType.fork: tbl = EnumSysTable.fork; break;
            }
            wheres = expId;
        }
        select.from(new EntityTable(tbl, false));
        select.where(wheres);
        return new ExpSelect(select);
    }
}
