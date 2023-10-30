import * as parser from '../../parser';
import { Atom, Stack, ValueExpression } from './expression';
import { IElement } from '../element';
import { BizBud, BizEntity } from '../Biz';
import { SpanPeriod } from '../tool';

export interface BizSelectTbl {
    entityArr: BizEntity[];
    alias: string;
}

export type BizSelectJoinType = '^' | 'x' | 'i';
export interface BizSelectJoin {
    joinType: BizSelectJoinType;
    tbl: BizSelectTbl;
}

export interface BizSelectFrom {
    main: BizSelectTbl;
    joins: BizSelectJoin[];
}

export interface BizSelectColumn {
    alias: string;
    val: ValueExpression;
}

export interface BizExpIn {
    varTimeSpan: string;
    op: '+' | '-';
    val: ValueExpression;
    statementNo: number;
    spanPeiod: SpanPeriod;
}

export class BizExp extends IElement {
    from: BizSelectFrom;
    on: ValueExpression;
    column: BizSelectColumn;
    bizEntity: BizEntity;
    bud: BizBud;
    param: ValueExpression;
    prop: string;
    in: BizExpIn;
    type = 'BizExp';
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizExp(this, context);
    }
}

export class BizFieldOperand extends Atom {
    bizEntity: BizEntity;
    bizBud: BizBud;
    fieldName: string;
    get type(): string { return 'bizfield'; }
    parser(context: parser.PContext) { return new parser.PBizFieldOperand(this, context); }
    to(stack: Stack) {
        stack.bizField(this);
    }
}
