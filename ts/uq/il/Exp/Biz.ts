import { PBizExp, PBizExpOperand, PBizExpParam, PBizFieldOperand, PContext, PElement } from "../../parser";
import {
    BizBud, BizEntity, BizTie
} from "../Biz";
import { BizField } from "../BizField";
import { IElement } from "../element";
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
    scalar,
    spec,
    ix,
}
export class BizExpParam extends IElement {
    type = 'BizExpParam';
    param: ValueExpression;
    paramType: BizExpParamType;
    ixs: BizTie[];

    parser(context: PContext): PElement<IElement> {
        return new PBizExpParam(this, context);
    }
}

export class BizExp extends IElement {
    bizEntity: BizEntity;
    bud: BizBud;
    param: BizExpParam;
    prop: string;
    in: BizExpIn;
    type = 'BizExp';
    parser(context: PContext): PElement<IElement> {
        return new PBizExp(this, context);
    }
}

export class BizFieldOperand extends Atom {
    // bizEntity: BizEntity;
    // bizBud: BizBud;
    // fieldName: string;
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
