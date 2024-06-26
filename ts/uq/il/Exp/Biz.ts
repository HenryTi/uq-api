import { PBizCheckBudOperand, PBizExp, PBizExpOperand, PBizExpParam, PBizFieldOperand, PContext, PElement } from "../../parser";
import {
    BizBud, BizEntity, BizOptions, BizTie, OptionsItem
} from "../Biz";
import { BizField } from "../BizField";
import { IElement } from "../IElement";
import { SpanPeriod } from "../tool";
import { ValueExpression } from "./Expression";
import { Atom } from "./Op";
import { Stack } from "./Stack";

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
    // param2: ValueExpression;
    paramType: BizExpParamType;
    ixs: BizTie[];

    parser(context: PContext): PElement<IElement> {
        return new PBizExpParam(this, context);
    }
}

// (#Entity.Bud(id).^|Prop IN timeSpan +- delta)
export class BizExp extends IElement {
    bizEntity: BizEntity;
    budEntitySub: BizBud;
    param: BizExpParam;
    prop: string;
    budProp: BizBud;
    in: BizExpIn;
    type = 'BizExp';
    isReadonly: boolean = false;
    isParent: boolean;
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
