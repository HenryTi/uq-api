import { BStatement } from '../../builder';
import * as parser from '../../parser';
import { Builder } from "../builder";
import { IElement } from '../IElement';
import { BizBudValue, BizBinAct, BizEntity, BizPend, BizBud, BizAct, BizInAct } from '../Biz';
import { ValueExpression } from '../Exp';
import { Statement } from "./Statement";
import { SetEqu } from '../tool';

export abstract class BizActStatement<T extends BizAct> extends Statement {
    readonly bizAct: T;
    sub: BizBinSubStatement;
    constructor(parent: Statement, bizAct: T) {
        super(parent);
        this.bizAct = bizAct;
    }
}

export class BizBinActStatement extends BizActStatement<BizBinAct> {
    sub: BizBinSubStatement;
    get type(): string { return 'bizstatement'; }
    db(db: Builder): object { return db.bizBinActStatement(this); }
    parser(context: parser.PContext) { return new parser.PBizBinActStatement(this, context); }
    setNo(no: number) {
        this.no = no;
        this.sub.setNo(no);
    }
}

export class BizInActStatement extends BizActStatement<BizInAct> {
    get type(): string { return 'bizstatement'; }
    db(db: Builder): object { return db.bizInActStatement(this); }
    parser(context: parser.PContext) { return new parser.PBizInActStatement(this, context); }
    setNo(no: number) {
        this.no = no;
        this.sub.setNo(no);
    }
}

export abstract class BizBinSubStatement extends Statement {
    abstract parser(context: parser.PContext): parser.PElement;
    abstract db(db: Builder): BStatement;
}

export class BizBinPendStatement extends BizBinSubStatement {
    readonly bizStatement: BizActStatement<any>;
    readonly sets: [BizBud, ValueExpression][] = [];
    pend: BizPend;
    setEqu: SetEqu;             // 仅用于 Pend -= val;
    val: ValueExpression;       // 仅用于 Pend -= val;

    constructor(bizStatement: BizActStatement<any>) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'bizpend'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizBinPendStatement(this, context);
    }
    db(db: Builder): BStatement { return db.bizDetailActSubPend(this); }
}

export class BizBinTitleStatement extends BizBinSubStatement {
    readonly bizStatement: BizActStatement<any>;
    entity: BizEntity;
    bud: BizBudValue;
    of: ValueExpression;
    setEqu: SetEqu;
    val: ValueExpression;

    constructor(bizStatement: BizActStatement<any>) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'biztitle'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizBinTitleStatement(this, context);
    }
    db(db: Builder): BStatement { return db.bizDetailActSubSubject(this); }
}
