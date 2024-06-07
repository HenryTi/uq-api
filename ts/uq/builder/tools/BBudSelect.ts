import {
    BizBud, JoinType, EnumSysTable
} from "../../il";
import {
    ExpAnd, ExpEQ, ExpField, ExpNum, ExpVal, ExpSelect
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
        const { prop, budProp } = this.bBizExp.bizExp;
        if (budProp === undefined) {
            return this.buildSelectField(prop);
        }
        return this.buildSelectBud(budProp);
    }

    private buildSelectBud(bud: BizBud) {
        let { factory } = this.context;
        let select = factory.createSelect();
        switch (bud.dataType) {
            default:
                this.selectValue(select, EnumSysTable.ixBudInt, bud);
                break;
            case BudDataType.dec:
                this.selectValue(select, EnumSysTable.ixBudDec, bud);
                break;
            case BudDataType.str:
            case BudDataType.char:
                this.selectValue(select, EnumSysTable.ixBudStr, bud);
                break;
            case BudDataType.radio:
            case BudDataType.check:
                this.selectCheck(select, EnumSysTable.ixBud, bud);
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
    private selectCheck(select: Select, tblIxBud: EnumSysTable, bud: BizBud) {
        const t = this.bBizExp.tt, c = this.bBizExp.tb;
        select.from(new EntityTable(tblIxBud, false, t))
            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('x', t)));
        select.column(new ExpField('ext', c), 'id');
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('base', c), new ExpNum(bud.id)),
            new ExpEQ(new ExpField('i', t), this.bBizExp.params[0])
        ));
    }

    private buildSelectField(bud: string) {
        const { bizExp, params } = this.bBizExp;
        const { bizEntity } = bizExp;
        const { factory } = this.context;
        let select = factory.createSelect();
        select.col(bud);
        let tbl: EnumSysTable;
        switch (bizEntity.bizPhraseType) {
            default: debugger; throw new Error('select field must be ATOM or SPEC');
            case BizPhraseType.atom: tbl = EnumSysTable.atom; break;
            case BizPhraseType.spec: tbl = EnumSysTable.spec; break;
        }
        select.from(new EntityTable(tbl, false));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), params[0]),
            new ExpEQ(new ExpField('base'), new ExpNum(bizEntity.id)),
        ));
        return new ExpSelect(select);
    }
}
