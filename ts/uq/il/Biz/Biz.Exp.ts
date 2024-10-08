import { PBizFieldOperand, PContext, PElement } from "../../parser";
import { BizField } from "../BizField";
import { IElement } from "../IElement";
import { SpanPeriod } from "../tool";
import { ValueExpression } from "../Exp/Expression";
import { Atom } from "../Exp/Op";
import { Stack } from "../Exp/Stack";
import { BizTie } from "./Tie";
import { BizEntity } from "./Entity";
import { BizBud } from "./Bud";
import { BizOptions, OptionsItem } from "./Options";
import { PBizCheckBudOperand, PBizExp, PBizExpOperand, PBizExpParam } from "../../parser/Biz/Biz.Exp";
import { BizCombo } from "./BizID";

export interface BizExpIn {
    varTimeSpan: string;
    op: '+' | '-';
    val: ValueExpression;
    statementNo: number;
    spanPeiod: SpanPeriod;
}

export enum BizExpParamType {
    none,
    scalar,
    duo,
    multi,
    spec,
    ix,
}
export class BizExpParam extends IElement {
    type = 'BizExpParam';
    readonly params: ValueExpression[] = [];
    paramType: BizExpParamType;
    ixs: BizTie[];

    parser(context: PContext): PElement<IElement> {
        return new PBizExpParam(this, context);
    }
}

// 1. (#Entity.Bud(id).^|Prop IN timeSpan +- delta)     -- sigle value
// 2. (#Book.Bud#ID(*,*,1))                             -- group by Sum
export enum BizExpIDType { fork, atom }
export class BizExp extends IElement {
    bizEntity: BizEntity;
    expIDType: BizExpIDType;
    budEntitySub: BizBud;
    param: BizExpParam;
    prop: string;
    budProp: BizBud;
    in: BizExpIn;
    type = 'BizExp';
    isReadonly: boolean = false;
    isParent: boolean;

    // only used in 2 group by sum
    combo: BizCombo;
    comboParams: ValueExpression[];

    parser(context: PContext): PElement<IElement> {
        return new PBizExp(this, context);
    }
}

export class BizFieldOperand extends Atom {
    field: BizField;
    get type(): string { return 'bizfield'; }
    parser(context: PContext) { return new PBizFieldOperand(this, context); }
    to(stack: Stack) {
        stack.bizFieldOperand(this);
    }
}

export class BizExpOperand extends Atom {
    bizExp: BizExp;
    get type(): string { return 'bizexp'; }
    parser(context: PContext) { return new PBizExpOperand(this, context); }
    to(stack: Stack): void {
        stack.bizExp(this.bizExp);
    }
}

export enum CheckAction {
    on,
    equ,
    in,
}
export class BizCheckBudOperand extends Atom {
    optionIdVal: ValueExpression;
    bizExp1: BizExp;
    bizExp2: BizExp;
    bizOptions: BizOptions;
    bizField: BizFieldOperand;
    items: OptionsItem[];

    get type(): string { return 'bizcheckbudoperand'; }
    parser(context: PContext) { return new PBizCheckBudOperand(this, context); }
    to(stack: Stack): void {
        stack.bizCheckBud(this);
    }
}
