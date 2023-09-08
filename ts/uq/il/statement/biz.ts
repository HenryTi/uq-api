import { BStatement } from '../../builder';
import * as parser from '../../parser';
import { Builder } from "../builder";
import { IElement } from '../element';
import { BizBud, BizDetailAct, BizPend, BizMoniker } from '../Biz';
import { ValueExpression } from '../expression';
import { SetEqu, Statement, Var } from "./statement";

export class BizDetailActStatement extends Statement {
    /*
    // readonly bizDetailAct: BizDetailAct;
    constructor(parent: Statement, bizDetailAct: BizDetailAct) {
        super(parent);
        // this.bizDetailAct = bizDetailAct;
    }
    */
    sub: BizDetailActSubStatement;
    get type(): string { return 'bizstatement'; }
    db(db: Builder): object { return db.bizDetailActStatement(this); }
    parser(context: parser.PContext) { return new parser.PBizDetailActStatement(this, context); }
    setNo(no: number) {
        this.no = no;
        this.sub.setNo(no);
    }
}

export abstract class BizDetailActSubStatement extends Statement {
    abstract parser(context: parser.PContext): parser.PElement;
    abstract db(db: Builder): BStatement;
}

// 可以发送sheet主表，也可以是Detail
export enum PendAct {
    del = 1,
    set = 2,
    goto = 3,
}
export enum PendValueCalc {
    equ = 1,
    add = 2,
    sub = 3,
}
export class BizDetailActSubPend extends BizDetailActSubStatement {
    readonly bizStatement: BizDetailActStatement;
    pend: BizPend;
    toVar: Var;
    valId: ValueExpression;
    valDetailId: ValueExpression;
    valValue: ValueExpression;
    receiver: ValueExpression;
    valueCalc: PendValueCalc;
    pendAct: PendAct;
    pendGoto: BizPend;

    constructor(bizStatement: BizDetailActStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'bizpend'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizDetailActSubPend(this, context);
    }
    db(db: Builder): BStatement { return db.bizDetailActSubPend(this); }
}

export class BizDetailActSubBud extends BizDetailActSubStatement {
    readonly bizStatement: BizDetailActStatement;
    setEqu: SetEqu;
    value: ValueExpression;
    ref: ValueExpression;
    bud: BizBud;
    obj: ValueExpression;
    toVar: Var;

    constructor(bizStatement: BizDetailActStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'bizbud'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizDetailActSubBud(this, context);
    }
    db(db: Builder): BStatement { return db.bizDetailActSubSubject(this); }
}
